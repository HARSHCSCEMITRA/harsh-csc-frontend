// /api/fetch-updates.js
// NO external packages — pure fetch() se Supabase REST API use karta hai
// Vercel ES Module compatible
// v2 — Fixed: Telegram URL mismatch, text truncation, better content extraction

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
function detectCategory(title = '', summary = '') {
  const t = (title + ' ' + summary).toLowerCase();
  if (t.match(/result|परिणाम|merit list|cut.?off declared|parinaam/)) return 'result';
  if (t.match(/admit|hall ticket|प्रवेश पत्र|pravesha/)) return 'admit_card';
  if (t.match(/admission|प्रवेश|counselling|seat allot|neet|jee |cuet/)) return 'admission';
  if (t.match(/yojana|योजना|scheme|kisan|किसान|subsidy|pension|scholarship/)) return 'yojana';
  if (t.match(/vacancy|recruitment|bharti|भर्ती|exam|apply|notification|last date|आवेदन/)) return 'exam';
  return 'news';
}

function cleanHtml(str = '') {
  return str
    .replace(/<br\s*\/?>/gi, '\n')    // <br> → newline preserve karein
    .replace(/<\/p>/gi, '\n')          // </p> → newline
    .replace(/<[^>]+>/g, ' ')          // baaki tags hataao
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{4,}/g, '\n\n\n')      // excess blank lines
    .replace(/[ \t]{2,}/g, ' ')        // multiple spaces
    .trim();
}

// Title aur summary smart split — puri content preserve karo
function splitContent(text, maxTitle = 500, maxSummary = 2000) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { title: '', summary: '' };

  // First 3 lines title mein jaayengi (ya jab tak 500 chars na ho jaayein)
  let titleParts = [];
  let charCount = 0;
  let splitAt = 0;
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    if (charCount + lines[i].length > maxTitle) break;
    titleParts.push(lines[i]);
    charCount += lines[i].length;
    splitAt = i + 1;
  }
  // Agar sirf ek hi lambi line hai — 500 pe split karo
  if (titleParts.length === 0) {
    titleParts = [lines[0].substring(0, maxTitle)];
    splitAt = 1;
  }
  const title = titleParts.join('\n');
  const summaryParts = lines.slice(splitAt);
  const summary = summaryParts.join('\n').substring(0, maxSummary);
  return { title, summary };
}

function makeSummary(text = '', max = 2000) {
  const c = cleanHtml(text);
  return c.length > max ? c.substring(0, max) + '...' : c;
}

