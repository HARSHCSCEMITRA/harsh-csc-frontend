// api/gis-proxy.js - High-Performance Vercel Serverless Proxy for Rajasthan GIS Bhunaksha & Mining Overlays
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

  try {
    targetUrl = decodeURIComponent(targetUrl);
  } catch (e) {
    // Already decoded
  }

  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://gis.rajasthan.gov.in/' + targetUrl.replace(/^\/+/, '');
  }

  // Strip invalid tokens
  targetUrl = targetUrl.replace(/([?&])token=\{dynamicquery_token\}/gi, '$1').replace(/([?&])token=[^&]*/gi, '');

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
      let bodyStr = '';
      if (typeof req.body === 'string') {
        bodyStr = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        bodyStr = req.body.toString('utf-8');
      } else if (typeof req.body === 'object' && req.body !== null) {
        bodyStr = new URLSearchParams(req.body).toString();
      }

      // Strip token={dynamicquery_token} or unusable token params from POST body
      bodyStr = bodyStr.replace(/([?&]|%26)?token=\{dynamicquery_token\}/gi, '');
      bodyStr = bodyStr.replace(/([?&]|%26)?token=%7Bdynamicquery_token%7D/gi, '');
      bodyStr = bodyStr.replace(/^&+|&+$|(?<=&)&/g, '');

      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/x-www-form-urlencoded';
      fetchOptions.body = bodyStr;
    }

    const gisResponse = await fetch(fullProxyUrl, fetchOptions);
    const contentType = gisResponse.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.status(gisResponse.status);

    const arrayBuffer = await gisResponse.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("GIS Proxy Error:", err);
    return res.status(500).json({ error: "GIS Proxy Request Failed: " + err.message });
  }
}
