// api/admin/reset-requests.js
// Vercel Serverless Function to fetch and approve/reject hardware lock PC reset requests.
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

  // GET: Fetch all requests
  if (req.method === 'GET') {
    try {
      const dbRes = await fetch(`${SB_URL}/rest/v1/license_resets?select=*&order=created_at.desc&limit=1000`, {
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

      const requests = await dbRes.json();
      return res.status(200).json({ success: true, requests });
    } catch (err) {
      console.error('[RESET API GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  // POST: Approve / Reject
  if (req.method === 'POST') {
    try {
      const { reset_id, action } = req.body;
      if (!reset_id || !action) {
        return res.status(400).json({ error: 'reset_id and action (approve/reject) are required.' });
      }

      // 1. Fetch request details
      const reqRes = await fetch(`${SB_URL}/rest/v1/license_resets?id=eq.${reset_id}&limit=1`, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`
        }
      });
      const reqs = await reqRes.json();
      if (!reqs || reqs.length === 0) {
        return res.status(404).json({ error: 'Reset request not found.' });
      }
      
      const resetRequest = reqs[0];
      const licenseKey = resetRequest.license_key;
      const targetStatus = action === 'approve' ? 'approved' : 'rejected';

      // 2. Update reset request status
      const updateReqRes = await fetch(`${SB_URL}/rest/v1/license_resets?id=eq.${reset_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: targetStatus })
      });
      
      if (!updateReqRes.ok) {
        const errText = await updateReqRes.text();
        return res.status(500).json({ error: `Database update error: ${errText}` });
      }

      // 3. If approved, unlock machine lock (set machine_id = null) in software_licenses table
      if (action === 'approve') {
        const resetLicenseRes = await fetch(`${SB_URL}/rest/v1/software_licenses?license_key=eq.${encodeURIComponent(licenseKey)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ machine_id: null })
        });
        
        if (!resetLicenseRes.ok) {
          console.error('[RESET API] Failed to set machine_id null for license:', licenseKey);
        }

        // Trigger reset approved email to client
        if (resetRequest.email) {
          try {
            await fetch(`${SB_URL}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`
              },
              body: JSON.stringify({
                type: 'reset_approved',
                email: resetRequest.email,
                data: {
                  license_key: licenseKey
                }
              })
            });
          } catch (e) {
            console.error('[RESET API] Failed to trigger email notification:', e);
          }
        }
      }

      return res.status(200).json({ success: true, message: `Request successfully ${targetStatus}.` });
    } catch (err) {
      console.error('[RESET API POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
