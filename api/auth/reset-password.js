// api/auth/reset-password.js
// Vercel Serverless Function to reset the password using the reset token.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
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

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token aur Naya Password likhna zaroori hai.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // Find user by reset token
    const checkRes = await fetch(`${SB_URL}/rest/v1/users?reset_token=eq.${encodeURIComponent(token)}&select=id,username,reset_token_expires,role`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkRes.ok) {
      const errText = await checkRes.text();
      return res.status(500).json({ error: `Database error: ${errText}` });
    }

    const users = await checkRes.json();
    if (!users || users.length === 0) {
      return res.status(400).json({ error: 'Invalid ya Expired reset token.' });
    }

    const user = users[0];

    // Check if token has expired
    const expiryDate = new Date(user.reset_token_expires);
    if (expiryDate.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset link expire ho gaya hai. Kripya naya link request karein.' });
    }

    // Hash the new password and update user record
    const newHash = hashPassword(newPassword);
    const updateRes = await fetch(`${SB_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        password_hash: newHash,
        reset_token: null,
        reset_token_expires: null
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(500).json({ error: `Database update error: ${errText}` });
    }

    // For admins, also sync with the old admin_settings password for full backward compatibility
    if (user.role === 'admin') {
      await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.admin_password`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          value: newPassword,
          updated_at: new Date().toISOString()
        })
      }).catch(err => {
        console.error('[RESET PASSWORD API] Failed to sync admin_settings:', err);
      });
    }

    return res.status(200).json({ success: true, message: 'Password successfully reset ho gaya hai! Ab aap login kar sakte hain.' });

  } catch (err) {
    console.error('[RESET PASSWORD API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
