// api/auth/admin/change-password.js
// Vercel Serverless Function to update the admin password in Supabase.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token verification helper
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];

  if (!SB_URL || !SB_KEY) {
    return false;
  }

  try {
    // Fetch admin password_hash from Supabase users table
    const dbRes = await fetch(`${SB_URL}/rest/v1/users?role=eq.admin&select=password_hash`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbRes.ok) {
      return false;
    }

    const data = await dbRes.json();
    if (!data || data.length === 0) {
      return false;
    }

    const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
    
    // Check if token matches any admin's token
    for (const admin of data) {
      const expectedToken = crypto.createHmac('sha256', secret).update(admin.password_hash).digest('hex');
      if (token === expectedToken) {
        return true;
      }
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
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update the password hash in the users table for the admin
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

    // Sync with the old admin_settings password for full backward compatibility
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
