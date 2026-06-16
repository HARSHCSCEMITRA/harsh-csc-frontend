// /api/software.js
// Vercel Serverless Function to manage trials, licenses and activation for the automation software.
// Connects directly to Supabase REST API using service_role key.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Supabase Helpers ──────────────────────────────────────────
async function sbSelect(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase SELECT error: ${err}`);
  }
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase INSERT error: ${err}`);
  }
  return res.json();
}

async function sbUpdate(table, match, data) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase UPDATE error: ${err}`);
  }
  return res.json();
}

// Helper to generate human-readable license key: CSC-AUTO-XXXX-XXXX-XXXX
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const part = (len, charSet) => Array.from({ length: len }, () => charSet[Math.floor(Math.random() * charSet.length)]).join('');
  return `CSC-AUTO-${part(4, chars)}-${part(4, nums)}-${part(4, chars)}`;
}

// Helper to mask email address: g****@gmail.com
function maskEmail(email) {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
}

// ─── Main Handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.method === 'GET' ? req.query : req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    switch (action) {
      
      // 1. Verify Status (Used by python script to check trial/license validation)
      case 'verify': {
        const { machine_id, license_key } = req.body;
        if (!machine_id) {
          return res.status(400).json({ error: 'machine_id is required.' });
        }

        // Fetch latest version from admin_settings
        let latestVersion = '1.0.0';
        try {
          const versionSettings = await sbSelect('admin_settings', 'key=eq.latest_software_version&select=value');
          if (versionSettings && versionSettings.length > 0) {
            latestVersion = versionSettings[0].value;
          }
        } catch (e) {
          console.error('[SOFTWARE API] Version fetch failed:', e);
        }

        const downloadUrl = "https://qhqvmzrdncxddzlfrgrn.supabase.co/storage/v1/object/public/software/Harsh_CSC_Automation_Setup.zip";

        // Action A: If user provided a license key, verify license first
        if (license_key && license_key.trim().length > 0) {
          const cleanKey = license_key.trim();
          const licenses = await sbSelect('software_licenses', `license_key=eq.${encodeURIComponent(cleanKey)}&limit=1`);
          
          if (!licenses || licenses.length === 0) {
            return res.status(400).json({ status: 'invalid', message: 'License key is invalid.', latest_version: latestVersion, download_url: downloadUrl });
          }

          const license = licenses[0];

          if (!license.is_active) {
            return res.status(400).json({ status: 'inactive', message: 'License key has been deactivated.', latest_version: latestVersion, download_url: downloadUrl });
          }

          const expiresAt = new Date(license.expires_at);
          if (expiresAt < new Date()) {
            return res.status(400).json({ status: 'expired', message: 'License key has expired.', latest_version: latestVersion, download_url: downloadUrl });
          }

          // Lock to machine_id if not locked yet
          if (!license.machine_id) {
            await sbUpdate('software_licenses', `id=eq.${license.id}`, { machine_id });
            return res.status(200).json({
              status: 'active',
              type: 'license',
              expires_at: license.expires_at,
              customer_name: license.customer_name,
              latest_version: latestVersion,
              download_url: downloadUrl,
              message: 'License activated and locked to this machine successfully.'
            });
          }

          // If locked to this machine
          if (license.machine_id === machine_id) {
            return res.status(200).json({
              status: 'active',
              type: 'license',
              expires_at: license.expires_at,
              customer_name: license.customer_name,
              latest_version: latestVersion,
              download_url: downloadUrl,
              message: 'License is active.'
            });
          }

          // If locked to a different machine
          return res.status(400).json({
            status: 'mismatch',
            latest_version: latestVersion,
            download_url: downloadUrl,
            message: 'This license key is already registered on another computer.'
          });
        }

        // Action B: No license key provided, check for active trial
        const trials = await sbSelect('software_trials', `machine_id=eq.${encodeURIComponent(machine_id)}&limit=1`);
        
        if (!trials || trials.length === 0) {
          return res.status(200).json({ status: 'unregistered', message: 'No active trial or license found.', latest_version: latestVersion, download_url: downloadUrl });
        }

        const trial = trials[0];
        const trialEndsAt = new Date(trial.trial_ends_at);

        if (trialEndsAt < new Date()) {
          return res.status(200).json({ status: 'trial_expired', message: 'Your 7-day trial has ended. Please buy a subscription.', latest_version: latestVersion, download_url: downloadUrl });
        }

        // Update trial usage count
        await sbUpdate('software_trials', `machine_id=eq.${encodeURIComponent(machine_id)}`, {
          usage_count: trial.usage_count + 1
        });

        const daysLeft = Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24));
        return res.status(200).json({
          status: 'trial_active',
          type: 'trial',
          trial_ends_at: trial.trial_ends_at,
          days_left: daysLeft,
          usage_count: trial.usage_count + 1,
          latest_version: latestVersion,
          download_url: downloadUrl,
          message: `Trial active. ${daysLeft} days remaining.`
        });
      }

      // 2. Register Trial (Used by python script when first registering)
      case 'trial-register': {
        const { machine_id, name, email, phone } = req.body;
        if (!machine_id || !name || !phone) {
          return res.status(400).json({ error: 'machine_id, name, and phone are required.' });
        }

        // Check duplicate machine ID
        const existing = await sbSelect('software_trials', `machine_id=eq.${encodeURIComponent(machine_id)}&limit=1`);
        if (existing && existing.length > 0) {
          return res.status(400).json({ error: 'A trial has already been activated on this computer.' });
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial

        await sbInsert('software_trials', {
          machine_id,
          name,
          email: email || null,
          phone,
          trial_ends_at: trialEndsAt.toISOString()
        });

        return res.status(200).json({
          success: true,
          trial_ends_at: trialEndsAt.toISOString(),
          message: '7-day trial activated successfully.'
        });
      }

      // 3. Activate License (Explicit key lock to machine)
      case 'activate-license': {
        const { machine_id, license_key } = req.body;
        if (!machine_id || !license_key) {
          return res.status(400).json({ error: 'machine_id and license_key are required.' });
        }

        const cleanKey = license_key.trim();
        const licenses = await sbSelect('software_licenses', `license_key=eq.${encodeURIComponent(cleanKey)}&limit=1`);
        
        if (!licenses || licenses.length === 0) {
          return res.status(400).json({ error: 'Invalid license key.' });
        }

        const license = licenses[0];

        if (!license.is_active) {
          return res.status(400).json({ error: 'License key is deactivated.' });
        }

        const expiresAt = new Date(license.expires_at);
        if (expiresAt < new Date()) {
          return res.status(400).json({ error: 'License key has expired.' });
        }

        if (license.machine_id && license.machine_id !== machine_id) {
          return res.status(400).json({ error: 'This license is already registered on another computer.' });
        }

        // Update with machine lock
        await sbUpdate('software_licenses', `id=eq.${license.id}`, { machine_id });

        return res.status(200).json({
          success: true,
          expires_at: license.expires_at,
          customer_name: license.customer_name,
          message: 'License key successfully activated and bound to this machine.'
        });
      }

      // 4. Retrieve or Generate License Key & Email it to Customer (Secure delivery, no UI leak)
      case 'retrieve-key': {
        const { order_ref } = req.method === 'GET' ? req.query : req.body;
        if (!order_ref) {
          return res.status(400).json({ error: 'order_ref is required.' });
        }

        const cleanRef = order_ref.trim().toUpperCase();

        // Step A: Check if license is already generated
        const existingLicenses = await sbSelect('software_licenses', `order_ref=eq.${encodeURIComponent(cleanRef)}&limit=1`);
        if (existingLicenses && existingLicenses.length > 0) {
          const lic = existingLicenses[0];
          // Find email from order
          const orders = await sbSelect('orders', `order_ref=eq.${encodeURIComponent(cleanRef)}&limit=1`);
          const order = orders && orders.length > 0 ? orders[0] : {};
          const toEmail = order.customer_email || order.email || '';
          
          if (toEmail) {
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
                    license_key: lic.license_key,
                    plan: lic.plan,
                    expires_at: lic.expires_at
                  }
                })
              });
            } catch (e) {
              console.error('[SOFTWARE API] Email resend failed:', e);
            }
          }
          
          return res.status(200).json({
            success: true,
            email_masked: maskEmail(toEmail),
            message: 'License key has been resent to your registered email address.'
          });
        }

        // Step B: Look up order in `orders` table
        const orders = await sbSelect('orders', `order_ref=eq.${encodeURIComponent(cleanRef)}&limit=1`);
        if (!orders || orders.length === 0) {
          return res.status(404).json({ error: 'Order reference number not found.' });
        }

        const order = orders[0];

        // Step C: Confirm payment
        if (order.status !== 'paid' && order.status !== 'completed' && order.payment_status !== 'Payment Received') {
          return res.status(400).json({
            error: `Order status is "${order.status}". License keys can only be retrieved after payment confirmation.`
          });
        }

        // Step D: Confirm order contains software
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

        if (!softwareItem) {
          return res.status(400).json({ error: 'This order does not contain an automation software subscription.' });
        }

        // Step E: Generate a new License Key
        const isYearly = softwareItem.product_id?.includes('yearly') || softwareItem.name?.toLowerCase().includes('1 year');
        const plan = isYearly ? 'yearly' : 'monthly';
        const licenseKey = generateLicenseKey();

        const expiresAt = new Date();
        if (isYearly) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month
        }

        await sbInsert('software_licenses', {
          license_key: licenseKey,
          order_ref: cleanRef,
          customer_name: order.customer_name || 'Valued Customer',
          customer_phone: order.customer_phone || '',
          plan,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

        // Trigger email sending
        const toEmail = order.customer_email || order.email || '';
        if (toEmail) {
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
                  license_key: licenseKey,
                  plan,
                  expires_at: expiresAt.toISOString()
                }
              })
            });
          } catch (e) {
            console.error('[SOFTWARE API] Email trigger failed:', e);
          }
        }

        return res.status(200).json({
          success: true,
          email_masked: maskEmail(toEmail),
          message: 'License key generated successfully and sent to your registered email!'
        });
      }

      // 5. Submit PC Reset Request (Customer Facing)
      case 'request-reset': {
        const { license_key, email, reason } = req.body;
        if (!license_key || !email || !reason) {
          return res.status(400).json({ error: 'License key, email, and reason are required.' });
        }
        
        // Verify license key is valid
        const licenses = await sbSelect('software_licenses', `license_key=eq.${encodeURIComponent(license_key.trim())}&limit=1`);
        if (!licenses || licenses.length === 0) {
          return res.status(400).json({ error: 'License key is invalid.' });
        }
        
        const lic = licenses[0];
        
        // Fetch order to verify email match
        const orders = await sbSelect('orders', `order_ref=eq.${encodeURIComponent(lic.order_ref)}&limit=1`);
        if (!orders || orders.length === 0) {
          return res.status(400).json({ error: 'Order not found for this license key.' });
        }
        
        const order = orders[0];
        const registeredEmail = (order.customer_email || order.email || '').trim().toLowerCase();
        
        if (registeredEmail !== email.trim().toLowerCase()) {
          return res.status(400).json({ error: 'Email does not match the registered purchase email.' });
        }
        
        // Check duplicate pending requests
        const existingResets = await sbSelect('license_resets', `license_key=eq.${encodeURIComponent(license_key.trim())}&status=eq.pending&limit=1`);
        if (existingResets && existingResets.length > 0) {
          return res.status(400).json({ error: 'A reset request is already pending for this license key.' });
        }
        
        // Create request
        await sbInsert('license_resets', {
          license_key: license_key.trim(),
          email: email.trim().toLowerCase(),
          reason: reason.trim(),
          status: 'pending'
        });
        
        return res.status(200).json({
          success: true,
          message: 'Reset request submitted successfully. It will be reviewed by admin.'
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[SOFTWARE API] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
