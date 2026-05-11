// /api/fetch-updates.js
// Vercel Serverless Function — Auto fetch from all sources
// RSS + Telegram public channels + Google Docs (published)
// Cron: every 2 hours — 100% FREE

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase();
  if (t.match(/result|परिणाम/)) return 'result';
  if (t.match(/admit|hall ticket/)) return 'admit_card';
  if (t.match(/admission|प्रवेश/)) return 'admission';
  if (t.match(/yojana|योजना|scheme|kisan|किसान|welfare/)) return 'yojana';
  if (t.match(/vacancy|recruitment|bharti|भर्ती|notification|exam|post|apply/)) return 'exam';
  return 'news';
}

function cleanHtml(str = '') {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function makeSummary(text = '', maxLen = 300) {
  const clean = cleanHtml(text);
  return clean.length > maxLen ? clean.substring(0, maxLen) + '...' : clean;
}

async function isDuplicate(title, sourceId) {
  const { data } = await supabase
    .from('gov_updates')
    .select('id')
    .eq('title', title.substring(0, 200))
    .eq('source_id', sourceId)
    .limit(1);
  return data && data.length > 0;
}

async function insertUpdate(item) {
  const { error } = await supabase.from('gov_updates').insert({
    source_id:    item.source_id,
    title:        item.title.substring(0, 300),
    summary:      (item.summary || '').substring(0, 500),
    full_content: (item.full_content || '').substring(0, 5000),
    category:     item.category,
    source_name:  item.source_name,
    source_url:   item.source_url,
    original_url: item.original_url || '',
    has_pdf:      item.has_pdf || false,
    pdf_url:      item.pdf_url || '',
    has_image:    item.has_image || false,
    image_url:    item.image_url || '',
    is_important: item.is_important || false,
    published_at: item.published_at || new Date().toISOString(),
  });
  return !error;
}

// ─────────────────────────────────────────
// 1. RSS FETCH
// ─────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'HarshCSCeMitra/1.0 NewsBot' },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
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

      const link      = get('link') || get('guid');
      const desc      = get('description') || get('content:encoded') || '';
      const pubDate   = get('pubDate') || get('dc:date') || '';
      const enclosure = raw.match(/enclosure[^>]+url="([^"]+)"/i)?.[1] || '';
      const hasPdf    = enclosure.toLowerCase().includes('.pdf') || link.toLowerCase().includes('.pdf');
      const hasImage  = !!enclosure && !hasPdf;

      items.push({
        title,
        original_url: link,
        summary: makeSummary(desc),
        full_content: cleanHtml(desc).substring(0, 3000),
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        has_pdf: hasPdf,
        pdf_url: hasPdf ? (enclosure || link) : '',
        has_image: hasImage,
        image_url: hasImage ? enclosure : '',
        is_important: /important|urgent|last date|aakhri|आखिरी/i.test(title),
      });
    }
    return items.slice(0, 25);
  } catch (e) {
    console.error(`[RSS] Failed: ${source.url} —`, e.message);
    return [];
  }
}

