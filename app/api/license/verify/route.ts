import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        { error: "Server configuration error: Missing database credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { license_key, device_id } = body;

    if (!license_key) {
      return NextResponse.json(
        { error: "License key is required" },
        { status: 400 }
      );
    }

    // Get license from database
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (error || !license) {
      return NextResponse.json(
        { error: "Invalid license key" },
        { status: 404 }
      );
    }

    // Check if license is expired
    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "License has expired", expires_at: license.expires_at },
        { status: 403 }
      );
    }

    // Check if license is active
    if (license.status !== "active") {
      return NextResponse.json(
        { error: `License is ${license.status}` },
        { status: 403 }
      );
    }

    // If device_id is provided, activate the license
    if (device_id) {
      // Check if already activated on a different device
      if (license.device_id && license.device_id !== device_id) {
        return NextResponse.json(
          { 
            error: "License already activated on another device",
            device_id: license.device_id 
          },
          { status: 403 }
        );
      }

      // Check max activations
      if (license.activations >= license.max_activations && !license.device_id) {
        return NextResponse.json(
          { error: "Maximum activation limit reached" },
          { status: 403 }
        );
      }

      // Activate license
      const updates: any = {
        activations: license.activations + 1,
      };

      if (!license.device_id) {
        updates.device_id = device_id;
        updates.activated_at = new Date().toISOString();
      }

      const { data: updatedLicense, error: updateError } = await supabase
        .from("licenses")
        .update(updates)
        .eq("license_key", license_key)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to activate license" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "License activated successfully",
          license: {
            license_key: updatedLicense.license_key,
            status: updatedLicense.status,
            expires_at: updatedLicense.expires_at,
            activated_at: updatedLicense.activated_at,
            activations: updatedLicense.activations,
            max_activations: updatedLicense.max_activations,
          },
        },
        { status: 200 }
      );
    }

    // Just verify without activation
    return NextResponse.json(
      {
        valid: true,
        license: {
          license_key: license.license_key,
          status: license.status,
          expires_at: license.expires_at,
          activations: license.activations,
          max_activations: license.max_activations,
          is_activated: !!license.device_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("License verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to verify/activate license." },
    { status: 405 }
  );
}