async function isDuplicate(title, sourceId) {
  const data = await sbSelect('gov_updates',
    `select=id&title=eq.${encodeURIComponent(title.substring(0, 200))}&source_id=eq.${sourceId}&limit=1`
  );
  return Array.isArray(data) && data.length > 0;
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
      const rawTitle = get('title');
      if (!rawTitle || rawTitle.length < 5) continue;

      const link    = get('link') || get('guid');
      const desc    = get('description') || get('content:encoded') || '';
      const pubDate = get('pubDate') || get('dc:date') || '';
      const fullText = cleanHtml(desc);
      // RSS title pura rakho — article ka proper title hota hai
      const title = rawTitle.substring(0, 500);
      const summary = fullText.substring(0, 2000);

      items.push({
        title,
        original_url: link,
        summary,
        full_content: fullText.substring(0, 5000),
        category: source.category !== 'other' ? source.category : detectCategory(title, summary),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        is_important: /last date|vacancy|result declared|important|अंतिम तिथि/i.test(title),
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
// FIX: Ab har message ka link, date, aur text ek saath parse hoga
// Pehle allLinks[i] aur msgBlocks[i] alag arrays se match ho rahe the → wrong URL
async function fetchTelegram(source) {
  try {
    const url = source.url.includes('/s/')
      ? source.url
      : source.url.replace('https://t.me/', 'https://t.me/s/').replace('http://t.me/', 'https://t.me/s/');

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HarshCSCBot/1.0)' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const items = [];

    // ── Step 1: Pehle har message ka outer wrapper pakdo
    // data-post="channelname/123" se sahi post ID milega
    // Regex: har message block independently parse karein
    // Each block: data-post="..." se next data-post= tak
    const wrapperRe = /data-post="([^"]+)"([\s\S]*?)(?=data-post="|<\/section>)/gi;
    const wrappers = [...html.matchAll(wrapperRe)];

    for (const wrapper of wrappers.slice(0, 25)) {
      const postPath = wrapper[1];          // e.g. "eservicesemitrarajasthan/595"
      const blockHtml = wrapper[2];         // is post ka pura HTML

      // ── Sahi post URL (isi block se) ──
      const postUrl = `https://t.me/${postPath}`;

      // ── Date (isi block se) ──
      const dateMatch = blockHtml.match(/<time[^>]+datetime="([^"]+)"/i);
      const pubDate = dateMatch
        ? new Date(dateMatch[1]).toISOString()
        : new Date().toISOString();

      // ── Message text (isi block se) ──
      const textMatch = blockHtml.match(
        /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      );
      if (!textMatch) continue;

      const rawText = cleanHtml(textMatch[1]);
      if (!rawText || rawText.trim().length < 10) continue;

      // ── Junk filter: Telegram system messages ──
      const junkPatterns = [
        /^channel created$/i,
        /^messages in this channel will/i,
        /^pinned message/i,
        /^document from\s*\.?\s*$/i,
        /^voice message$/i,
        /^video message$/i,
        /^photo$/i,
        /^sticker$/i,
      ];
      if (junkPatterns.some(p => p.test(rawText.trim()))) continue;

      // ── Bare URL filter ──
      if (/^https?:\/\/\S+$/.test(rawText.trim())) continue;

      // ── PDF attachment detect ──
      const hasPdf = blockHtml.includes('.pdf') || blockHtml.includes('tgme_widget_message_document');
      const pdfMatch = blockHtml.match(/href="(https?:\/\/[^"]+\.pdf)"/i);
      const pdfUrl = pdfMatch ? pdfMatch[1] : '';

      // ── Title + Summary smart split ──
      const { title, summary } = splitContent(rawText, 500, 2000);
      if (!title || title.length < 10) continue;

      items.push({
        title,
        summary,
        full_content: rawText.substring(0, 5000),
        original_url: postUrl,               // ✅ Ab sahi post URL — isi block se
        category: source.category !== 'other'
          ? source.category
          : detectCategory(title, summary),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: pubDate,
        is_important: /last date|important|urgent|अंतिम तिथि|breaking/i.test(title),
        has_pdf: hasPdf,
        pdf_url: pdfUrl,
        has_image: false,
        image_url: ''
      });
    }
    return items;
  } catch (e) {
    console.error(`Telegram failed: ${source.name}`, e.message);
    return [];
  }
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
      const bodyText = cleanHtml(section.substring(titleEnd));
      items.push({
        title: title.substring(0, 500),
        summary: bodyText.substring(0, 2000),
        full_content: bodyText.substring(0, 5000),
        original_url: source.url,
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: new Date().toISOString(),
        is_important: /important|last date|अंतिम तिथि/i.test(title),
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

  const results = { rss: 0, telegram: 0, google_doc: 0, total: 0, errors: [] };

  try {
    const sources = await sbSelect('gov_sources', 'is_active=eq.true');
    if (!Array.isArray(sources) || sources.length === 0) {
      return res.status(200).json({ message: 'No active sources', results });
    }

    for (const source of sources) {
      let items = [];
      try {
        if (source.source_type === 'rss')             items = await fetchRSS(source);
        else if (source.source_type === 'telegram')   items = await fetchTelegram(source);
        else if (source.source_type === 'google_doc') items = await fetchGoogleDoc(source);
        else continue;
      } catch (e) {
        results.errors.push(`${source.name}: ${e.message}`);
        continue;
      }

      for (const item of items) {
        try {
          if (await isDuplicate(item.title, source.id)) continue;
          const ok = await sbInsert('gov_updates', item);
          if (ok) {
            const key = source.source_type === 'google_doc' ? 'google_doc' : source.source_type;
            results[key] = (results[key] || 0) + 1;
            results.total++;
          }
        } catch (e) { /* skip single item error */ }
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
