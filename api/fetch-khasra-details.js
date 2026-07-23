// api/fetch-khasra-details.js - Production Vercel Serverless Function for BhuNaksha Khasra Details
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const giscode = req.query.giscode || req.body?.giscode;
  const plotno = req.query.plotno || req.body?.plotno;

  if (!giscode || !plotno) {
    return res.status(400).json({ error: "Missing 'giscode' or 'plotno' parameter." });
  }

  const targetGis = giscode.length === 19 ? giscode + '001' : giscode;

  try {
    const params = new URLSearchParams({
      state: '08',
      giscode: targetGis,
      plotno: String(plotno),
      sameownerplotreport: 'false',
      derivedlayerids: '-1',
      selectedlayerids: '-1',
      scaletextfield: '',
      logged: ''
    });

    const bodyStr = params.toString();
    const pdfResponse = await fetch('https://bhunaksha.rajasthan.gov.in/Viewmap/rest/LPMReportRJ/PlotReportPDF', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': String(Buffer.byteLength(bodyStr))
      },
      body: bodyStr
    });

    if (!pdfResponse.ok) {
      return res.status(200).json({ success: false, khata: "-", owner: "-" });
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Decode base64 if needed
    const rawStr = buffer.toString('utf-8');
    if (!rawStr.startsWith('%PDF')) {
      try {
        const decoded = Buffer.from(rawStr, 'base64');
        if (decoded.length > 500) buffer = decoded;
      } catch (e) {}
    }

    if (buffer.length < 500) {
      return res.status(200).json({ success: false, khata: "-", owner: "-" });
    }

    let fullText = "";
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse(new Uint8Array(buffer));
      const parsed = await parser.getText();
      fullText = parsed.text || '';
    } catch (e1) {
      try {
        const pdfParse = require('pdf-parse');
        const parsed = await pdfParse(buffer);
        fullText = parsed.text || '';
      } catch (e2) {
        console.error("PDF parse fallback error:", e2.message);
      }
    }

        let khataNo = "-";
    let ownerName = "-";
    let pdfArea = "";

    if (fullText) {
      // Extract Official Land Area from PDF text
      const areaMatch = fullText.match(/(?:क्षेत्रफल|Area)[^\d]*([\d\.]+)\s*(?:हेक्टेयर|Hectare|हे\.)?/i);
      if (areaMatch) {
        pdfArea = areaMatch[1];
      }
      // Extract Khata Number
      const khataMatch = fullText.match(/(?:Khata\s*No|खाता\s*संख्या|खाता\s*नं|खाता)[^\d]*(\d+)/i);
      if (khataMatch) {
        khataNo = khataMatch[1];
      }

      // Extract Owner Names
      const cleanText = fullText.split(/नोट\s*[:-]|सक्षम\s+अधिकारी|Note\s*[:-]/i)[0];
      const ownerMatches = cleanText.match(/\b[0-9]{1,2}\s*[\.\)]+\s*([\u0900-\u097F].+?)(?=\s+हिस्सा|\s+जाति|\s+सा\.|\s+खेती|\s+खातेदार|\n|\r|$)/g);

      if (ownerMatches && ownerMatches.length > 0) {
        const owners = ownerMatches
          .map(m => m.replace(/^[0-9]{1,2}\s*[\.\)]+\s*/, '').replace(/\s*(?:हिस्सा|जाति|सा\.|खेती).*$/, '').trim())
          .filter(Boolean);
        if (owners.length > 0) {
          ownerName = Array.from(new Set(owners)).join(', ');
        }
      }
    }

    return res.status(200).json({
      success: true,
      giscode: targetGis,
      plotno: plotno,
      khata: khataNo,
      owner: ownerName,
      area: pdfArea
    });
  } catch (err) {
    console.error("fetch-khasra-details error:", err);
    return res.status(200).json({ success: false, khata: "-", owner: "-", error: err.message });
  }
}
