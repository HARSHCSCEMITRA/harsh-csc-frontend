// /api/share-location.js
// Vercel Serverless Function to manage real-time location sharing via Supabase.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database credentials are missing.' });
  }

  try {
    // ─── POST: Update Location ──────────────────────────────────────
    if (req.method === 'POST') {
      const { roomId, lat, lng } = req.body;
      if (!roomId || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'roomId, lat, and lng are required.' });
      }

      const keyName = `live_loc_${roomId}`;
      const payload = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        updatedAt: new Date().toISOString()
      };

      // Check if the setting already exists
      const checkRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.${encodeURIComponent(keyName)}`, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`
        }
      });
      const checkData = await checkRes.json();

      let dbRes;
      if (checkData && checkData.length > 0) {
        // Update existing setting
        dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.${encodeURIComponent(keyName)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: JSON.stringify(payload) })
        });
      } else {
        // Insert new setting
        dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key: keyName, value: JSON.stringify(payload) })
        });
      }

      if (!dbRes.ok) {
        const errMsg = await dbRes.text();
        throw new Error(`Supabase error: ${errMsg}`);
      }

      return res.status(200).json({ success: true, message: 'Location updated successfully.' });
    }

    // ─── GET: Retrieve Location ──────────────────────────────────────
    if (req.method === 'GET') {
      const { roomId } = req.query;
      if (!roomId) {
        return res.status(400).json({ error: 'roomId is required.' });
      }

      const keyName = `live_loc_${roomId}`;
      const dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.${encodeURIComponent(keyName)}&select=*`, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`
        }
      });

      if (!dbRes.ok) {
        const errMsg = await dbRes.text();
        throw new Error(`Supabase error: ${errMsg}`);
      }

      const data = await dbRes.json();
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Location not found or expired.' });
      }

      try {
        const value = JSON.parse(data[0].value);
        return res.status(200).json({ success: true, location: value });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse location data.' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('[SHARE LOCATION API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
