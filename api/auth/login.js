// api/auth/login.js
// Vercel Serverless Function to authenticate users and admins against the Supabase `users` table.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(passwordHash) {
  const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
  return crypto.createHmac('sha256', secret).update(passwordHash).digest('hex');
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

  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and Password are required.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // Find user by username or email
    const query = `or=(username.eq.${encodeURIComponent(usernameOrEmail)},email.eq.${encodeURIComponent(usernameOrEmail)})&select=username,role,password_hash`;
    const dbRes = await fetch(`${SB_URL}/rest/v1/users?${query}`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      return res.status(500).json({ error: `Database error: ${errText}` });
    }

    const users = await dbRes.json();
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Username/Email ya Password galat hai.' });
    }

    const user = users[0];
    const inputHash = hashPassword(password);

    if (inputHash === user.password_hash) {
      // Generate a signed session token
      const token = generateToken(user.password_hash);
      return res.status(200).json({
        success: true,
        token,
        role: user.role,
        username: user.username,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({ error: 'Username/Email ya Password galat hai.' });
    }
  } catch (err) {
    console.error('[LOGIN API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
