// api/gis-proxy.js - High-Performance Vercel Serverless GIS Proxy Function for Rajasthan Bhunaksha & Mining Overlays
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let targetUrl = req.query.url || req.body?.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter." });
  }

  // Ensure targetUrl is decoded properly
  targetUrl = decodeURIComponent(targetUrl);

  // If targetUrl doesn't start with http, default to gis.rajasthan.gov.in
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://gis.rajasthan.gov.in/' + targetUrl.replace(/^\/+/, '');
  }

  // Strip token={dynamicquery_token} or unusable token params
  targetUrl = targetUrl.replace(/([?&])token=\{dynamicquery_token\}/gi, '$1').replace(/([?&])token=[^&]*/gi, '');

  // Wrap inside Rajasthan GIS Proxy ashx handler
  const fullProxyUrl = `https://gis.rajasthan.gov.in/proxy/proxy.ashx?${targetUrl}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gis.rajasthan.gov.in/',
        'Accept': '*/*'
      }
    };

    if (req.method === 'POST') {
      let bodyData = req.body;
      if (typeof bodyData === 'object' && !(bodyData instanceof Buffer)) {
        // Convert object to urlencoded form data
        bodyData = new URLSearchParams(bodyData).toString();
      }
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/x-www-form-urlencoded';
      fetchOptions.body = bodyData;
    }

    const gisResponse = await fetch(fullProxyUrl, fetchOptions);

    const contentType = gisResponse.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.status(gisResponse.status);

    const arrayBuffer = await gisResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.send(buffer);
  } catch (err) {
    console.error("GIS Proxy Error:", err);
    return res.status(500).json({ error: "GIS Proxy Request Failed: " + err.message });
  }
}
