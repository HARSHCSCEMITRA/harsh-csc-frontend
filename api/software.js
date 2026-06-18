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
      
      // Get Subscription Plans
      case 'get-plans': {
        try {
          const plans = await sbSelect('subscription_plans', 'order=price.asc');
          return res.status(200).json({ success: true, plans });
        } catch (e) {
          console.error('[SOFTWARE API] plans fetch failed, returning static fallback:', e);
          const fallbackPlans = [
            { id: 'single_monthly', name: 'Single Device - Monthly', price: 50, allowed_devices: 1, billing: 'monthly', description: 'Single device license for 30 days' },
            { id: 'single_yearly', name: 'Single Device - Yearly', price: 500, allowed_devices: 1, billing: 'yearly', description: 'Single device license for 365 days (Best Value)' },
            { id: 'multi_monthly', name: 'Multiple Devices - Monthly', price: 150, allowed_devices: 3, billing: 'monthly', description: 'Up to 3 devices license for 30 days' },
            { id: 'multi_yearly', name: 'Multiple Devices - Yearly', price: 1500, allowed_devices: 3, billing: 'yearly', description: 'Up to 3 devices license for 365 days (Best Value)' }
          ];
          return res.status(200).json({ success: true, plans: fallbackPlans });
        }
      }

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

        const downloadUrl = "https://drive.google.com/drive/folders/1TAhnbOI2-wVw4usLDd7MI5m_7vAEBHYY?usp=sharing";

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

          // If locked to one or more machines (comma-separated list)
          const devices = license.machine_id.split(',').map(d => d.trim()).filter(Boolean);
          if (devices.includes(machine_id)) {
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

          // If current machine is not locked yet, check allowed limit
          const allowedLimit = license.allowed_devices || 1;
          if (devices.length < allowedLimit) {
            const updatedMachineIds = [...devices, machine_id].join(',');
            await sbUpdate('software_licenses', `id=eq.${license.id}`, { machine_id: updatedMachineIds });
            return res.status(200).json({
              status: 'active',
              type: 'license',
              expires_at: license.expires_at,
              customer_name: license.customer_name,
              latest_version: latestVersion,
              download_url: downloadUrl,
              message: 'License activated and bound to this additional machine successfully.'
            });
          }

          // If locked to different machines and limit reached
          return res.status(400).json({
            status: 'mismatch',
            latest_version: latestVersion,
            download_url: downloadUrl,
            message: `This license has reached the maximum allowed devices limit (${allowedLimit} devices).`
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

        const cleanPhone = phone.trim();
        const cleanEmail = email ? email.trim().toLowerCase() : null;

        // 1. Check duplicate machine ID
        const existing = await sbSelect('software_trials', `machine_id=eq.${encodeURIComponent(machine_id)}&limit=1`);
        if (existing && existing.length > 0) {
          return res.status(400).json({ error: 'A trial has already been activated on this computer.' });
        }

        // 2. Check duplicate phone/email in software_trials
        let trialQuery = `phone=eq.${encodeURIComponent(cleanPhone)}`;
        if (cleanEmail) {
          trialQuery = `or=(phone.eq.${encodeURIComponent(cleanPhone)},email.eq.${encodeURIComponent(cleanEmail)})`;
        }
        const existingTrial = await sbSelect('software_trials', `${trialQuery}&limit=1`);
        if (existingTrial && existingTrial.length > 0) {
          return res.status(400).json({ error: 'This phone number or email is already registered for a trial.' });
        }

        // 3. Check duplicate phone/email in software_licenses (only active/unexpired licenses)
        let licenseQuery = `customer_phone=eq.${encodeURIComponent(cleanPhone)}`;
        if (cleanEmail) {
          licenseQuery = `or=(customer_phone.eq.${encodeURIComponent(cleanPhone)},customer_email.eq.${encodeURIComponent(cleanEmail)})`;
        }
        const existingLicense = await sbSelect('software_licenses', `${licenseQuery}&is_active=eq.true&limit=10`);
        if (existingLicense && existingLicense.length > 0) {
          const activeLic = existingLicense.find(l => new Date(l.expires_at) > new Date());
          if (activeLic) {
            return res.status(400).json({ error: 'An active license is already registered with this phone number or email.' });
          }
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial

        await sbInsert('software_trials', {
          machine_id,
          name,
          email: cleanEmail,
          phone: cleanPhone,
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
        const { machine_id, license_key, name, email, phone } = req.body;
        if (!machine_id || !license_key || !name || !email || !phone) {
          return res.status(400).json({ error: 'All fields (machine_id, license_key, name, email, phone) are required.' });
        }

        const cleanKey = license_key.trim();
        const cleanName = name.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim().toLowerCase();

        const licenses = await sbSelect('software_licenses', `license_key=eq.${encodeURIComponent(cleanKey)}&limit=1`);
        
        if (!licenses || licenses.length === 0) {
          return res.status(400).json({ error: 'Invalid license key.' });
        }

        const license = licenses[0];

        // Verify customer details (case-insensitive)
        const dbName = (license.customer_name || '').trim().toLowerCase();
        const dbEmail = (license.customer_email || '').trim().toLowerCase();
        const dbPhone = (license.customer_phone || '').trim().toLowerCase();

        if (dbName !== cleanName || dbPhone !== cleanPhone) {
          return res.status(400).json({ error: 'Verification failed: Name or Phone does not match our records.' });
        }

        if (dbEmail && dbEmail !== cleanEmail) {
          return res.status(400).json({ error: 'Verification failed: Email does not match our records.' });
        }

        // If email is not in db but provided, save it
        if (!dbEmail && cleanEmail) {
          await sbUpdate('software_licenses', `id=eq.${license.id}`, { customer_email: cleanEmail });
        }

        if (!license.is_active) {
          return res.status(400).json({ error: 'License key is deactivated.' });
        }

        const expiresAt = new Date(license.expires_at);
        if (expiresAt < new Date()) {
          return res.status(400).json({ error: 'License key has expired.' });
        }

        // Check machine lock limits
        if (license.machine_id) {
          const devices = license.machine_id.split(',').map(d => d.trim()).filter(Boolean);
          const allowedLimit = license.allowed_devices || 1;

          if (devices.includes(machine_id)) {
            return res.status(200).json({
              success: true,
              expires_at: license.expires_at,
              customer_name: license.customer_name,
              message: 'License key is already activated and bound to this machine.'
            });
          }

          if (devices.length >= allowedLimit) {
            return res.status(400).json({ error: `This license has reached the maximum allowed devices limit (${allowedLimit} devices).` });
          }

          // Append machine lock
          const updatedMachineIds = [...devices, machine_id].join(',');
          await sbUpdate('software_licenses', `id=eq.${license.id}`, { machine_id: updatedMachineIds });
        } else {
          // Lock to this machine first
          await sbUpdate('software_licenses', `id=eq.${license.id}`, { machine_id });
        }

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
              await sendDirectLicenseEmail(toEmail, lic.license_key, lic.plan, lic.expires_at, order.customer_name);
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

        if (toEmail) {
          try {
            await sendDirectLicenseEmail(toEmail, licenseKey, plan, expiresAt.toISOString(), order.customer_name);
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
