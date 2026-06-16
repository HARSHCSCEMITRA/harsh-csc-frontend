// api/admin/licenses.js
// Vercel Serverless Function to fetch and manage software licenses.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const isAuthorized = await verifyAuth(req);
  if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized. Kripya login karein.' });

  // GET: Fetch all licenses
  if (req.method === 'GET') {
    try {
      const dbRes = await fetch(`${SB_URL}/rest/v1/software_licenses?select=*&order=created_at.desc&limit=1000`, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        return res.status(500).json({ error: `Supabase query error: ${errText}` });
      }

      const licenses = await dbRes.json();
      return res.status(200).json({ success: true, licenses });
    } catch (err) {
      console.error('[LICENSES API GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  // POST: Toggle license active status
  if (req.method === 'POST') {
    try {
      const { license_id, is_active } = req.body;
      if (!license_id) {
        return res.status(400).json({ error: 'license_id is required.' });
      }

      const dbRes = await fetch(`${SB_URL}/rest/v1/software_licenses?id=eq.${license_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ is_active: !!is_active })
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        return res.status(500).json({ error: `Supabase update error: ${errText}` });
      }

      const data = await dbRes.json();
      return res.status(200).json({ success: true, license: data[0] });
    } catch (err) {
      console.error('[LICENSES API POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
