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
    const { license_key, device_id } = await request.json();

    console.log('🔗 Binding license:', license_key, 'to device:', device_id);

    if (!license_key || !device_id) {
      return NextResponse.json(
        { success: false, message: "License key and device ID required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get current license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { success: false, message: "License not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if status is active
    if (license.status !== "active") {
      return NextResponse.json(
        { success: false, message: `License is ${license.status}` },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update device binding
    const updates: any = {
      device_id: device_id,
      activated_at: new Date().toISOString(),
    };

    // Increment activations only if it's a NEW device binding
    if (!license.device_id || license.device_id !== device_id) {
      updates.activations = (license.activations || 0) + 1;
      console.log('📈 Incrementing activations to:', updates.activations);
    }

    const { error: updateError } = await supabase
      .from("licenses")
      .update(updates)
      .eq("license_key", license_key);

    if (updateError) {
      console.error("❌ Bind error:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to bind license" },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ License bound successfully');

    return NextResponse.json(
      { 
        success: true, 
        message: "License bound to device successfully",
        activations: updates.activations || license.activations 
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Bind error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
