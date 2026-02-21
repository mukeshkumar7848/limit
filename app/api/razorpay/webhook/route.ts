import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-razorpay-signature",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function generateLicenseKey(): string {
  const seg = () => Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ACPRO-${seg()}-${seg()}-${seg()}-${seg()}`;
}

function buildLicenseEmail(licenseKey: string, paymentId: string, orderId: string, amountPaise: number) {
  const amount = (amountPaise / 100).toFixed(0);
  const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:36px 30px;text-align:center}
.hdr h1{margin:0;font-size:26px}.hdr p{margin:6px 0 0;opacity:.85}
.body{padding:32px 30px}
.key-box{background:#f0f0ff;border:2px dashed #667eea;border-radius:10px;padding:24px;text-align:center;margin:20px 0}
.key{font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#667eea;letter-spacing:2px;word-break:break-all}
table{width:100%;border-collapse:collapse;margin:16px 0}
td{padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:14px}
td:first-child{color:#666;width:40%}td:last-child{font-weight:600}
ol{background:#f8f8ff;border-radius:8px;padding:20px 20px 20px 36px;margin:20px 0}
ol li{margin:8px 0;font-size:14px}
.footer{text-align:center;padding:20px;font-size:12px;color:#aaa;background:#fafafa}
</style></head><body>
<div class="wrap">
<div class="hdr"><h1>🎉 Payment Successful!</h1><p>Your Auto Captions Pro license is ready</p></div>
<div class="body">
<p>Thank you for your purchase! Here is your license key:</p>
<div class="key-box">
<div class="key">${licenseKey}</div>
<p style="font-size:12px;color:#888;margin:8px 0 0">Copy and save this key</p>
</div>
<h3>📋 Order Details</h3>
<table>
<tr><td>License Key</td><td>${licenseKey}</td></tr>
<tr><td>Payment ID</td><td>${paymentId}</td></tr>
<tr><td>Order ID</td><td>${orderId}</td></tr>
<tr><td>Amount Paid</td><td>&#8377;${amount}</td></tr>
<tr><td>Date</td><td>${date} IST</td></tr>
<tr><td>Valid For</td><td>1 Year &bull; 1 Device</td></tr>
</table>
<h3>🚀 How to Activate</h3>
<ol>
<li>Open <strong>Adobe After Effects</strong></li>
<li>Go to <strong>Window &rarr; Extensions &rarr; Auto Captions Pro</strong></li>
<li>Click <strong>"Activate License"</strong></li>
<li>Paste your key: <code>${licenseKey}</code></li>
<li>Click <strong>Activate</strong></li>
</ol>
<p style="font-size:13px;color:#555">Keep this email. Contact support with your Payment ID if needed.</p>
</div>
<div class="footer">&copy; 2026 Auto Captions Pro. All rights reserved.</div>
</div></body></html>`;
}

