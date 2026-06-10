import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL    = Deno.env.get("ADMIN_EMAIL") || "harshcscemitra@gmail.com";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")  || "noreply@harshcsc.com";
const SITE_NAME      = "Harsh CSC eMitra";
const SITE_TAGLINE   = "Digital Experts & Documents Consultation";
const SITE_URL       = "https://harshcscemitra.com";

// ─── Brand Colors ────────────────────────
const ORANGE = "#E8671A";
const DARK   = "#0f1117";
const GOLD   = "#F5C842";

// ─── Email Templates ─────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:24px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:${ORANGE};letter-spacing:1px;">${SITE_NAME}</div>
            <div style="font-size:11px;color:#aaa;margin-top:4px;letter-spacing:0.5px;">${SITE_TAGLINE}</div>
          </td>
        </tr>

        <!-- Content -->
        <tr><td style="padding:32px;">${content}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eee;padding:20px 32px;text-align:center;">
            <div style="font-size:12px;color:#888;line-height:1.6;">
              <strong style="color:#555;">${SITE_NAME}</strong> — ${SITE_TAGLINE}<br/>
              <a href="${SITE_URL}" style="color:${ORANGE};text-decoration:none;">${SITE_URL}</a> &nbsp;|&nbsp;
              <a href="mailto:${ADMIN_EMAIL}" style="color:${ORANGE};text-decoration:none;">${ADMIN_EMAIL}</a> &nbsp;|&nbsp;
              📞 +91 70230 29903
            </div>
            <div style="font-size:11px;color:#aaa;margin-top:8px;">
              This is an automated email. Please do not reply directly to this email.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── 1. ORDER CONFIRMATION ────────────────
