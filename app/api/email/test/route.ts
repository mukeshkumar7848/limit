import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { email, license_key } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;

    // Debug info
    const debugInfo = {
      resend_api_key_set: !!resendApiKey,
      resend_api_key_prefix: resendApiKey ? resendApiKey.substring(0, 8) + "..." : "NOT SET",
      from_email: fromEmail || "NOT SET",
      to_email: email,
      timestamp: new Date().toISOString(),
    };

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is not set in environment variables",
          debug: debugInfo,
        },
        { status: 500 }
      );
    }

    if (!fromEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "FROM_EMAIL is not set in environment variables",
          debug: debugInfo,
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const testLicenseKey = license_key || "TEST-LICENSE-KEY-12345";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "🧪 Email Test - Auto Captions Pro License System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
            .license-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .license-key { font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .success-badge { background: #d4edda; color: #155724; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .debug-box { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Email Test Successful!</h1>
              <p>Your email system is working correctly</p>
            </div>
            <div class="content">
              <div class="success-badge">✅ Email Delivery: Working</div>

              <h2>Sample License Key:</h2>
              <div class="license-box">
                <p style="margin: 0 0 10px; color: #666;">Your license key would look like this:</p>
                <div class="license-key">${testLicenseKey}</div>
              </div>

              <h3>📋 Email Configuration:</h3>
              <ul>
                <li><strong>From:</strong> ${fromEmail}</li>
                <li><strong>To:</strong> ${email}</li>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</li>
                <li><strong>Status:</strong> ✅ Delivered</li>
              </ul>

              <div class="debug-box">
                <strong>Debug Info:</strong><br>
                Resend API: Configured ✅<br>
                From Domain: ${fromEmail.split("@")[1] || "N/A"} ✅<br>
                Environment: ${process.env.VERCEL ? "Vercel Production" : "Local Development"}
              </div>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                This is a test email from your Auto Captions Pro license system.
                If you received this, your email configuration is working correctly!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          debug: debugInfo,
        },
        { status: 400 }
      );
    }

    console.log("✅ Test email sent:", data?.id);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      email_id: data?.id,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("❌ Email test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Check email configuration status
export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  return NextResponse.json({
    configured: !!(resendApiKey && fromEmail),
    resend_api_key_set: !!resendApiKey,
    from_email: fromEmail || "NOT SET",
    environment: process.env.VERCEL ? "Vercel" : "Local",
    timestamp: new Date().toISOString(),
  });
}
