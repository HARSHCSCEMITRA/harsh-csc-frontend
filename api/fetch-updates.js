// /api/fetch-updates.js
// NO external packages — pure fetch() se Supabase REST API use karta hai
// Vercel ES Module compatible

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Supabase REST helpers ──────────────────────────────
async function sbSelect(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

async function sbUpdate(table, match, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

// ── Helpers ───────────────────────────────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase();
  if (t.match(/result|परिणाम/)) return 'result';
  if (t.match(/admit|hall ticket/)) return 'admit_card';
  if (t.match(/admission|प्रवेश/)) return 'admission';
  if (t.match(/yojana|योजना|scheme|kisan|किसान/)) return 'yojana';
  if (t.match(/vacancy|recruitment|bharti|भर्ती|exam|apply|post/)) return 'exam';
  return 'news';
}

function cleanHtml(str = '') {
  return str.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}

function makeSummary(text = '', max = 300) {
  const c = cleanHtml(text);
  return c.length > max ? c.substring(0, max) + '...' : c;
}

async function isDuplicate(title, sourceId, originalUrl) {
  // Check 1: Title + source_id match
  const byTitle = await sbSelect('gov_updates',
    `select=id&title=eq.${encodeURIComponent(title.substring(0,200))}&source_id=eq.${sourceId}&limit=1`
  );
  if (Array.isArray(byTitle) && byTitle.length > 0) return true;

  // Check 2: original_url match (prevents re-insert after manual delete)
  if (originalUrl) {
    const byUrl = await sbSelect('gov_updates',
      `select=id&original_url=eq.${encodeURIComponent(originalUrl)}&limit=1`
    );
    if (Array.isArray(byUrl) && byUrl.length > 0) return true;
  }
  return false;
}

// ── RSS Fetch ─────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'HarshCSCeMitra/1.0 NewsBot' },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const m of matches) {
      const raw = m[1];
      const get = (tag) => {
        const cdata = raw.match(new RegExp(`<${tag}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
        const plain = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return (cdata?.[1] || plain?.[1] || '').trim();
      };
      const title = get('title');
      if (!title || title.length < 5) continue;
      const link    = get('link') || get('guid');
      const desc    = get('description') || get('content:encoded') || '';
      const pubDate = get('pubDate') || get('dc:date') || '';
      items.push({
        title: title.substring(0, 300),
        original_url: link,
        summary: makeSummary(desc),
        full_content: cleanHtml(desc).substring(0, 3000),
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        is_important: /last date|vacancy|result declared|important/i.test(title),
        has_pdf: false, pdf_url: '', has_image: false, image_url: ''
      });
    }
    return items.slice(0, 25);
  } catch (e) {
    console.error(`RSS failed: ${source.name}`, e.message);
    return [];
  }
}

// ── Telegram Fetch ────────────────────────────────────
// Multi-page: 3 pages × ~20 msgs = ~60 messages per source per cron run
async function fetchTelegramPage(channelUrl, beforeMsgId = null) {
  const url = beforeMsgId ? `${channelUrl}?before=${beforeMsgId}` : channelUrl;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HarshCSCBot/1.0)' },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return { html: '', ok: false };
  return { html: await res.text(), ok: true };
}

function parseTelegramPage(html, baseUrl, source) {
  const items = [];
  const wrapperRe = /data-post="([^"]+)"([\s\S]*?)(?=data-post="|<\/section>|$)/gi;
  const wrappers = [...html.matchAll(wrapperRe)];

  for (const wrapper of wrappers) {
    const postPath = wrapper[1];
    const blockHtml = wrapper[2];
    const msgIdMatch = postPath.match(/\/(\d+)$/);
    const msgId = msgIdMatch ? parseInt(msgIdMatch[1]) : null;
    const postUrl = `https://t.me/${postPath}`;

    let pubDate = new Date().toISOString();
    const dateMatch = blockHtml.match(/<time[^>]+datetime="([^"]+)"/i);
    if (dateMatch) {
      try { const d = new Date(dateMatch[1]); if (!isNaN(d.getTime())) pubDate = d.toISOString(); } catch(e) {}
    }

    const textMatch = blockHtml.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!textMatch) continue;
    const rawText = cleanHtml(textMatch[1]);
    if (!rawText || rawText.trim().length < 10) continue;

    const junkPatterns = [/^channel created$/i, /^messages in this channel will/i,
      /^pinned message/i, /^document from\s*\.?\s*$/i,
      /^voice message$/i, /^video message$/i, /^photo$/i, /^sticker$/i];
    if (junkPatterns.some(p => p.test(rawText.trim()))) continue;
    if (/^https?:\/\/\S+$/.test(rawText.trim())) continue;

    const hasPdf = blockHtml.includes('.pdf') || blockHtml.includes('tgme_widget_message_document');
    const pdfMatch = blockHtml.match(/href="(https?:\/\/[^"]+\.pdf)"/i);
    const { title, summary } = splitContent(rawText, 500, 2000);
    if (!title || title.length < 10) continue;

    items.push({
      title, summary,
      full_content: rawText.substring(0, 5000),
      original_url: postUrl,
      category: source.category !== 'other' ? source.category : detectCategory(title, summary),
      source_id: source.id, source_name: source.name, source_url: source.url,
      published_at: pubDate,
      is_important: /last date|important|urgent|\u0905\u0902\u0924\u093f\u092e \u0924\u093f\u0925\u093f|breaking/i.test(title),
      has_pdf: hasPdf, pdf_url: pdfMatch ? pdfMatch[1] : '',
      has_image: false, image_url: '', _msgId: msgId
    });
  }
  return items;
}

