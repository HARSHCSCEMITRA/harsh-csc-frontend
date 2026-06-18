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
            await fetch(`${SB_URL}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SB_KEY}`
              },
              body: JSON.stringify({
                type: 'license_activation',
                email: cleanEmail,
                data: {
                  license_key: licenseKey,
                  plan: plan || 'monthly',
                  expires_at: expiresAt.toISOString()
                }
              })
            });
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
        (item.product_id && item.product_id.includes('s_automation')) ||
        (item.name && item.name.toLowerCase().includes('automation'))
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

        if (existingLic && existingLic.length > 0) {
          finalKey = existingLic[0].license_key;
          expiresAt = existingLic[0].expires_at;
          plan = existingLic[0].plan;
        } else {
          const isYearly = softwareItem.product_id?.includes('yearly') || softwareItem.name?.toLowerCase().includes('1 year');
          plan = isYearly ? 'yearly' : 'monthly';

          const toEmail = order.customer_email || order.email || '';
          const cleanPhone = (order.customer_phone || '').trim();
          const cleanEmail = toEmail ? toEmail.trim().toLowerCase() : null;

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
              allowed_devices: 1,
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

