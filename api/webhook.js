// /api/webhook.js
// Kisi bhi external source se news receive karo aur Supabase mein save karo
// Vercel pe automatically deploy hoga

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; // Vercel env mein daalo

// ── HMAC Signature Verify ─────────────────────────────
async function verifySignature(body, signature) {
  if (!WEBHOOK_SECRET) return true; // Dev mode — secret nahi hai to skip
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = 'sha256=' + Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Supabase Insert ───────────────────────────────────
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

// ── Duplicate Check ───────────────────────────────────
async function isDuplicate(title, originalUrl) {
  const check = await fetch(
    `${SB_URL}/rest/v1/gov_updates?select=id&original_url=eq.${encodeURIComponent(originalUrl)}&limit=1`,
    {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`
      }
    }
  );
  const data = await check.json();
  return Array.isArray(data) && data.length > 0;
}

// ── Category Auto-Detect ──────────────────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase();
  if (t.match(/result|परिणाम/)) return 'result';
  if (t.match(/admit|hall ticket/)) return 'admit_card';
  if (t.match(/admission|प्रवेश/)) return 'admission';
  if (t.match(/yojana|योजना|scheme|kisan/)) return 'yojana';
  if (t.match(/vacancy|recruitment|bharti|भर्ती|exam|apply/)) return 'exam';
  return 'news';
}

// ── Main Handler ──────────────────────────────────────
export default async function handler(req, res) {

  // CORS — dusri website se request aane dena hai
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  // ── Auth — 2 tarike se verify ─────────────────────
  // Tarika 1: Simple secret header
  const simpleSecret = req.headers['x-webhook-secret'];
  if (WEBHOOK_SECRET && simpleSecret !== WEBHOOK_SECRET) {
    // Tarika 2: HMAC signature (zyada secure)
    const hmacSig = req.headers['x-hub-signature-256'];
    const bodyStr = JSON.stringify(req.body);
    const valid = await verifySignature(bodyStr, hmacSig);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized — secret galat hai' });
    }
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Supabase config missing' });
  }

  const body = req.body;

  // ── Body formats accept karo ──────────────────────
  // Format 1: Single article
  // { title, url, summary, category, tags, source_name }

  // Format 2: Array of articles
  // { articles: [...] }

  // Format 3: Simple text (kisi bhi site se)
  // { text, link, source }

  let articles = [];

  if (Array.isArray(body.articles)) {
    articles = body.articles;
  } else if (Array.isArray(body)) {
    articles = body;
  } else if (body.title || body.text) {
    articles = [body];
  } else {
    return res.status(400).json({ error: 'Invalid format. title/articles field chahiye.' });
  }

  const results = { inserted: 0, skipped: 0, errors: [] };

  for (const item of articles) {
    try {
      const title = (item.title || item.text || '').trim().substring(0, 300);
      const url   = item.url || item.link || item.original_url || '';
      if (!title || title.length < 5) { results.skipped++; continue; }

      // Duplicate check
      if (url && await isDuplicate(title, url)) {
        results.skipped++;
        continue;
      }

      const record = {
        title,
        original_url:  url,
        summary:       (item.summary || item.description || '').substring(0, 500),
        full_content:  (item.full_content || item.content || item.summary || '').substring(0, 5000),
        category:      item.category || detectCategory(title),
        source_name:   item.source_name || item.source || 'External Webhook',
        source_url:    item.source_url || url,
        source_id:     item.source_id || null,
        published_at:  item.published_at || item.date || new Date().toISOString(),
        is_important:  item.is_important || /important|urgent|last date|admit card/i.test(title) || false,
        has_pdf:       item.has_pdf || (url || '').toLowerCase().endsWith('.pdf') || false,
        pdf_url:       item.pdf_url || ((url || '').toLowerCase().endsWith('.pdf') ? url : ''),
        has_image:     item.has_image || false,
        image_url:     item.image_url || '',
      };

      const ok = await sbInsert('gov_updates', record);
      if (ok) results.inserted++;
      else results.errors.push(`Insert failed: ${title.substring(0, 50)}`);

    } catch(e) {
      results.errors.push(e.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: `${results.inserted} articles saved, ${results.skipped} skipped`,
    results,
    timestamp: new Date().toISOString()
  });
}