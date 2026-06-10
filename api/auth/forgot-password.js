// api/auth/forgot-password.js
// Vercel Serverless Function to request a password reset.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const { usernameOrEmail } = req.body;

  if (!usernameOrEmail) {
    return res.status(400).json({ error: 'Username ya Email likhna zaroori hai.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    const searchVal = usernameOrEmail.trim().toLowerCase();

    // Query user by username or email
    const query = `or=(username.eq.${encodeURIComponent(searchVal)},email.eq.${encodeURIComponent(searchVal)})&select=id,username,email`;
    const checkRes = await fetch(`${SB_URL}/rest/v1/users?${query}`, {
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
      return res.status(404).json({ error: 'Yeh Username/Email registered nahi hai.' });
    }

    const user = users[0];

    // Generate random reset token (64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

    // Update user record with token and expiry
    const updateRes = await fetch(`${SB_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        reset_token: token,
        reset_token_expires: expiry
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(500).json({ error: `Database update error: ${errText}` });
    }

    // Build the reset link dynamically
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'harshcscemitra.com';
    const resetLink = `${proto}://${host}/reset-password.html?token=${token}`;

    // Call Supabase Edge Function to send reset email
    const emailRes = await fetch(`${SB_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_KEY}`
      },
      body: JSON.stringify({
        type: 'password_reset',
        email: user.email,
        data: {
          username: user.username,
          reset_link: resetLink
        }
      })
    });

    const emailData = await emailRes.json();

    if (emailRes.ok && emailData.success) {
      return res.status(200).json({ success: true, message: 'Password reset link aapke email par bhej diya gaya hai!' });
    } else {
      return res.status(500).json({ error: `Email sending failed: ${emailData.error || 'Unknown error'}` });
    }

  } catch (err) {
    console.error('[FORGOT PASSWORD API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
