import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Activate a license with a device ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key, device_id, email } = body;

    if (!license_key || !device_id) {
      return NextResponse.json(
        { error: "License key and device ID are required" },
        { status: 400 }
      );
    }

    // Find the license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { error: "Invalid license key" },
        { status: 404 }
      );
    }

    // Check if license is already associated with this device
    if (license.device_id === device_id && license.activated_at) {
      return NextResponse.json({
        success: true,
        message: "License already activated on this device",
        license: {
          status: license.status,
          expires_at: license.expires_at,
          activations: license.activations,
          max_activations: license.max_activations,
        },
      });
    }

    // Check if license is expired
    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "License has expired" },
        { status: 403 }
      );
    }

    // Check if license is inactive
    if (license.status !== "active") {
      return NextResponse.json(
        { error: `License is ${license.status}` },
        { status: 403 }
      );
    }

    // Check if max activations reached
    if (license.activations >= license.max_activations) {
      return NextResponse.json(
        { error: "Maximum activations reached for this license" },
        { status: 403 }
      );
    }

    // Check email if provided
    if (email && license.email && license.email !== email) {
      return NextResponse.json(
        { error: "Email does not match license owner" },
        { status: 403 }
      );
    }

    // Activate the license
    const { data: updatedLicense, error: updateError } = await supabase
      .from("licenses")
      .update({
        device_id: device_id,
        activations: license.activations + 1,
        activated_at: new Date().toISOString(),
      })
      .eq("id", license.id)
      .select()
      .single();

    if (updateError) {
      console.error("License activation error:", updateError);
      return NextResponse.json(
        { error: "Failed to activate license" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "License activated successfully",
      license: {
        license_key: updatedLicense.license_key,
        status: updatedLicense.status,
        activations: updatedLicense.activations,
        max_activations: updatedLicense.max_activations,
        activated_at: updatedLicense.activated_at,
        expires_at: updatedLicense.expires_at,
      },
    });
  } catch (error) {
    console.error("License activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Verify a license
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const license_key = searchParams.get("license_key");
    const device_id = searchParams.get("device_id");

    if (!license_key) {
      return NextResponse.json(
        { error: "License key is required" },
        { status: 400 }
      );
    }

    // Find the license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { error: "Invalid license key", valid: false },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date(license.expires_at) < new Date();
    
    // Check if device matches (if device_id provided)
    const deviceMatches = device_id ? license.device_id === device_id : true;

    const isValid = 
      license.status === "active" && 
      !isExpired && 
      deviceMatches;

    return NextResponse.json({
      valid: isValid,
      license: {
        license_key: license.license_key,
        status: license.status,
        activations: license.activations,
        max_activations: license.max_activations,
        activated_at: license.activated_at,
        expires_at: license.expires_at,
        is_expired: isExpired,
        device_matches: deviceMatches,
      },
    });
  } catch (error) {
    console.error("License verification error:", error);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    );
  }
}

// Deactivate a license
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key, device_id } = body;

    if (!license_key || !device_id) {
      return NextResponse.json(
        { error: "License key and device ID are required" },
        { status: 400 }
      );
    }

    // Find the license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key)
      .eq("device_id", device_id)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { error: "License not found or device mismatch" },
        { status: 404 }
      );
    }

    // Deactivate the license
    const { error: updateError } = await supabase
      .from("licenses")
      .update({
        device_id: null,
        activations: Math.max(0, license.activations - 1),
      })
      .eq("id", license.id);

    if (updateError) {
      console.error("License deactivation error:", updateError);
      return NextResponse.json(
        { error: "Failed to deactivate license" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "License deactivated successfully",
    });
  } catch (error) {
    console.error("License deactivation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
