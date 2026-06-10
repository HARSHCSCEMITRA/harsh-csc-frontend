// api/auth/admin/login.js
// Vercel Serverless Function to authenticate admin password against Supabase.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token generation helper
function generateToken(password) {
  const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
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

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // Fetch password from Supabase
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

    if (password === dbPassword) {
      const token = generateToken(dbPassword);
      return res.status(200).json({ success: true, token });
    } else {
      return res.status(401).json({ error: 'Galat password. Kripya sahi password dalein.' });
    }
  } catch (err) {
    console.error('[AUTH API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
