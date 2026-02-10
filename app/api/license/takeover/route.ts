import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { license_key, product_id } = await request.json();

    console.log('💥 Hard takeover requested for:', license_key);

    if (!license_key) {
      return NextResponse.json(
        { success: false, message: "License key required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get license
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { success: false, message: "License not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Clear device binding (allows re-activation on new device)
    const { error: updateError } = await supabase
      .from("licenses")
      .update({ 
        device_id: null,
        activated_at: null 
      })
      .eq("license_key", license_key);

    if (updateError) {
      console.error("❌ Takeover error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to clear device binding" },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Device binding cleared - ready for new activation');

    // Return Gumroad-compatible format
    return NextResponse.json(
      {
        success: true,
        message: "License unbound - ready for new device",
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
  } catch (error) {
    console.error("Takeover error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