async function fetchTelegram(source, days = 30) {
  try {
    const baseUrl = source.url.includes('/s/')
      ? source.url
      : source.url.replace('https://t.me/', 'https://t.me/s/').replace('http://t.me/', 'https://t.me/s/');

    const items = [];
    let lastMsgId = null;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // days ke hisab se pages calculate karo
    // ~20 msgs/page, ~5 msgs/day avg → days*5/20 = days/4 pages (min 2, max 15)
    const MAX_PAGES = Math.min(15, Math.max(2, Math.ceil(days / 4)));

    for (let page = 0; page < MAX_PAGES; page++) {
      const { html, ok } = await fetchTelegramPage(baseUrl, lastMsgId);
      if (!ok || !html) break;
      const pageItems = parseTelegramPage(html, baseUrl, source);
      if (!pageItems.length) break;

      // Cutoff se purane items skip karo aur loop band karo
      let hitCutoff = false;
      for (const item of pageItems) {
        if (new Date(item.published_at) < cutoffDate) { hitCutoff = true; break; }
        items.push(item);
      }
      if (hitCutoff) break;

      const firstMsgId = pageItems[pageItems.length - 1]?._msgId;
      if (!firstMsgId || firstMsgId === lastMsgId) break;
      lastMsgId = firstMsgId;
      if (page < MAX_PAGES - 1) await new Promise(r => setTimeout(r, 800));
    }

    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.original_url)) return false;
      seen.add(item.original_url);
      return true;
    });
  } catch (e) {
    console.error(`Telegram failed: ${source.name}`, e.message);
    return [];
  }
}

// ── JS Website Fetch (MLSU + Govt sites via Scraping APIs) ───────────
async function fetchJsSite(source) {
  const SCRAPERS = {
    scrapingant: (key, url) => `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(url)}&x-api-key=${key}&browser=true&proxy_type=datacenter`,
    scrape_do:   (key, url) => `https://api.scrape.do/?token=${key}&url=${encodeURIComponent(url)}&render=true`,
    scrapingbee: (key, url) => `https://app.scrapingbee.com/api/v1/?api_key=${key}&url=${encodeURIComponent(url)}&render_js=true&block_resources=true&wait=2000`,
    scrapfly:    (key, url) => `https://api.scrapfly.io/scrape?key=${key}&url=${encodeURIComponent(url)}&asp=true&render_js=true`,
  };
  const KEYS = {
    scrapingant: process.env.SCRAPINGANT_API_KEY,
    scrape_do:   process.env.SCRAPEDO_API_KEY,
    scrapingbee: process.env.SCRAPINGBEE_API_KEY,
    scrapfly:    process.env.SCRAPFLY_API_KEY,
  };

  // scraper_api field se pata chalta hai kaunsa API use karna hai
  // agar field nahi hai to available key wala pehla API use karo
  let pId = source.scraper_api || null;
  if (!pId) {
    pId = Object.keys(KEYS).find(k => KEYS[k]) || null;
  }

  let html = '';
  try {
    if (pId && KEYS[pId] && SCRAPERS[pId]) {
      const apiUrl = SCRAPERS[pId](KEYS[pId], source.url);
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(35000) });
      if (!res.ok) throw new Error(`Scraper ${pId} HTTP ${res.status}`);
      html = await res.text();
      // Scrapfly JSON response unwrap
      if (pId === 'scrapfly') {
        try { html = JSON.parse(html).result?.content || html; } catch {}
      }
    } else {
      // Fallback: direct fetch (static pages ke liye)
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (HarshCSCBot/1.0)' },
        signal: AbortSignal.timeout(12000)
      });
      html = await res.text();
    }
  } catch(e) {
    console.error(`fetchJsSite failed: ${source.name}`, e.message);
    return [];
  }

  // HTML se links + titles extract karo
  const items = [];
  const seen = new Set();
  const re = /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>\s*([^<]{12,300})\s*<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = m[2].replace(/\s+/g,' ').trim();
    const href  = m[1].trim();
    if (seen.has(title)) continue;
    // Nav/menu links skip karo
    if (title.length < 15) continue;
    if (/^(home|about|contact|login|register|menu|back|next|prev|more)$/i.test(title)) continue;
    seen.add(title);
    const url = href.startsWith('http') ? href : (() => { try { return new URL(href, source.url).toString(); } catch { return ''; } })();
    if (!url) continue;
    items.push({
      title:        title.substring(0, 300),
      original_url: url,
      summary:      '',
      full_content: title,
      category:     source.category !== 'other' ? source.category : detectCategory(title),
      source_id:    source.id,
      source_name:  source.name,
      source_url:   source.url,
      published_at: new Date().toISOString(),
      is_important: /last date|admit card|result declared|important|urgent|आवेदन|अंतिम/i.test(title),
      has_pdf:      href.toLowerCase().endsWith('.pdf'),
      pdf_url:      href.toLowerCase().endsWith('.pdf') ? url : '',
      has_image:    false,
      image_url:    '',
    });
    if (items.length >= 30) break;
  }
  return items;
}

