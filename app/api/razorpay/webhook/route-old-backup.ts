import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-razorpay-signature',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Initialize clients
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get the request body
    const body = await request.text();
    
    // Get Razorpay signature from headers
    const razorpaySignature = request.headers.get("x-razorpay-signature");
    
    // Parse the payload first to get email even if signature missing
    const payload = JSON.parse(body);
    const event = payload.event;
    
    console.log("📨 Webhook received - Event:", event);

    // If no signature, treat as direct call from frontend (backup)
    if (!razorpaySignature) {
      console.log("⚠️ No signature - treating as direct call");
      
      // Only process if it's payment.captured
      if (event === "payment.captured" || payload.razorpay_payment_id) {
        const paymentData = payload.payload?.payment?.entity || payload;
        const paymentId = paymentData.razorpay_payment_id || paymentData.id;
        const orderId = paymentData.razorpay_order_id || paymentData.order_id;
        const email = paymentData.email || payload.email;
        const phone = paymentData.contact || payload.phone;
        const amount = paymentData.amount || payload.amount;
        const licenseKey = payload.license_key;

        console.log("📧 Email from payload:", email);
        console.log("🔑 License key:", licenseKey);

        if (email && licenseKey) {
          // Save to database
          const { error: dbError } = await supabase
            .from("licenses")
            .insert({
              license_key: licenseKey,
              email: email,
              phone: phone,
              razorpay_payment_id: paymentId,
              razorpay_order_id: orderId,
              amount: amount / 100,
              currency: "INR",
              status: "active",
              device_id: null,
              activations: 0,
              max_activations: 1,
              created_at: new Date().toISOString(),
            });

          if (dbError) {
            console.error("❌ Database error:", dbError);
          } else {
            console.log("✅ License saved to database");
          }

          // Send email
          if (resend) {
            try {
              await resend.emails.send({
                from: process.env.FROM_EMAIL || "Auto Captions Pro <noreply@notifications.mukeshfx.com>",
                to: email,
                subject: "🎉 Your Auto Captions Pro License Key",
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                      .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
                      .license-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
                      .license-key { font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
                      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>🎉 Welcome to Auto Captions Pro!</h1>
                        <p>Thank you for your purchase</p>
                      </div>
                      <div class="content">
                        <h2>Your License Key</h2>
                        <div class="license-box">
                          <p style="margin: 0 0 10px; color: #666;">Copy this license key:</p>
                          <div class="license-key">${licenseKey}</div>
                        </div>
                        
                        <h3>📝 How to Activate:</h3>
                        <ol>
                          <li>Open Adobe After Effects</li>
                          <li>Go to <strong>Window → Extensions → Auto Captions Pro</strong></li>
                          <li>Click <strong>"Activate License"</strong></li>
                          <li>Paste your license key: <code>${licenseKey}</code></li>
                          <li>Click <strong>"Activate"</strong></li>
                        </ol>

                        <h3>📋 Payment Details:</h3>
                        <ul>
                          <li><strong>Payment ID:</strong> ${paymentId}</li>
                          <li><strong>Order ID:</strong> ${orderId}</li>
                          <li><strong>Amount:</strong> ₹${amount / 100}</li>
                        </ul>

                        <h3>💡 Important Notes:</h3>
                        <ul>
                          <li>✅ This is a <strong>lifetime license</strong> with free updates</li>
                          <li>✅ Can be activated on <strong>1 device</strong></li>
                          <li>✅ Keep this email safe for future reference</li>
                        </ul>
                      </div>
                      <div class="footer">
                        <p>© 2026 Auto Captions Pro. All rights reserved.</p>
                        <p>Need help? Reply to this email or visit our support page.</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `
              });

              console.log("✅ Email sent successfully to:", email);
            } catch (emailError) {
              console.error("❌ Email sending failed:", emailError);
            }
          } else {
            console.log("⚠️ Resend not configured, skipping email");
          }
        }

        return NextResponse.json(
          { success: true, message: "Webhook processed" },
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // If signature exists, verify it (official Razorpay webhook)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (webhookSecret && razorpaySignature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        console.error("❌ Invalid Razorpay signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400, headers: corsHeaders }
        );
      }

      console.log("✅ Signature verified");
    }

    // Handle webhook event
    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      console.log("💳 Payment captured:", paymentEntity);
      
      // Generate license key
      const licenseKey = `ACPRO-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      // Save to database and send email (same logic as above)
      // ... (implement full logic if needed)
    }

    return NextResponse.json(
      { status: "success", event },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: corsHeaders }
  );
}
