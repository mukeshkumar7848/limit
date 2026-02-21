import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { license_key, device_id, increment = false, product_id } = body;

    console.log('🔍 License verify request:', { license_key, device_id, increment, product_id });

    if (!license_key) {
      return NextResponse.json(
        { success: false, message: "License key is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get license from database
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (error || !license) {
      console.log('❌ License not found:', license_key);
      return NextResponse.json(
        { 
          success: false, 
          message: "License key not found",
          uses: 0
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if license is expired (skip if expires_at is null - lifetime license)
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          success: false, 
          message: "License has expired",
          purchase: {
            refunded: false,
            chargebacked: false,
            expired: true
          }
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if license is revoked
    if (license.status === "revoked") {
      return NextResponse.json(
        { 
          success: false, 
          message: "License has been revoked",
          purchase: {
            refunded: true,
            chargebacked: false
          }
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // If device_id is provided, handle device binding
    if (device_id) {
      console.log('📱 Device binding requested:', device_id);
      
      // Check if already activated on a different device
      if (license.device_id && license.device_id !== device_id) {
        console.log('⚠️ License bound to different device:', license.device_id);
        
        // Allow taking over if increment is true (user confirmed)
        if (!increment) {
          return NextResponse.json(
            { 
              success: false, 
              message: "License already activated on another device",
              uses: license.activations || 0,
              purchase: {
                refunded: false,
                chargebacked: false,
                product_name: "Auto Captions Pro",
                email: license.email || "",
                sale_timestamp: license.created_at
              }
            },
            { status: 200, headers: corsHeaders }
          );
        }
      }

      // Activate or re-bind license
      const updates: any = {};
      
      if (license.device_id !== device_id || increment) {
        updates.device_id = device_id;
        updates.activated_at = new Date().toISOString();
        if (increment) {
          updates.activations = (license.activations || 0) + 1;
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("licenses")
          .update(updates)
          .eq("license_key", license_key);

        if (updateError) {
          console.error("❌ Update error:", updateError);
        } else {
          console.log('✅ License activated/re-bound to device');
        }
      }
    }

    // Return Gumroad-compatible format
    return NextResponse.json(
      {
        success: true,
        uses: license.activations || 0,
        purchase: {
          refunded: false,
          chargebacked: false,
          product_name: "Auto Captions Pro",
          product_id: product_id || "auto-captions-pro",
          email: license.email || "",
          sale_timestamp: license.created_at,
          license_key: license.license_key,
          subscription_id: null,
          variants: "Pro",  // ← Mark as Pro variant
          price: 9900,      // ← Add price (₹99 in paisa, or use actual price)
          test: license.razorpay_payment_id?.startsWith('pay_test') || false,
          custom_fields: {}
        }
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ License verification error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const license_key = searchParams.get("license_key");
    const device_id   = searchParams.get("device_id") || undefined;

    if (!license_key) {
      return NextResponse.json(
        { success: false, message: "license_key query param is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { valid: false, success: false, message: "License key not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const expired = license.expires_at && new Date(license.expires_at) < new Date();
    const revoked = license.status === "revoked";

    return NextResponse.json(
      {
        valid: !expired && !revoked,
        success: !expired && !revoked,
        license: {
          license_key:  license.license_key,
          email:        license.email,
          status:       license.status,
          activations:  license.activations,
          max_activations: license.max_activations,
          device_id:    license.device_id,
          expires_at:   license.expires_at,
          created_at:   license.created_at,
        },
        // Gumroad-compatible
        uses: license.activations || 0,
        purchase: {
          refunded:     revoked,
          chargebacked: false,
          product_name: "Auto Captions Pro",
          email:        license.email || "",
          sale_timestamp: license.created_at,
          license_key:  license.license_key,
          device_id:    device_id || license.device_id,
        }
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
