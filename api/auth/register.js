// api/auth/register.js
// Vercel Serverless Function to register a new user in the Supabase `users` table.
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

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, Email and Password are required.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const checkRes = await fetch(`${SB_URL}/rest/v1/users?or=(username.eq.${encodeURIComponent(cleanUsername)},email.eq.${encodeURIComponent(cleanEmail)})&select=username`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Username ya Email pehle se registered hai.' });
      }
    }

    // Hash password & insert user
    const passwordHash = hashPassword(password);
    const insertRes = await fetch(`${SB_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'user'
      })
    });

    if (insertRes.ok) {
      return res.status(201).json({ success: true, message: 'User registered successfully!' });
    } else {
      const errText = await insertRes.text();
      return res.status(500).json({ error: `Database insert error: ${errText}` });
    }
  } catch (err) {
    console.error('[REGISTER API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
