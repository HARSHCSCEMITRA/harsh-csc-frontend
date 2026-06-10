// api/admin/summary.js
// Vercel Serverless Function to generate dynamic summary and insights for the admin dashboard.
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
    // Fetch orders to calculate stats dynamically
    const dbRes = await fetch(`${SB_URL}/rest/v1/orders?select=status,total_amount`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;

    if (dbRes.ok) {
      const orders = await dbRes.json();
      totalOrders = orders.length;
      orders.forEach(o => {
        if (o.status !== 'cancelled' && o.status !== 'Cancelled' && o.status !== 'rejected') {
          totalRevenue += (o.total_amount || 0);
        }
        if (o.status === 'new' || o.status === 'pending' || o.status === 'Processing') {
          pendingOrders++;
        }
      });
    }

    const summary_text = `📊 *AI Business Insights:* Aapke portal par total *${totalOrders} orders* recieve ho chuke hain, jisme se abhi *${pendingOrders} orders* pending verification/processing state me hain. Aapka total business revenue *₹${totalRevenue.toLocaleString('en-IN')}* hai. Aaj ka primary target: pending reviews aur speed-post tracking update karna hai.`;

    return res.status(200).json({ success: true, summary_text });
  } catch (err) {
    console.error('[SUMMARY API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
