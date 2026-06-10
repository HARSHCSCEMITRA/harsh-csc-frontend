// api/auth.js
// Consolidated authentication and recovery flows for Harsh CSC eMitra.
import crypto from 'crypto';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(passwordHash) {
  const secret = process.env.JWT_SECRET || 'harsh-csc-secret-key-12345';
  return crypto.createHmac('sha256', secret).update(passwordHash).digest('hex');
}

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

  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required.' });
  }

  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Database environment variables are missing.' });
  }

  try {
    switch (action) {
      case 'login': {
        const { usernameOrEmail, password } = req.body;
        if (!usernameOrEmail || !password) {
          return res.status(400).json({ error: 'Username/Email and Password are required.' });
        }

        const query = `or=(username.eq.${encodeURIComponent(usernameOrEmail)},email.eq.${encodeURIComponent(usernameOrEmail)})&select=username,role,password_hash`;
        const dbRes = await fetch(`${SB_URL}/rest/v1/users?${query}`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!dbRes.ok) {
          const errText = await dbRes.text();
          return res.status(500).json({ error: `Database error: ${errText}` });
        }

        const users = await dbRes.json();
        if (!users || users.length === 0) {
          return res.status(401).json({ error: 'Username/Email ya Password galat hai.' });
        }

        const user = users[0];
        const inputHash = hashPassword(password);

        if (inputHash === user.password_hash) {
          const token = generateToken(user.password_hash);
          return res.status(200).json({
            success: true,
            token,
            role: user.role,
            username: user.username,
            message: 'Login successful'
          });
        } else {
          return res.status(401).json({ error: 'Username/Email ya Password galat hai.' });
        }
      }

      case 'register': {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
          return res.status(400).json({ error: 'Username, Email and Password are required.' });
        }

        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        const checkRes = await fetch(`${SB_URL}/rest/v1/users?or=(username.eq.${encodeURIComponent(cleanUsername)},email.eq.${encodeURIComponent(cleanEmail)})&select=username`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (checkRes.ok) {
          const existing = await checkRes.json();
          if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'Username ya Email pehle se registered hai.' });
          }
        }

        const passwordHash = hashPassword(password);
        const insertRes = await fetch(`${SB_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            username: cleanUsername,
            email: cleanEmail,
            password_hash: passwordHash,
            role: 'user'
          })
        });

        if (insertRes.ok) {
          return res.status(201).json({ success: true, message: 'User registered successfully!' });
        } else {
          const errText = await insertRes.text();
          return res.status(500).json({ error: `Database insert error: ${errText}` });
        }
      }

      case 'forgot-password': {
        const { usernameOrEmail } = req.body;
        if (!usernameOrEmail) {
          return res.status(400).json({ error: 'Username ya Email likhna zaroori hai.' });
        }

        const searchVal = usernameOrEmail.trim().toLowerCase();
        const query = `or=(username.eq.${encodeURIComponent(searchVal)},email.eq.${encodeURIComponent(searchVal)})&select=id,username,email`;
        const checkRes = await fetch(`${SB_URL}/rest/v1/users?${query}`, {
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
          return res.status(404).json({ error: 'Yeh Username/Email registered nahi hai.' });
        }

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const updateRes = await fetch(`${SB_URL}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            reset_token: token,
            reset_token_expires: expiry
          })
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          return res.status(500).json({ error: `Database update error: ${errText}` });
        }

        const proto = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'harshcscemitra.com';
        const resetLink = `${proto}://${host}/reset-password.html?token=${token}`;

        const emailRes = await fetch(`${SB_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SB_KEY}`
          },
          body: JSON.stringify({
            type: 'password_reset',
            email: user.email,
            data: {
              username: user.username,
              reset_link: resetLink
            }
          })
        });

        const emailData = await emailRes.json();
        if (emailRes.ok && emailData.success) {
          return res.status(200).json({ success: true, message: 'Password reset link aapke email par bhej diya gaya hai!' });
        } else {
          return res.status(500).json({ error: `Email sending failed: ${emailData.error || 'Unknown error'}` });
        }
      }

      case 'forgot-username': {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email likhna zaroori hai.' });
        }

        const cleanEmail = email.trim().toLowerCase();
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
      }

      case 'reset-password': {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
          return res.status(400).json({ error: 'Token aur Naya Password likhna zaroori hai.' });
        }

        const checkRes = await fetch(`${SB_URL}/rest/v1/users?reset_token=eq.${encodeURIComponent(token)}&select=id,username,reset_token_expires,role`, {
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
          return res.status(400).json({ error: 'Invalid ya Expired reset token.' });
        }

        const user = users[0];
        const expiryDate = new Date(user.reset_token_expires);
        if (expiryDate.getTime() < Date.now()) {
          return res.status(400).json({ error: 'Reset link expire ho gaya hai. Kripya naya link request karein.' });
        }

        const newHash = hashPassword(newPassword);
        const updateRes = await fetch(`${SB_URL}/rest/v1/users?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            password_hash: newHash,
            reset_token: null,
            reset_token_expires: null
          })
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          return res.status(500).json({ error: `Database update error: ${errText}` });
        }

        if (user.role === 'admin') {
          await fetch(`${SB_URL}/rest/v1/admin_settings?key=eq.admin_password`, {
            method: 'PATCH',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              value: newPassword,
              updated_at: new Date().toISOString()
            })
          }).catch(err => {
            console.error('[RESET PASSWORD] Failed to sync admin_settings:', err);
          });
        }

        return res.status(200).json({ success: true, message: 'Password successfully reset ho gaya hai! Ab aap login kar sakte hain.' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error(`[AUTH Consolidated API] Error in action ${action}:`, err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
