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
    const { license_key, action } = body;

    if (!license_key) {
      return NextResponse.json(
        { error: "License key is required" },
        { status: 400 }
      );
    }

    if (!action || !["deactivate", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required (deactivate or revoke)" },
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

    let updateData: any = {};

    if (action === "deactivate") {
      // Deactivate - remove device binding but keep license valid
      updateData = {
        device_id: null,
        activated_at: null,
      };
    } else if (action === "revoke") {
      // Revoke - completely invalidate the license
      updateData = {
        status: "revoked",
        device_id: null,
      };
    }

    const { data: updatedLicense, error: updateError } = await supabase
      .from("licenses")
      .update(updateData)
      .eq("license_key", license_key)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: `Failed to ${action} license` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `License ${action}d successfully`,
        license: {
          license_key: updatedLicense.license_key,
          status: updatedLicense.status,
          device_id: updatedLicense.device_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("License management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to manage license." },
    { status: 405 }
  );
}