function orderConfirmationEmail(order: any) {
  const items = order.items?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin:16px 0;">
        <tr style="background:#f9f9f9;">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#666;">Service</th>
          <th style="padding:10px 14px;text-align:right;font-size:12px;color:#666;">Amount</th>
        </tr>
        ${order.items.map((item: any) => `
        <tr style="border-top:1px solid #eee;">
          <td style="padding:10px 14px;font-size:13px;">${item.name || item.service}</td>
          <td style="padding:10px 14px;font-size:13px;text-align:right;font-weight:600;">₹${Number(item.price || item.amount || 0).toLocaleString("en-IN")}</td>
        </tr>`).join("")}
        <tr style="border-top:2px solid #eee;background:#fff8f0;">
          <td style="padding:12px 14px;font-weight:700;font-size:14px;">Total</td>
          <td style="padding:12px 14px;font-weight:800;font-size:16px;text-align:right;color:${ORANGE};">₹${Number(order.amount || 0).toLocaleString("en-IN")}</td>
        </tr>
      </table>`
    : `<div style="background:#fff8f0;border:1px solid #ffe0c0;border-radius:8px;padding:14px 16px;margin:16px 0;display:flex;justify-content:space-between;">
        <span style="font-size:14px;">${order.service_type || order.service || "Service"}</span>
        <span style="font-size:16px;font-weight:800;color:${ORANGE};">₹${Number(order.amount || 0).toLocaleString("en-IN")}</span>
      </div>`;

  const content = `
    <!-- Checkmark -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:60px;height:60px;background:#e8f5e9;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
      <h2 style="margin:0;font-size:20px;color:#1a1a1a;">Order Confirm Ho Gaya!</h2>
      <p style="margin:6px 0 0;color:#666;font-size:13px;">Your order has been placed successfully</p>
    </div>

    <!-- Order ID Box -->
    <div style="background:#fff8f0;border:2px dashed ${ORANGE};border-radius:10px;padding:14px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Order Reference</div>
      <div style="font-size:20px;font-weight:800;color:${ORANGE};letter-spacing:2px;">${order.ref_id || order.id || "—"}</div>
      <div style="font-size:11px;color:#888;margin-top:4px;">Please save this number for order tracking</div>
    </div>

    <!-- Customer Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#666;width:40%;">👤 Customer</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;">${order.customer_name || order.name || "—"}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#666;">📱 Mobile</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;">${order.mobile || "—"}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#666;">📅 Date</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;">${new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
      </tr>
    </table>

    <!-- Items -->
    ${items}

    <!-- Next Steps -->
    <div style="background:#f0f7ff;border-left:4px solid #3b82f6;border-radius:4px;padding:14px 16px;margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:8px;">📋 Aage Kya Hoga:</div>
      <ol style="margin:0;padding-left:18px;font-size:12px;color:#374151;line-height:2;">
        <li>Our team will contact you within <strong>24 hours</strong></li>
        <li>We will share the list of required documents</li>
        <li>Processing will begin once documents are received</li>
        <li>You will receive an email once your order is complete</li>
      </ol>
    </div>

    <!-- Track Button -->
    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/track?ref=${order.ref_id || order.id || ""}" 
         style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        📦 Order Track Karo
      </a>
    </div>

    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:20px;">
      For any queries, WhatsApp us: <strong>+91 70230 29903</strong>
    </p>`;

  return {
    subject: `✅ Order Confirm — ${order.ref_id || order.id} | ${SITE_NAME}`,
    html: baseTemplate(content),
  };
}

// ── 2. STATUS UPDATE ─────────────────────
function statusUpdateEmail(order: any) {
  const STATUS_CONFIG: Record<string, { emoji: string; color: string; title: string; msg: string; bgColor: string }> = {
    processing: { emoji: "⚙️", color: "#3b82f6", bgColor: "#eff6ff", title: "Processing Shuru Ho Gayi!", msg: "Aapki application hamare experts ke paas hai. Kaam chal raha hai!" },
    documents_required: { emoji: "📋", color: "#f59e0b", bgColor: "#fffbeb", title: "Documents Required!", msg: "Additional documents are required for processing. Please submit them at the earliest." },
    approved: { emoji: "🎉", color: "#10b981", bgColor: "#ecfdf5", title: "Application Approved!", msg: "Congratulations! Your application has been approved." },
    completed: { emoji: "✅", color: "#22c55e", bgColor: "#f0fdf4", title: "Order Completed!", msg: "Your work has been completed successfully. Thank you!" },
    delivered: { emoji: "📬", color: "#8b5cf6", bgColor: "#f5f3ff", title: "Order Delivered!", msg: "Your document/card has been successfully delivered." },
    rejected: { emoji: "❌", color: "#ef4444", bgColor: "#fef2f2", title: "Application Rejected", msg: "We regret to inform you that your application has been rejected. Please contact us for details." },
    cancelled: { emoji: "🚫", color: "#6b7280", bgColor: "#f9fafb", title: "Order Cancelled", msg: "Your order has been cancelled. Please contact us regarding your refund." },
  };

  const cfg = STATUS_CONFIG[order.status] || { emoji: "🔄", color: ORANGE, bgColor: "#fff8f0", title: "Status Update", msg: "Aapke order mein update hai." };

  const content = `
    <!-- Status Icon -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:${cfg.bgColor};border-radius:50%;margin:0 auto 12px;line-height:64px;text-align:center;font-size:30px;border:2px solid ${cfg.color};">${cfg.emoji}</div>
      <h2 style="margin:0;font-size:20px;color:#1a1a1a;">${cfg.title}</h2>
      <p style="margin:6px 0 0;color:#555;font-size:13px;">${cfg.msg}</p>
    </div>

    <!-- Order Info Box -->
    <div style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <div style="background:${cfg.bgColor};border-bottom:1px solid #eee;padding:10px 16px;">
        <span style="font-size:12px;color:${cfg.color};font-weight:700;text-transform:uppercase;">Order Details</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #f5f5f5;width:40%;">Order Ref</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:${ORANGE};border-bottom:1px solid #f5f5f5;">${order.ref_id || order.id || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #f5f5f5;">Service</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f5f5f5;">${order.service_type || order.service || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;border-bottom:1px solid #f5f5f5;">Customer</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid #f5f5f5;">${order.customer_name || order.name || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;">New Status</td>
          <td style="padding:10px 16px;">
            <span style="display:inline-block;background:${cfg.bgColor};color:${cfg.color};font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;border:1px solid ${cfg.color};">
              ${cfg.emoji} ${order.status?.replace(/_/g," ").toUpperCase() || "UPDATED"}
            </span>
          </td>
        </tr>
        ${order.tracking_id ? `
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;border-top:1px solid #f5f5f5;">Tracking ID</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#3b82f6;border-top:1px solid #f5f5f5;">${order.tracking_id}</td>
        </tr>` : ""}
        ${order.admin_note ? `
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#666;border-top:1px solid #f5f5f5;">Note</td>
          <td style="padding:10px 16px;font-size:13px;border-top:1px solid #f5f5f5;">${order.admin_note}</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- Documents Required Special Box -->
    ${order.status === "documents_required" && order.required_docs ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:8px;">📎 Yeh Documents Bhejo:</div>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#78350f;line-height:2;">
        ${order.required_docs.split(",").map((d: string) => `<li>${d.trim()}</li>`).join("")}
      </ul>
    </div>` : ""}

    <!-- Track Button -->
    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/track?ref=${order.ref_id || order.id || ""}"
         style="display:inline-block;background:${cfg.color};color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        🔍 Order Status Dekho
      </a>
    </div>

    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:20px;">
      For any queries, WhatsApp us: <strong>+91 70230 29903</strong>
    </p>`;

  return {
    subject: `${cfg.emoji} Order ${order.status?.replace(/_/g," ")} — ${order.ref_id || order.id} | ${SITE_NAME}`,
    html: baseTemplate(content),
  };
}

function passwordResetEmail(data: any) {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:60px;height:60px;background:#fffbeb;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">🔑</div>
      <h2 style="margin:0;font-size:20px;color:#1a1a1a;">Password Reset Request</h2>
      <p style="margin:6px 0 0;color:#666;font-size:13px;">Aapne password reset karne ka request kiya hai</p>
    </div>

    <p style="font-size:14px;color:#333;line-height:1.6;">
      Namaste <strong>${data.username}</strong>,<br/><br/>
      Aapke account ka password reset karne ke liye niche diye gaye button par click karein. Yeh link <strong>1 ghante</strong> ke liye valid hai:
    </p>

    <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
      <a href="${data.reset_link}" 
         style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        🔑 Reset Password
      </a>
    </div>

    <p style="font-size:12px;color:#888;line-height:1.6;">
      Agar button kaam nahi kar raha hai, toh is URL ko copy karke browser me paste karein:<br/>
      <a href="${data.reset_link}" style="color:${ORANGE};word-break:break-all;">${data.reset_link}</a>
    </p>

    <p style="font-size:12px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:12px;">
      Agar aapne yeh request nahi kiya tha, toh is email ko ignore karein. Aapka password secure rahega.
    </p>`;

  return {
    subject: `🔑 Password Reset Link | ${SITE_NAME}`,
    html: baseTemplate(content),
  };
}

