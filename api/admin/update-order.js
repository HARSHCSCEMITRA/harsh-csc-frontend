// api/admin/update-order.js
// Vercel Serverless Function to update order status (approve / mark paid) and generate licenses.
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

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const part = (len, charSet) => Array.from({ length: len }, () => charSet[Math.floor(Math.random() * charSet.length)]).join('');
  return `CSC-AUTO-${part(4, chars)}-${part(4, nums)}-${part(4, chars)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const isAuthorized = await verifyAuth(req);
  if (!isAuthorized) return res.status(401).json({ error: 'Unauthorized. Kripya login karein.' });

  const { order_ref, status } = req.body;
  if (!order_ref || !status) {
    return res.status(400).json({ error: 'order_ref and status are required.' });
  }

  try {
    // 1. Fetch order details from Supabase
    const orderRes = await fetch(`${SB_URL}/rest/v1/orders?order_ref=eq.${encodeURIComponent(order_ref.toUpperCase())}&limit=1`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!orderRes.ok) {
      const errText = await orderRes.text();
      return res.status(500).json({ error: `Fetch order error: ${errText}` });
    }

    const orders = await orderRes.json();
    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orders[0];
    const targetStatus = status; // e.g., 'paid'
    const targetPaymentStatus = status === 'paid' ? 'Payment Received' : order.payment_status;

    // 2. Update order status in orders table
    const updateRes = await fetch(`${SB_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: targetStatus,
        payment_status: targetPaymentStatus
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return res.status(500).json({ error: `Database update error: ${errText}` });
    }

    // 3. Trigger automatic key generation and email delivery if marked as 'paid'
    if (targetStatus === 'paid') {
      let orderItems = [];
      try {
        orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch {
        orderItems = [];
      }

      // Check if it's a software product
      const softwareItem = orderItems.find(item => 
        (item.product_id && item.product_id.includes('s_automation')) ||
        (item.name && item.name.toLowerCase().includes('automation'))
      );

      if (softwareItem) {
        // Check if license is already generated
        const licenseRes = await fetch(`${SB_URL}/rest/v1/software_licenses?order_ref=eq.${encodeURIComponent(order_ref.toUpperCase())}&limit=1`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`
          }
        });
        const existingLic = await licenseRes.json();

        let finalKey = '';
        let expiresAt = '';
        let plan = '';

        if (existingLic && existingLic.length > 0) {
          finalKey = existingLic[0].license_key;
          expiresAt = existingLic[0].expires_at;
          plan = existingLic[0].plan;
        } else {
          // Generate new license key
          const isYearly = softwareItem.product_id?.includes('yearly') || softwareItem.name?.toLowerCase().includes('1 year');
          plan = isYearly ? 'yearly' : 'monthly';
          finalKey = generateLicenseKey();

          const expDate = new Date();
          if (isYearly) {
            expDate.setFullYear(expDate.getFullYear() + 1);
          } else {
            expDate.setMonth(expDate.getMonth() + 1);
          }
          expiresAt = expDate.toISOString();

          // Save license to public.software_licenses
          const insLicRes = await fetch(`${SB_URL}/rest/v1/software_licenses`, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              license_key: finalKey,
              order_ref: order_ref.toUpperCase(),
              customer_name: order.customer_name || 'Valued Customer',
              customer_phone: order.customer_phone || '',
              plan,
              expires_at: expiresAt,
              is_active: true
            })
          });

          if (!insLicRes.ok) {
            const errText = await insLicRes.text();
            console.error('[UPDATE ORDER] Failed to insert software license:', errText);
          }
        }

        // Send activation email
        const toEmail = order.customer_email || order.email || '';
        if (toEmail && finalKey) {
          try {
            await fetch(`${SB_URL}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`
              },
              body: JSON.stringify({
                type: 'license_activation',
                email: toEmail,
                data: {
                  license_key: finalKey,
                  plan,
                  expires_at: expiresAt
                }
              })
            });
          } catch (e) {
            console.error('[UPDATE ORDER] Failed to send license activation email:', e);
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: `Order successfully updated to ${targetStatus}.` });
  } catch (err) {
    console.error('[UPDATE ORDER API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
