// /api/fetch-updates.js — ES Module format
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  return str.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}

function makeSummary(text = '', maxLen = 300) {
  const clean = cleanHtml(text);
  return clean.length > maxLen ? clean.substring(0, maxLen) + '...' : clean;
}

async function isDuplicate(title, sourceId) {
  const { data } = await supabase
    .from('gov_updates').select('id')
    .eq('title', title.substring(0, 200))
    .eq('source_id', sourceId).limit(1);
  return data && data.length > 0;
}

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
    console.error(`RSS failed: ${source.url}`, e.message);
    return [];
  }
}

async function fetchTelegram(source) {
  try {
    const url = source.url.includes('/s/') ? source.url : source.url.replace('t.me/', 't.me/s/');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HarshCSCBot/1.0)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    const items = [];
    const allDates = [...html.matchAll(/<time[^>]+datetime="([^"]+)"/gi)];
    const allLinks = [...html.matchAll(/href="(https:\/\/t\.me\/[^"\/]+\/\d+)"/gi)];
    const msgBlocks = [...html.matchAll(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
    msgBlocks.slice(0, 20).forEach((m, i) => {
      const text = cleanHtml(m[1]);
      if (!text || text.length < 15) return;
      const lines = text.split('\n').filter(l => l.trim().length > 4);
      const title = lines[0]?.substring(0, 200) || text.substring(0, 100);
      items.push({
        title,
        summary: lines.slice(1).join(' ').substring(0, 300),
        full_content: text.substring(0, 3000),
        original_url: allLinks[i]?.[1] || url,
        category: source.category !== 'other' ? source.category : detectCategory(title),
        source_id: source.id, source_name: source.name, source_url: source.url,
        published_at: allDates[i]?.[1] ? new Date(allDates[i][1]).toISOString() : new Date().toISOString(),
        is_important: /last date|important|urgent/i.test(title),
        has_pdf: false, pdf_url: '', has_image: false, image_url: ''
      });
    });
    return items;
  } catch (e) {
    console.error(`Telegram failed: ${source.url}`, e.message);
    return [];
  }
}

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
    console.error(`GoogleDoc failed: ${source.url}`, e.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const results = { rss: 0, telegram: 0, google_doc: 0, total: 0, errors: [] };

  try {
    const { data: sources, error: srcErr } = await supabase
      .from('gov_sources').select('*').eq('is_active', true);
    if (srcErr) throw srcErr;
    if (!sources?.length) return res.status(200).json({ message: 'No active sources', results });

    for (const source of sources) {
      let items = [];
      try {
        if (source.source_type === 'rss') items = await fetchRSS(source);
        else if (source.source_type === 'telegram') items = await fetchTelegram(source);
        else if (source.source_type === 'google_doc') items = await fetchGoogleDoc(source);
        else continue;
      } catch(e) {
        results.errors.push(`${source.name}: ${e.message}`);
        continue;
      }

      for (const item of items) {
        if (await isDuplicate(item.title, source.id)) continue;
        const { error } = await supabase.from('gov_updates').insert(item);
        if (!error) {
          results[source.source_type === 'google_doc' ? 'google_doc' : source.source_type]++;
          results.total++;
        }
      }

      await supabase.from('gov_sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', source.id);
    }

    return res.status(200).json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[CRON] Fatal:', e);
    return res.status(500).json({ error: e.message, results });
  }
}
