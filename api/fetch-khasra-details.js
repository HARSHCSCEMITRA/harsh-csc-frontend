// api/fetch-khasra-details.js - Production Vercel Serverless Function for BhuNaksha Khasra Details
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function fetchPdfForGis(giscode, plotno) {
  const targetGis = giscode.length === 19 ? giscode + '001' : giscode;
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

  if (!pdfResponse.ok) return null;

  const rawText = await pdfResponse.text();
  let buffer = Buffer.from(rawText, 'utf-8');

  // If response is base64 string
  if (!rawText.startsWith('%PDF')) {
    try {
      const decoded = Buffer.from(rawText.trim(), 'base64');
      if (decoded.length > 500) buffer = decoded;
    } catch (e) {}
  }

  if (buffer.length < 2000) return null;
  return buffer;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawGis = req.query.giscode || req.body?.giscode;
  const rawPlot = req.query.plotno || req.body?.plotno;

  if (!rawGis || !rawPlot) {
    return res.status(400).json({ error: "Missing 'giscode' or 'plotno' parameter." });
  }

  const plotno = String(rawPlot).replace(/[^0-9]/g, '');
  let giscode = String(rawGis).trim();

  try {
    let pdfBuffer = await fetchPdfForGis(giscode, plotno);

    // If primary GIS code returned empty PDF, try resolving via MapServer Layer 11 GIS lookup
    if (!pdfBuffer && giscode.length >= 5) {
      const vid = giscode.slice(-5);
      try {
        const layer11Url = `https://gis.rajasthan.gov.in/rajasthan/rest/services/Common/Revenue/MapServer/11/query?where=CENSUS_CD_2011%3D${encodeURIComponent(vid)}&outFields=BHUCODE%2CGISCODE&f=json`;
        const l11Res = await fetch(layer11Url);
        if (l11Res.ok) {
          const l11Data = await l11Res.json();
          if (l11Data.features && l11Data.features.length > 0) {
            const resolvedBhu = l11Data.features[0].attributes.BHUCODE || l11Data.features[0].attributes.GISCODE;
            if (resolvedBhu) {
              pdfBuffer = await fetchPdfForGis(resolvedBhu, plotno);
              if (pdfBuffer) giscode = resolvedBhu;
            }
          }
        }
      } catch (errRes) {}
    }

    if (!pdfBuffer) {
      return res.status(200).json({ success: false, khata: "-", owner: "-", area: "" });
    }

    let fullText = "";

    // Extract text from PDF buffer using pdf-parse or fallback text extraction
    try {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(pdfBuffer);
      fullText = parsed.text || '';
    } catch (e1) {
      try {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse(new Uint8Array(pdfBuffer));
        const parsed = await parser.getText();
        fullText = parsed.text || '';
      } catch (e2) {
        // Fallback: UTF-8 string match directly from PDF buffer
        fullText = pdfBuffer.toString('utf-8', 0, pdfBuffer.length);
      }
    }

    let khataNo = "-";
    let ownerName = "-";
    let pdfArea = "";

    if (fullText) {
      // Extract Khata Number
      const khataMatch = fullText.match(/(?:Khata\s*No|खाता\s*संख्या|खाता\s*नं|खाता)[^\d]*(\d+)/i);
      if (khataMatch) {
        khataNo = khataMatch[1];
      }

      // Extract Official Land Area
      const areaMatch = fullText.match(/(?:क्षेत्रफल|Area)[^\d]*([\d\.]+)\s*(?:हेक्टेयर|Hectare|हे\.)?/i);
      if (areaMatch) {
        pdfArea = areaMatch[1];
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
      giscode: giscode,
      plotno: plotno,
      khata: khataNo,
      owner: ownerName,
      area: pdfArea
    });
  } catch (err) {
    console.error("fetch-khasra-details error:", err);
    return res.status(200).json({ success: false, khata: "-", owner: "-", area: "", error: err.message });
  }
}
