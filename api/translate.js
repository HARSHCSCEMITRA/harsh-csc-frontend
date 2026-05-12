// /api/translate.js
// MyMemory Free Translation API — No API key, No cost
// 1000 requests/day free — enough for eMitra use

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, summary } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  async function translateText(text) {
    if (!text || text.trim().length === 0) return '';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|hi`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.responseStatus === 200) {
      return data.responseData.translatedText || text;
    }
    return text;
  }

  try {
    // Title aur summary alag alag translate karo
    const [translatedTitle, translatedSummary] = await Promise.all([
      translateText(title),
      translateText(summary || '')
    ]);

    return res.status(200).json({
      title: translatedTitle,
      summary: translatedSummary
    });
  } catch (e) {
    console.error('Translate error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
