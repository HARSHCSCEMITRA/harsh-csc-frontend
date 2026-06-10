// api/admin/sign-upload.js
// Vercel Serverless Function to generate a signed upload URL for Supabase Storage.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token verification helper (re-used from other admin endpoints)
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

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    // 1. Ensure the 'software' bucket exists by trying to create it
    await fetch(`${SB_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'software',
        name: 'software',
        public: true,
        file_size_limit: 104857600, // 100MB
        allowed_mime_types: ['application/zip', 'application/x-zip-compressed']
      })
    }).catch(() => {}); // Ignore duplicate/error if bucket already exists

    // 2. Request a signed upload URL from Supabase Storage
    const signRes = await fetch(`${SB_URL}/storage/v1/object/upload/sign/software/Harsh_CSC_Automation_Setup.zip`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: 300 }) // Valid for 5 minutes
    });

    if (!signRes.ok) {
      const errText = await signRes.text();
      return res.status(500).json({ error: `Supabase Storage signing error: ${errText}` });
    }

    const signData = await signRes.json();
    
    // We construct the full signed URL
    const signedUrl = `${SB_URL}/storage/v1${signData.url}`;

    return res.status(200).json({
      success: true,
      signedUrl,
      publicUrl: `${SB_URL}/storage/v1/object/public/software/Harsh_CSC_Automation_Setup.zip`
    });

  } catch (err) {
    console.error('[SIGN UPLOAD API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
