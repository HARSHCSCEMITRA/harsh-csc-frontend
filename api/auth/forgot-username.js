// api/auth/forgot-username.js
// Vercel Serverless Function to recover a forgotten username.
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

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email likhna zaroori hai.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Query user by email
    const checkRes = await fetch(`${SB_URL}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}&select=username`, {
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
      return res.status(404).json({ error: 'Yeh Email database me registered nahi hai.' });
    }

    const user = users[0];

    // Call Supabase Edge Function to send username recovery email
    const emailRes = await fetch(`${SB_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_KEY}`
      },
      body: JSON.stringify({
        type: 'username_recovery',
        email: cleanEmail,
        data: {
          username: user.username
        }
      })
    });

    const emailData = await emailRes.json();

    if (emailRes.ok && emailData.success) {
      return res.status(200).json({ success: true, message: 'Aapka username aapke email par bhej diya gaya hai!' });
    } else {
      return res.status(500).json({ error: `Email sending failed: ${emailData.error || 'Unknown error'}` });
    }

  } catch (err) {
    console.error('[FORGOT USERNAME API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
