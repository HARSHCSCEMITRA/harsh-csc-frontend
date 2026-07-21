// api/parse-qr.js - Vercel Serverless Function to fetch & parse eSign Jamabandi QR URLs
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let inputUrl = req.query.url || req.body?.url;
  let usn = req.query.usn || req.body?.usn;

  if (!inputUrl && !usn) {
    return res.status(400).json({ error: "Missing 'url' or 'usn' parameter." });
  }

  let targetUrl = inputUrl;
  if (!targetUrl && usn) {
    targetUrl = `https://apnakhata.rajasthan.gov.in/qr.aspx?usn=${encodeURIComponent(usn)}`;
  } else if (targetUrl && !targetUrl.startsWith('http')) {
    targetUrl = `https://apnakhata.rajasthan.gov.in/qr.aspx?usn=${encodeURIComponent(targetUrl)}`;
  }

  try {
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const htmlText = await fetchRes.text();
    let decodedHtml = htmlText;

    // Extract ViewState if base64 encoded
    const vsMatch = htmlText.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
    if (vsMatch) {
      try {
        const buf = Buffer.from(vsMatch[1], 'base64');
        decodedHtml = buf.toString('utf-8');
      } catch (e) {
        console.warn("ViewState decode failed, using raw HTML:", e);
      }
    }

    // Extract Village, Tehsil, District, Khata
    let village = "अज्ञात ग्राम";
    let tehsil = "अज्ञात तहसील";
    let district = "अज्ञात जिला";
    let khata = "1";
    let totalArea = 0;

    const vilMatch = decodedHtml.match(/ग्राम\s*का\s*नाम\s*:-?\s*([^<]+)/);
    if (vilMatch) village = vilMatch[1].trim();

    const tehMatch = decodedHtml.match(/तहसील\s*:-?\s*([^<]+)/);
    if (tehMatch) tehsil = tehMatch[1].trim();

    const distMatch = decodedHtml.match(/जिला\s*:-?\s*([^<]+)/);
    if (distMatch) district = distMatch[1].trim();

    const khataMatch = decodedHtml.match(/खाता\s*संख्या\s*नया\s*:-?\s*(\d+)/) || decodedHtml.match(/खाता\s*संख्या\s*:-?\s*(\d+)/);
    if (khataMatch) khata = khataMatch[1].trim();

    // Extract Total Khata Area from 'कुल खसरे' row or Khasra sum
    const totAreaMatch = decodedHtml.match(/कुल\s*खसरे\s*-[^<]*?<\/td>\s*<td[^>]*>([\d\.]+)/);
    if (totAreaMatch) {
      totalArea = parseFloat(totAreaMatch[1]) || 0;
    }

    // Extract Khasra numbers
    const khasraList = [];
    const khasraMatches = decodedHtml.matchAll(/<td class='no-border'>(\d+[\/\d]*)<\/td>\s*<td class='no-border'>([\d\.]+)<\/td>/g);
    for (const m of khasraMatches) {
      khasraList.push({ khasra: m[1], area: parseFloat(m[2]) || 0 });
    }

    if (totalArea === 0 && khasraList.length > 0) {
      totalArea = khasraList.reduce((acc, k) => acc + k.area, 0);
    }

    // Extract Kashtkars (काश्तकार का नाम)
    const rawOwners = [];
    const ownerMatches = decodedHtml.matchAll(/<td[^>]*>\s*(\d+)\.\s*([^<]+)<\/td>/g);

    for (const m of ownerMatches) {
      const rawLine = m[2].trim();
      
      // Check if line contains Hindi text (valid Kashtkar name)
      if (!/[\u0900-\u097F]/.test(rawLine)) continue;

      // Extract share fraction e.g. हिस्सा- 1/30 or 7/180
      let fracNum = 1;
      let fracDen = 1;
      let fracStr = "1/1";

      const fracMatch = rawLine.match(/हिस्सा\s*[-:\s]*(\d+)\/(\d+)/) || rawLine.match(/(\d+)\/(\d+)/);
      if (fracMatch) {
        fracNum = parseInt(fracMatch[1]);
        fracDen = parseInt(fracMatch[2]);
        fracStr = `${fracNum}/${fracDen}`;
      }

      // Clean owner name & extract caste, guardian, relation
      let cleanName = rawLine.split(/हिस्सा|जाति|सा\./)[0].trim();
      if (!cleanName) cleanName = rawLine;

      let caste = "";
      const casteMatch = rawLine.match(/जाति\s*[-:\s]*([^\s]+)/);
      if (casteMatch) caste = casteMatch[1].trim();

      let relation = "पुत्र";
      let guardian = "";
      const relMatch = rawLine.match(/(पुत्र|पत्नी|पुत्री)\s+([^\s]+)/);
      if (relMatch) {
        relation = relMatch[1];
        guardian = relMatch[2];
      }

      // Extract primary Kashtkar name before relation
      let primaryName = cleanName.split(/पुत्र|पत्नी|पुत्री/)[0].trim();
      if (!primaryName) primaryName = cleanName;

      const ownerArea = totalArea * (fracNum / fracDen);

      rawOwners.push({
        idx: m[1],
        raw: rawLine,
        name: cleanName,
        primaryName: primaryName,
        relation: relation,
        guardian: guardian,
        caste: caste,
        fracStr: fracStr,
        fracVal: fracNum / fracDen,
        area: ownerArea,
        bigha: ownerArea * 3.95
      });
    }

    return res.status(200).json({
      success: true,
      village,
      tehsil,
      district,
      khata,
      totalArea,
      totalBigha: totalArea * 3.95,
      khasras: khasraList,
      owners: rawOwners,
      sourceUrl: targetUrl
    });
  } catch (err) {
    console.error("Error in parse-qr function:", err);
    return res.status(500).json({ error: "Failed to fetch or parse eSign QR page: " + err.message });
  }
}
