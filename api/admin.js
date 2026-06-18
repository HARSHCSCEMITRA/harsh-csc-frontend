// api/admin.js
// Consolidated Vercel Serverless Function to fetch and manage admin operations.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token verification helper
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

// License key generator helper
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const part = (len, charSet) => Array.from({ length: len }, () => charSet[Math.floor(Math.random() * charSet.length)]).join('');
  return `CSC-AUTO-${part(4, chars)}-${part(4, nums)}-${part(4, chars)}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. Authenticate user
  const isAuthorized = await verifyAuth(req);
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized. Kripya login karein.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  // 2. Resolve target endpoint
  let endpoint = req.query?.endpoint;
  if (!endpoint && req.url) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const match = parsedUrl.pathname.match(/^\/api\/admin\/([^\/]+)/);
    if (match) {
      endpoint = match[1];
    }
  }

  // 3. Dispatch to specific sub-handler
  switch (endpoint) {
    case 'trials':
      return handleTrials(req, res);
    case 'licenses':
      return handleLicenses(req, res);
    case 'orders':
      return handleOrders(req, res);
    case 'reset-requests':
      return handleResetRequests(req, res);
    case 'sign-upload':
      return handleSignUpload(req, res);
    case 'summary':
      return handleSummary(req, res);
    case 'update-order':
      return handleUpdateOrder(req, res);
    case 'plans':
      return handlePlans(req, res);
    case 'settings':
      return handleSettings(req, res);
    default:
      return res.status(404).json({ error: `Not Found: Sub-route "${endpoint}" not matched.` });
  }
}

// Handler: Trials
async function handleTrials(req, res) {
  if (req.method === 'GET') {
    try {
      const dbRes = await fetch(`${SB_URL}/rest/v1/software_trials?select=*&order=activated_at.desc&limit=1000`, {
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

      const trials = await dbRes.json();
      return res.status(200).json({ success: true, trials });
    } catch (err) {
      console.error('[TRIALS API] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const machine_id = req.query?.machine_id || req.body?.machine_id;
      if (!machine_id) {
        return res.status(400).json({ error: 'machine_id is required.' });
      }
      const dbRes = await fetch(`${SB_URL}/rest/v1/software_trials?machine_id=eq.${encodeURIComponent(machine_id)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Prefer': 'return=minimal'
        }
      });
      if (!dbRes.ok) {
        const errText = await dbRes.text();
        return res.status(500).json({ error: `Supabase delete error: ${errText}` });
      }
      return res.status(200).json({ success: true, message: 'Trial deleted successfully.' });
    } catch (err) {
      console.error('[TRIALS API DELETE] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Handler: Licenses
async function handleLicenses(req, res) {
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

  if (req.method === 'POST') {
    try {
      const { action, license_id } = req.body;
      const actualAction = action || (license_id ? 'toggle' : 'create');

      if (actualAction === 'create') {
        const { customer_name, customer_phone, customer_email, order_ref, plan, machine_id, allowed_devices } = req.body;
        if (!customer_name || !customer_phone) {
          return res.status(400).json({ error: 'customer_name and customer_phone are required.' });
        }

        const cleanPhone = customer_phone.trim();
        const cleanEmail = customer_email ? customer_email.trim().toLowerCase() : null;

        // Check duplicate active license on phone or email
        let dupQuery = `customer_phone=eq.${encodeURIComponent(cleanPhone)}&is_active=eq.true`;
        if (cleanEmail) {
          dupQuery = `or=(customer_phone.eq.${encodeURIComponent(cleanPhone)},customer_email.eq.${encodeURIComponent(cleanEmail)})&is_active=eq.true`;
        }

        const checkRes = await fetch(`${SB_URL}/rest/v1/software_licenses?${dupQuery}`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`
          }
        });
        if (checkRes.ok) {
          const existingLicenses = await checkRes.json();
          const activeLic = existingLicenses.find(l => new Date(l.expires_at) > new Date());
          if (activeLic) {
            return res.status(400).json({ error: `An active license is already registered with this phone number or email (${activeLic.license_key}).` });
          }
        }

        const licenseKey = generateLicenseKey();
        const expiresAt = new Date();
        if (plan === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        const dbRes = await fetch(`${SB_URL}/rest/v1/software_licenses`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            license_key: licenseKey,
            order_ref: order_ref || 'MANUAL-' + Date.now(),
            customer_name,
            customer_phone: cleanPhone,
            customer_email: cleanEmail,
            plan: plan || 'monthly',
            machine_id: machine_id || null,
            allowed_devices: parseInt(allowed_devices) || 1,
            expires_at: expiresAt.toISOString(),
            is_active: true
          })
        });

        if (!dbRes.ok) {
          const errText = await dbRes.text();
          return res.status(500).json({ error: `Supabase insert error: ${errText}` });
        }

        const data = await dbRes.json();
        const generatedLicense = data[0];

        // Send email automatically if email is provided
        if (cleanEmail) {
          try {
            await sendDirectLicenseEmail(cleanEmail, licenseKey, plan, expiresAt, customer_name);
          } catch (e) {
            console.error('[LICENSES API POST] Email sending failed:', e);
          }
        }

        return res.status(200).json({ success: true, license: generatedLicense });
      }

      if (actualAction === 'toggle') {
        const { is_active } = req.body;
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
      }

      if (actualAction === 'extend') {
        const { expires_at } = req.body;
        if (!license_id || !expires_at) {
          return res.status(400).json({ error: 'license_id and expires_at are required.' });
        }

        const dbRes = await fetch(`${SB_URL}/rest/v1/software_licenses?id=eq.${license_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ expires_at })
        });

        if (!dbRes.ok) {
          const errText = await dbRes.text();
          return res.status(500).json({ error: `Supabase extend error: ${errText}` });
        }

        const data = await dbRes.json();
        return res.status(200).json({ success: true, license: data[0] });
      }

      if (actualAction === 'send_email') {
        if (!license_id) {
          return res.status(400).json({ error: 'license_id is required.' });
        }
        // Fetch license details
        const licQuery = await fetch(`${SB_URL}/rest/v1/software_licenses?id=eq.${license_id}&limit=1`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`
          }
        });
        if (!licQuery.ok) {
          return res.status(500).json({ error: 'Failed to fetch license details.' });
        }
        const licData = await licQuery.json();
        if (!licData || licData.length === 0) {
          return res.status(404).json({ error: 'License not found.' });
        }
        const license = licData[0];
        if (!license.customer_email) {
          return res.status(400).json({ error: 'No registered email found for this customer.' });
        }
        // Send email
        try {
          await sendDirectLicenseEmail(license.customer_email, license.license_key, license.plan, license.expires_at, license.customer_name);
        } catch (e) {
          return res.status(500).json({ error: `Failed to send email: ${e.message}` });
        }
        return res.status(200).json({ success: true, message: 'Email sent successfully.' });
      }

      if (actualAction === 'edit_customer') {
        const { customer_name, customer_phone, customer_email } = req.body;
        if (!license_id) {
          return res.status(400).json({ error: 'license_id is required.' });
        }
        if (!customer_name || !customer_phone) {
          return res.status(400).json({ error: 'customer_name and customer_phone are required.' });
        }
        const cleanPhone = customer_phone.trim();
        const cleanEmail = customer_email ? customer_email.trim().toLowerCase() : null;

        const updateRes = await fetch(`${SB_URL}/rest/v1/software_licenses?id=eq.${license_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            customer_name,
            customer_phone: cleanPhone,
            customer_email: cleanEmail
          })
        });
        if (!updateRes.ok) {
          const errText = await updateRes.text();
          return res.status(500).json({ error: `Database update error: ${errText}` });
        }
        const data = await updateRes.json();
        return res.status(200).json({ success: true, license: data[0] });
      }

      return res.status(400).json({ error: `Unknown action: ${actualAction}` });
    } catch (err) {
      console.error('[LICENSES API POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Handler: Orders
async function handleOrders(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  try {
    const dbRes = await fetch(`${SB_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=1000`, {
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

    const orders = await dbRes.json();
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('[ORDERS API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// Handler: Reset Requests
async function handleResetRequests(req, res) {
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

      // 3. If approved, unlock machine lock (set machine_id = null)
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

        // Trigger reset approved email
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

// Handler: Sign Upload URL
async function handleSignUpload(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  try {
    const { version } = req.body;

    // 1. If a version is provided, update latest_software_version in admin_settings
    if (version) {
      await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.latest_software_version`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          value: version.trim(),
          updated_at: new Date().toISOString()
        })
      }).catch(err => console.error('[SIGN UPLOAD] Failed to save version:', err));
    }

    // 2. Ensure the 'software' bucket exists
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
    }).catch(() => {});

    // 3. Request a signed upload URL
    const signRes = await fetch(`${SB_URL}/storage/v1/object/upload/sign/software/Harsh_CSC_Automation_Setup.zip`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: 300 })
    });

    if (!signRes.ok) {
      const errText = await signRes.text();
      return res.status(500).json({ error: `Supabase Storage signing error: ${errText}` });
    }

    const signData = await signRes.json();
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

// Handler: Summary
async function handleSummary(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  try {
    const dbRes = await fetch(`${SB_URL}/rest/v1/orders?select=status,total_amount`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let totalOrders = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;

    if (dbRes.ok) {
      const orders = await dbRes.json();
      totalOrders = orders.length;
      orders.forEach(o => {
        if (o.status !== 'cancelled' && o.status !== 'Cancelled' && o.status !== 'rejected') {
          totalRevenue += (o.total_amount || 0);
        }
        if (o.status === 'new' || o.status === 'pending' || o.status === 'Processing') {
          pendingOrders++;
        }
      });
    }

    const summary_text = `📊 *AI Business Insights:* Aapke portal par total *${totalOrders} orders* recieve ho chuke hain, jisme se abhi *${pendingOrders} orders* pending verification/processing state me hain. Aapka total business revenue *₹${totalRevenue.toLocaleString('en-IN')}* hai. Aaj ka primary target: pending reviews aur speed-post tracking update karna hai.`;

    return res.status(200).json({ success: true, summary_text });
  } catch (err) {
    console.error('[SUMMARY API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// Handler: Update Order
async function handleUpdateOrder(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { order_ref, status } = req.body;
  if (!order_ref || !status) {
    return res.status(400).json({ error: 'order_ref and status are required.' });
  }

  try {
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
    const targetStatus = status;
    const targetPaymentStatus = status === 'paid' ? 'Payment Received' : order.payment_status;

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

    if (targetStatus === 'paid') {
      let orderItems = [];
      try {
        orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch {
        orderItems = [];
      }

      const softwareItem = orderItems.find(item => 
        (item.product_id && (item.product_id.includes('s_automation') || item.product_id.toLowerCase().includes('device') || item.product_id.toLowerCase().includes('subscription') || item.product_id.toLowerCase().includes('license') || item.product_id.toLowerCase().includes('licence'))) ||
        (item.name && (item.name.toLowerCase().includes('automation') || item.name.toLowerCase().includes('device') || item.name.toLowerCase().includes('subscription') || item.name.toLowerCase().includes('license') || item.name.toLowerCase().includes('licence')))
      );

      if (softwareItem) {
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
        let allowedDevices = 1;

        if (existingLic && existingLic.length > 0) {
          finalKey = existingLic[0].license_key;
          expiresAt = existingLic[0].expires_at;
          plan = existingLic[0].plan;
          allowedDevices = existingLic[0].allowed_devices || 1;
        } else {
          const isYearly = (softwareItem.product_id && (softwareItem.product_id.toLowerCase().includes('yearly') || softwareItem.product_id.toLowerCase().includes('year'))) ||
                           (softwareItem.name && (softwareItem.name.toLowerCase().includes('yearly') || softwareItem.name.toLowerCase().includes('year')));
          plan = isYearly ? 'yearly' : 'monthly';

          const isMulti = (softwareItem.product_id && (softwareItem.product_id.toLowerCase().includes('multi') || softwareItem.product_id.toLowerCase().includes('multiple'))) ||
                          (softwareItem.name && (softwareItem.name.toLowerCase().includes('multi') || softwareItem.name.toLowerCase().includes('multiple')));
          allowedDevices = isMulti ? 3 : 1;

          const toEmail = (order.customer_email || order.email || '').trim().toLowerCase();
          const cleanPhone = (order.customer_phone || order.mobile || order.phone || '').toString().trim();
          const cleanEmail = toEmail || null;

          // Check duplicate active license on phone or email
          if (cleanPhone || cleanEmail) {
            let dupQuery = `is_active=eq.true`;
            if (cleanPhone && cleanEmail) {
              dupQuery += `&or=(customer_phone.eq.${encodeURIComponent(cleanPhone)},customer_email.eq.${encodeURIComponent(cleanEmail)})`;
            } else if (cleanPhone) {
              dupQuery += `&customer_phone=eq.${encodeURIComponent(cleanPhone)}`;
            } else {
              dupQuery += `&customer_email=eq.${encodeURIComponent(cleanEmail)}`;
            }

            const dupRes = await fetch(`${SB_URL}/rest/v1/software_licenses?${dupQuery}`, {
              headers: {
                'apikey': SB_KEY,
                'Authorization': `Bearer ${SB_KEY}`
              }
            });
            if (dupRes.ok) {
              const existingLicenses = await dupRes.json();
              const activeLic = existingLicenses.find(l => new Date(l.expires_at) > new Date());
              if (activeLic) {
                return res.status(400).json({ error: `Customer already has an active license (${activeLic.license_key}). Please deactivate it first.` });
              }
            }
          }

          finalKey = generateLicenseKey();

          const expDate = new Date();
          if (isYearly) {
            expDate.setFullYear(expDate.getFullYear() + 1);
          } else {
            expDate.setMonth(expDate.getMonth() + 1);
          }
          expiresAt = expDate.toISOString();

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
              customer_phone: cleanPhone,
              customer_email: cleanEmail,
              plan,
              allowed_devices: allowedDevices,
              expires_at: expiresAt,
              is_active: true
            })
          });

          if (!insLicRes.ok) {
            const errText = await insLicRes.text();
            console.error('[UPDATE ORDER] Failed to insert software license:', errText);
          }
        }

        const toEmail = order.customer_email || order.email || '';
        if (toEmail && finalKey) {
          try {
            await sendDirectLicenseEmail(toEmail, finalKey, plan, expiresAt, order.customer_name);
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

// Handler: Plans
async function handlePlans(req, res) {
  if (req.method === 'GET') {
    try {
      const dbRes = await fetch(`${SB_URL}/rest/v1/subscription_plans?select=*&order=price.asc`, {
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

      const plans = await dbRes.json();
      return res.status(200).json({ success: true, plans });
    } catch (err) {
      console.error('[PLANS API GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, price, description, name, allowed_devices } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Plan ID is required.' });
      }

      const updateData = {};
      if (price !== undefined) updateData.price = parseInt(price);
      if (description !== undefined) updateData.description = description;
      if (name !== undefined) updateData.name = name;
      if (allowed_devices !== undefined) updateData.allowed_devices = parseInt(allowed_devices);
      updateData.updated_at = new Date().toISOString();

      const dbRes = await fetch(`${SB_URL}/rest/v1/subscription_plans?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        return res.status(500).json({ error: `Supabase update error: ${errText}` });
      }

      const data = await dbRes.json();
      return res.status(200).json({ success: true, plan: data[0] });
    } catch (err) {
      console.error('[PLANS API POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Handler: Settings
async function handleSettings(req, res) {
  if (req.method === 'GET') {
    try {
      const dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings?select=*`, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`
        }
      });
      if (!dbRes.ok) {
        const errText = await dbRes.text();
        return res.status(500).json({ error: `Fetch settings error: ${errText}` });
      }
      const settings = await dbRes.json();
      return res.status(200).json({ success: true, settings });
    } catch (err) {
      console.error('[SETTINGS API GET] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { settings } = req.body;
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ error: 'settings array is required.' });
      }

      for (const item of settings) {
        const checkRes = await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.${encodeURIComponent(item.key)}`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`
          }
        });
        const existing = await checkRes.json();
        const method = (existing && existing.length > 0) ? 'PATCH' : 'POST';
        const urlSuffix = method === 'PATCH' ? `?key=eq.${encodeURIComponent(item.key)}` : '';

        await fetch(`${SB_URL}/rest/v1/admin_settings${urlSuffix}`, {
          method,
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            key: item.key,
            value: item.value,
            updated_at: new Date().toISOString()
          })
        });
      }

      return res.status(200).json({ success: true, message: 'Settings updated successfully.' });
    } catch (err) {
      console.error('[SETTINGS API POST] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Resend helpers
async function getResendCredentials() {
  let resendKey = process.env.RESEND_API_KEY;
  let fromEmail = process.env.FROM_EMAIL || 'noreply@harshcsc.com';

  try {
    const dbRes = await fetch(`${SB_URL}/rest/v1/admin_settings?select=*`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`
      }
    });
    if (dbRes.ok) {
      const settings = await dbRes.json();
      const keySetting = settings.find(s => s.key === 'resend_api_key');
      const fromSetting = settings.find(s => s.key === 'from_email');
      if (keySetting && keySetting.value) resendKey = keySetting.value.trim();
      if (fromSetting && fromSetting.value) fromEmail = fromSetting.value.trim();
    }
  } catch (err) {
    console.error('[SETTINGS] Error loading resend credentials from db:', err);
  }

  return { resendKey, fromEmail };
}

async function sendDirectLicenseEmail(toEmail, licenseKey, plan, expiresAt, customerName) {
  const { resendKey, fromEmail } = await getResendCredentials();
  if (!resendKey) {
    throw new Error('Resend API Key is not configured. Kripya Admin Panel > Settings tab me save karein.');
  }

  const planName = (plan || 'monthly').toUpperCase();
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", { day: '2-digit', month: 'long', year: 'numeric' });
  const displayCustomer = customerName || 'Valued Customer';

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Zamify Software Activation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0; -webkit-text-size-adjust: none; width: 100% !important;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 24px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">
          <tr>
            <td style="background-color: #0f1117; padding: 32px; text-align: center;">
              <h1 style="color: #E8671A; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">Harsh CSC eMitra</h1>
              <p style="color: #aaaaaa; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 0.5px;">Digital Experts & Documents Consultation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; color: #333333; line-height: 1.6; font-size: 15px;">
              <h2 style="color: #111111; margin-top: 0; font-size: 20px; text-align: center;">Your Zamify License is Active!</h2>
              <p>Dear ${displayCustomer},</p>
              <p>Thank you for your purchase. Your software activation key has been generated successfully. Please find your license details below:</p>
              
              <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 11px; color: #047857; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; display: block; margin-bottom: 8px;">Your License Key</span>
                <span style="font-size: 22px; font-weight: bold; color: #065f46; letter-spacing: 2px; font-family: monospace; background-color: #ffffff; padding: 8px 16px; border-radius: 4px; display: inline-block; border: 1px solid #d1fae5;">${licenseKey}</span>
                <span style="font-size: 13px; color: #047857; display: block; margin-top: 12px;">Plan: <strong>${planName} Subscription</strong></span>
                <span style="font-size: 13px; color: #047857; display: block; margin-top: 4px;">Expires On: <strong>${expiryDate}</strong></span>
              </div>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px; margin: 24px 0;">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 14px; font-weight: bold; margin-bottom: 8px;">🚀 How to Activate:</h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.8;">
                  <li>Open <strong>Zamify Software</strong> on your Windows PC.</li>
                  <li>Click on the <strong>Activate Key</strong> option.</li>
                  <li>Copy and paste the license key shown above, then click <strong>Verify</strong>.</li>
                  <li>The software will be locked to your PC hardware and activated.</li>
                </ol>
              </div>
              
              <p style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 12px; color: #b45309; margin: 0;">
                ⚠️ <strong>Note:</strong> This key can only be locked to a single computer. Once activated, it cannot be used on another PC without a transfer request.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9f9f9; border-top: 1px solid #eeeeee; padding: 24px; text-align: center; font-size: 12px; color: #888888;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #555555;">Harsh CSC eMitra</p>
              <p style="margin: 0 0 16px 0;">WhatsApp Support: +91 70230 29903</p>
              <p style="margin: 0; font-size: 11px; color: #aaaaaa;">This is an automated email. Please do not reply directly to this message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: `Harsh CSC eMitra <${fromEmail}>`,
      to: toEmail,
      subject: `🔑 Zamify Software Activation Key | Harsh CSC eMitra`,
      html: emailHtml
    })
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(resData.message || 'Failed to send direct email via Resend API.');
  }

  return resData;
}