// ── Google Doc Fetch ──────────────────────────────────
async function fetchGoogleDoc(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'HarshCSCBot/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const items = [];
    const sections = html.split(/<h[1-3][^>]*>/i);
    sections.slice(1, 15).forEach(section => {
      const titleEnd = section.indexOf('</h');
      if (titleEnd === -1) return;
      const title = cleanHtml(section.substring(0, titleEnd));
      if (!title || title.length < 5) return;
      items.push({
        title, summary: makeSummary(section.substring(titleEnd), 300),
        full_content: cleanHtml(section).substring(0, 3000),
        original_url: source.url,
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id, source_name: source.name, source_url: source.url,
        published_at: new Date().toISOString(),
        is_important: /important|last date/i.test(title),
        has_pdf: false, pdf_url: '', has_image: false, image_url: ''
      });
    });
    return items;
  } catch (e) {
    console.error(`GoogleDoc failed: ${source.name}`, e.message);
    return [];
  }
}

// ── Main Handler ──────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase env vars missing' });

  // days param — manual fetch se aata hai (default 0 = sirf naya data)
  // days=0 → only fetch items newer than last_fetched_at (cron mode)
  // days>0 → fetch last N days (manual "Abhi Fetch Karo" mode)
  const days = Math.min(90, Math.max(0, parseInt(req.query.days) || 0));
  const isManualFetch = days > 0;

  const cutoffDate = new Date();
  if (isManualFetch) {
    cutoffDate.setDate(cutoffDate.getDate() - days);
  }

  const results = { rss: 0, telegram: 0, google_doc: 0, total: 0, errors: [], days };

  try {
    const sources = await sbSelect('gov_sources', 'is_active=eq.true');
    if (!Array.isArray(sources) || sources.length === 0) {
      return res.status(200).json({ message: 'No active sources', results });
    }

    for (const source of sources) {
      let items = [];

      // Cron mode: sirf last_fetched_at ke baad ka data fetch karo
      // Isse manually deleted items wapas nahi aayenge
      const fetchSince = isManualFetch
        ? cutoffDate
        : (source.last_fetched_at ? new Date(source.last_fetched_at) : (() => { const d = new Date(); d.setDate(d.getDate()-1); return d; })());

      try {
        if (source.source_type === 'rss')             items = await fetchRSS(source, days || 1);
        else if (source.source_type === 'telegram')   items = await fetchTelegram(source, days || 3);
        else if (source.source_type === 'google_doc') items = await fetchGoogleDoc(source);
        else if (source.source_type === 'website')    items = await fetchJsSite(source);
        else continue;
      } catch(e) {
        results.errors.push(`${source.name}: ${e.message}`);
        continue;
      }

      // fetchSince se purane items filter karo (cron mode mein)
      if (!isManualFetch) {
        items = items.filter(item =>
          !item.published_at || new Date(item.published_at) > fetchSince
        );
      } else {
        // Manual mode mein cutoff apply karo
        items = items.filter(item =>
          !item.published_at || new Date(item.published_at) >= cutoffDate
        );
      }

      for (const item of items) {
        try {
          if (await isDuplicate(item.title, source.id, item.original_url)) continue;
          const ok = await sbInsert('gov_updates', item);
          if (ok) {
            const key = source.source_type === 'google_doc' ? 'google_doc' : source.source_type;
            results[key] = (results[key] || 0) + 1;
            results.total++;
          }
        } catch(e) { /* skip single item error */ }
      }

      await sbUpdate('gov_sources', `id=eq.${source.id}`, {
        last_fetched_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[CRON] Fatal:', e);
    return res.status(500).json({ error: e.message, results });
  }
}