export async function POST(request: NextRequest) {
  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail    = process.env.FROM_EMAIL || "license@notifications.mukeshfx.com";
  const fromFormatted = fromEmail.includes("<") ? fromEmail : `Auto Captions Pro <${fromEmail}>`;

  console.log("📨 Webhook hit");
  console.log("📧 FROM_EMAIL:", fromEmail);
  console.log("🔑 RESEND key:", resendApiKey ? resendApiKey.substring(0, 8) + "..." : "MISSING!");
  console.log("🗄  SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING!");

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend   = resendApiKey ? new Resend(resendApiKey) : null;
  if (!resend) console.error("❌ RESEND_API_KEY missing — emails will NOT send!");

  try {
    const body = await request.text();
    const razorpaySignature = request.headers.get("x-razorpay-signature");

    if (razorpaySignature) {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (webhookSecret) {
        const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
        if (expected !== razorpaySignature) {
          console.error("❌ Invalid signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 400, headers: corsHeaders });
        }
        console.log("✅ Signature verified");
      }
    }

    const payload = JSON.parse(body);
    const event   = payload.event;
    console.log("📌 Event:", event || "direct-call");

    if (event && event !== "payment.captured") {
      return NextResponse.json({ status: "ignored", event }, { status: 200, headers: corsHeaders });
    }

    const paymentEntity = payload.payload?.payment?.entity || payload;
    const paymentId   = paymentEntity.id || paymentEntity.razorpay_payment_id;
    const orderId     = paymentEntity.order_id || paymentEntity.razorpay_order_id || "";
    const amountPaise = Number(paymentEntity.amount) || 0;
    let   email       = (paymentEntity.email || "").trim();
    const phone       = paymentEntity.contact || "";

    console.log("💳 paymentId:", paymentId);
    console.log("�� orderId  :", orderId);
    console.log("📧 email    :", email || "(empty — will try order notes)");

    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID" }, { status: 400, headers: corsHeaders });
    }

    const { data: existing } = await supabase
      .from("licenses")
      .select("license_key, email")
      .eq("razorpay_payment_id", paymentId)
      .maybeSingle();

    if (existing) {
      console.log("⚠️ Duplicate:", existing.license_key);
      if (resend && existing.email) {
        const { error: eErr } = await resend.emails.send({
          from: fromFormatted, to: existing.email,
          subject: "🎉 Your Auto Captions Pro License Key",
          html: buildLicenseEmail(existing.license_key, paymentId, orderId, amountPaise),
        });
        if (eErr) console.error("❌ Re-send error:", eErr);
        else console.log("📧 Re-sent to:", existing.email);
      }
      return NextResponse.json({ status: "success", license_key: existing.license_key }, { status: 200, headers: corsHeaders });
    }

    let licenseKey = "";
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && orderId) {
      try {
        const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
          headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          licenseKey = orderData.notes?.license_key || "";
          if (!email) email = (orderData.notes?.customer_email || orderData.notes?.email || "").trim();
          console.log("📦 Order notes — licenseKey:", licenseKey, "email:", email);
        } else {
          console.warn("⚠️ Order fetch failed:", orderRes.status);
        }
      } catch (e) {
        console.error("⚠️ Order fetch error:", e);
      }
    }

    if (!licenseKey) {
      licenseKey = generateLicenseKey();
      console.log("🔑 Fallback license key:", licenseKey);
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: dbError } = await supabase.from("licenses").insert({
      license_key:         licenseKey,
      email:               email || null,
      phone:               phone || null,
      razorpay_payment_id: paymentId,
      razorpay_order_id:   orderId || null,
      amount:              amountPaise / 100,
      currency:            paymentEntity.currency || "INR",
      status:              "active",
      device_id:           null,
      activations:         0,
      max_activations:     1,
      created_at:          new Date().toISOString(),
      activated_at:        null,
      expires_at:          expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("❌ DB error:", dbError);
      return NextResponse.json({ error: "DB error", details: dbError.message }, { status: 500, headers: corsHeaders });
    }
    console.log("✅ License saved:", licenseKey);

    if (!email) {
      console.error("❌ No email — skipping send. paymentId:", paymentId);
    } else if (!resend) {
      console.error("❌ Resend not initialized. RESEND_API_KEY missing on Vercel!");
    } else {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from:    fromFormatted,
        to:      email,
        subject: "🎉 Your Auto Captions Pro License Key",
        html:    buildLicenseEmail(licenseKey, paymentId, orderId, amountPaise),
      });
      if (emailError) console.error("❌ Resend error:", JSON.stringify(emailError));
      else console.log("✅ Email sent! ID:", emailData?.id, "To:", email);
    }

    return NextResponse.json(
      { status: "success", message: "License created and email sent", license_key: licenseKey },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Webhook exception:", error);
    return NextResponse.json(
      { error: "Webhook failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { status: "Webhook endpoint active", timestamp: new Date().toISOString() },
    { status: 200, headers: corsHeaders }
  );
}
