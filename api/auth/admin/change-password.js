// api/auth/admin/change-password.js
// Vercel Serverless Function to update the admin password in Supabase.
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const isAuthorized = await verifyAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized. Kripya login karein.' });
  }

  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: 'Naya password likhna zaroori hai.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // Update the password in Supabase
    const updateRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.admin_password`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ value: newPassword, updated_at: new Date().toISOString() })
    });

    if (updateRes.ok) {
      return res.status(200).json({ success: true, message: 'Password successfully updated!' });
    } else {
      const errText = await updateRes.text();
      return res.status(500).json({ error: `Supabase update error: ${errText}` });
    }
  } catch (err) {
    console.error('[CHANGE PASSWORD API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
