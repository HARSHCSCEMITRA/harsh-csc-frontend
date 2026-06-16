// api/auth-admin.js
// Consolidated Vercel Serverless Function to manage admin authentication (login & change-password).
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token generation helper
function generateToken(password) {
  const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

// Token verification helper
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  if (!SB_URL || !SB_KEY) return false;

  try {
    const dbRes = await fetch(`${SB_URL}/rest/v1/users?role=eq.admin&select=password_hash`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!dbRes.ok) return false;
    const data = await dbRes.json();
    if (!data || data.length === 0) return false;

    const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
    for (const admin of data) {
      const expectedToken = crypto.createHmac('sha256', secret).update(admin.password_hash).digest('hex');
      if (token === expectedToken) return true;
    }
  } catch (err) {
    console.error('[AUTH VERIFY] Error:', err);
  }
  return false;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Resolve target endpoint
  let endpoint = req.query?.endpoint;
  if (!endpoint && req.url) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const match = parsedUrl.pathname.match(/^\/api\/auth\/admin\/([^\/]+)/);
    if (match) {
      endpoint = match[1];
    }
  }

  // Dispatch
  if (endpoint === 'login') {
    return handleLogin(req, res);
  } else if (endpoint === 'change-password') {
    return handleChangePassword(req, res);
  } else {
    return res.status(404).json({ error: `Not Found: Sub-route "${endpoint}" not matched.` });
  }
}

// Handler: Admin Login
async function handleLogin(req, res) {
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
      const passwordHash = crypto.createHash('sha256').update(dbPassword).digest('hex');
      const token = generateToken(passwordHash);
      return res.status(200).json({ success: true, token });
    } else {
      return res.status(401).json({ error: 'Galat password. Kripya sahi password dalein.' });
    }
  } catch (err) {
    console.error('[AUTH API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// Handler: Change Password
async function handleChangePassword(req, res) {
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
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update the password hash in the users table
    const updateUsersRes = await fetch(`${SB_URL}/rest/v1/users?role=eq.admin`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ password_hash: newHash })
    });

    if (!updateUsersRes.ok) {
      const errText = await updateUsersRes.text();
      return res.status(500).json({ error: `Supabase users table update error: ${errText}` });
    }

    // Sync with the old admin_settings password
    const updateSettingsRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.admin_password`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ value: newPassword, updated_at: new Date().toISOString() })
    });

    if (updateSettingsRes.ok) {
      return res.status(200).json({ success: true, message: 'Password successfully updated!' });
    } else {
      const errText = await updateSettingsRes.text();
      return res.status(500).json({ error: `Supabase settings update error: ${errText}` });
    }
  } catch (err) {
    console.error('[CHANGE PASSWORD API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
