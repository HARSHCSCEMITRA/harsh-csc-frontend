// api/admin/orders.js
// Vercel Serverless Function to fetch orders list from Supabase for the admin dashboard.
const crypto = require('crypto');

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token verification helper
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];

  // Fetch current password from Supabase
  const dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.admin_password&select=value`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  let dbPassword = 'HarshCSC@2026'; // Default fallback

  if (dbRes.ok) {
    const data = await dbRes.json();
    if (data && data.length > 0) {
      dbPassword = data[0].value;
    }
  }

  const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
  const expectedToken = crypto.createHmac('sha256', secret).update(dbPassword).digest('hex');

  return token === expectedToken;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const isAuthorized = await verifyAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized. Kripya login karein.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // Fetch orders from Supabase
    const dbRes = await fetch(`${SB_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=1000`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      return res.status(500).json({ error: `Supabase query error: ${errText}` });
    }

    const orders = await dbRes.json();
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('[ORDERS API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