function usernameRecoveryEmail(data: any) {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:60px;height:60px;background:#e0f2fe;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">👤</div>
      <h2 style="margin:0;font-size:20px;color:#1a1a1a;">Username Recovery</h2>
      <p style="margin:6px 0 0;color:#666;font-size:13px;">Aapka registered username niche diya gaya hai</p>
    </div>

    <p style="font-size:14px;color:#333;line-height:1.6;">
      Namaste,<br/><br/>
      Aapke email address se linked username ye hai:
    </p>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;text-align:center;font-size:18px;font-weight:800;color:#0369a1;letter-spacing:1px;margin:20px 0;">
      ${data.username}
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${SITE_URL}/admin.html" 
         style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        🏛️ Login Portal Par Jaayein
      </a>
    </div>`;

  return {
    subject: `👤 Recovered Username | ${SITE_NAME}`,
    html: baseTemplate(content),
  };
}

// ─── Send Email via Resend ────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: `${SITE_NAME} <${FROM_EMAIL}>`, to, subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Email send failed");
  return data;
}

// ─── Main Handler ────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const body = await req.json();
    const { type, order, email } = body;

    // Customer ka email
    const toEmail = email || order?.email || order?.customer_email;
    if (!toEmail) throw new Error("Email address nahi mila");

    let emailData;

    if (type === "order_confirmation") {
      emailData = orderConfirmationEmail(order);
    } else if (type === "status_update") {
      emailData = statusUpdateEmail(order);
    } else if (type === "password_reset") {
      emailData = passwordResetEmail(body.data);
    } else if (type === "username_recovery") {
      emailData = usernameRecoveryEmail(body.data);
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    const result = await sendEmail(toEmail, emailData.subject, emailData.html);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
