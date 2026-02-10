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

    if (!license_key || !device_id) {
      return NextResponse.json(
        { success: false, message: "License key and device ID required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: license, error } = await supabase
      .from("licenses")
      .select("device_id, status")
      .eq("license_key", license_key)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { bound: false, same: false },
        { status: 200, headers: corsHeaders }
      );
    }

    // Check if license is bound to any device
    const bound = !!license.device_id;
    // Check if it's bound to THIS device
    const same = license.device_id === device_id;

    return NextResponse.json(
      { bound, same },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Binding check error:", error);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
