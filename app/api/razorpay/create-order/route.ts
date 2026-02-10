import { NextRequest, NextResponse } from "next/server";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// This creates a Razorpay order before payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = "INR", receipt, notes, email } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Missing Razorpay credentials");
      return NextResponse.json(
        { error: "Razorpay not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate license key on server (so webhook can access it)
    const generateLicenseKey = () => {
      const segments = [];
      for (let i = 0; i < 5; i++) {
        const segment = Math.random().toString(36).substring(2, 7).toUpperCase();
        segments.push(segment);
      }
      return `ACPRO-${segments.join('-')}`;
    };
    
    const licenseKey = generateLicenseKey();
    console.log('🔑 Generated license key:', licenseKey, 'for email:', email);

    // Store license key and email in order notes
    const orderNotes = {
      ...notes,
      license_key: licenseKey,
      customer_email: email,
      generated_at: new Date().toISOString()
    };

    // Create order on Razorpay's servers
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: orderNotes,
      }),
    });

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.text();
      console.error("Razorpay API error:", error);
      return NextResponse.json(
        { error: "Failed to create Razorpay order", details: error },
        { status: razorpayResponse.status, headers: corsHeaders }
      );
    }

    const orderData = await razorpayResponse.json();

    return NextResponse.json(
      {
        success: true,
        order_id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        key_id: keyId,
        license_key: licenseKey, // Return license key to frontend
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create order", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to create an order." },
    { status: 405, headers: corsHeaders }
  );
}