// ─────────────────────────────────────────
// 2. TELEGRAM PUBLIC CHANNEL
// No API key needed — public channels ka web view use karta hai
// URL format in DB: https://t.me/s/channelname
// ─────────────────────────────────────────
async function fetchTelegram(source) {
  try {
    const channelUrl = source.url.includes('/s/')
      ? source.url
      : source.url.replace('t.me/', 't.me/s/');

    const res = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HarshCSCBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    const items = [];
    // Telegram web page se messages extract karo
    const msgBlocks = html.matchAll(
      /class="tgme_widget_message_bubble"[^>]*>([\s\S]*?)(?=class="tgme_widget_message_bubble"|<\/div>\s*<\/div>\s*<\/div>\s*<\/article)/gi
    );

    const allLinks = [...html.matchAll(/href="(https:\/\/t\.me\/[^"\/]+\/\d+)"/gi)];
    const allDates = [...html.matchAll(/<time[^>]+datetime="([^"]+)"/gi)];
    let idx = 0;

    for (const m of msgBlocks) {
      const block = m[1];
      const text  = cleanHtml(block.replace(/<a [^>]+>/gi, '').replace(/<\/a>/gi, ''));
      if (!text || text.length < 15) { idx++; continue; }

      const lines  = text.split('\n').map(l => l.trim()).filter(l => l.length > 4);
      const title  = lines[0]?.substring(0, 200) || text.substring(0, 100);
      const summary = lines.slice(1).join(' ').substring(0, 300);

      const msgLink = allLinks[idx]?.[1] || channelUrl;
      const pubDate = allDates[idx]?.[1]  || new Date().toISOString();
      const pdfLink = block.match(/href="([^"]+\.pdf)"/i)?.[1] || '';
      const imgLink = block.match(/src="([^"]+\.(jpg|jpeg|png|webp))"/i)?.[1] || '';

      items.push({
        title,
        summary,
        full_content: text.substring(0, 3000),
        original_url: msgLink,
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: new Date(pubDate).toISOString(),
        has_pdf: !!pdfLink,
        pdf_url: pdfLink,
        has_image: !!imgLink,
        image_url: imgLink,
        is_important: /important|urgent|last date|आखिरी/i.test(title),
      });
      idx++;
      if (items.length >= 20) break;
    }
    return items;
  } catch (e) {
    console.error(`[Telegram] Failed: ${source.url} —`, e.message);
    return [];
  }
}

// ─────────────────────────────────────────
// 3. GOOGLE DOCS (Published URL)
// Admin: File > Share > Publish to web > copy link
// ─────────────────────────────────────────
async function fetchGoogleDoc(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'HarshCSCBot/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    // Google Doc published HTML mein paragraphs aur headings
    const items = [];
    // Har H1/H2/H3 ek alag update banega
    const sections = html.split(/<h[1-3][^>]*>/i);

    for (const section of sections.slice(1, 21)) {
      const titleEnd = section.indexOf('</h');
      if (titleEnd === -1) continue;
      const title   = cleanHtml(section.substring(0, titleEnd));
      if (!title || title.length < 5) continue;
      const body    = section.substring(titleEnd);
      const summary = makeSummary(body, 300);

      items.push({
        title,
        summary,
        full_content: cleanHtml(body).substring(0, 3000),
        original_url: source.url,
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id,
        source_name: source.name,
        source_url: source.url,
        published_at: new Date().toISOString(),
        has_pdf: false,
        pdf_url: '',
        has_image: false,
        image_url: '',
        is_important: /important|urgent|last date/i.test(title),
      });
    }
    return items;
  } catch (e) {
    console.error(`[GoogleDoc] Failed: ${source.url} —`, e.message);
    return [];
  }
}

// ─────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {
    rss:        { sources: 0, inserted: 0 },
    telegram:   { sources: 0, inserted: 0 },
    google_doc: { sources: 0, inserted: 0 },
    total_inserted: 0,
    timestamp: new Date().toISOString()
  };

  try {
    const { data: sources, error } = await supabase
      .from('gov_sources')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!sources?.length) return res.status(200).json({ message: 'No active sources', ...results });

    for (const source of sources) {
      let items = [];
      const type = source.source_type;

      if (type === 'rss')        { results.rss.sources++;        items = await fetchRSS(source); }
      else if (type === 'telegram')  { results.telegram.sources++;   items = await fetchTelegram(source); }
      else if (type === 'google_doc'){ results.google_doc.sources++; items = await fetchGoogleDoc(source); }
      else continue; // manual — skip

      for (const item of items) {
        if (await isDuplicate(item.title, source.id)) continue;
        const ok = await insertUpdate(item);
        if (ok) {
          if (type === 'rss') results.rss.inserted++;
          else if (type === 'telegram') results.telegram.inserted++;
          else results.google_doc.inserted++;
          results.total_inserted++;
        }
      }

      await supabase
        .from('gov_sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', source.id);
    }

    return res.status(200).json({ success: true, ...results });

  } catch (e) {
    console.error('[CRON] Fatal:', e);
    return res.status(500).json({ error: e.message });
  }
}
