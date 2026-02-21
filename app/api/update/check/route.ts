import { NextRequest, NextResponse } from "next/server";

// Update this object whenever you release a new version
const VERSION_INFO = {
  current_version: "1.0.0",
  minimum_required_version: "1.0.0",
  release_date: "2026-02-22",
  release_notes: "Initial release with license system",
  download_url: "https://limit-henna.vercel.app/download",
  changelog_url: "https://limit-henna.vercel.app/changelog",
  is_critical_update: false,
  features: [
    "License key activation",
    "Device binding",
    "Auto Captions for After Effects",
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientVersion = searchParams.get("version") || "0.0.0";
  const platform = searchParams.get("platform") || "unknown";
  const license_key = searchParams.get("license_key") || null;

  // Parse versions for comparison
  const parseVersion = (v: string) => v.split(".").map(Number);
  const compareVersions = (a: string, b: string) => {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
  };

  const isUpdateAvailable =
    compareVersions(VERSION_INFO.current_version, clientVersion) > 0;
  const isMinimumVersionMet =
    compareVersions(clientVersion, VERSION_INFO.minimum_required_version) >= 0;

  const response = {
    // Core update info
    update_available: isUpdateAvailable,
    force_update: !isMinimumVersionMet || VERSION_INFO.is_critical_update,

    // Version details
    current_version: VERSION_INFO.current_version,
    client_version: clientVersion,
    minimum_required_version: VERSION_INFO.minimum_required_version,

    // Update content
    release_date: VERSION_INFO.release_date,
    release_notes: VERSION_INFO.release_notes,
    download_url: isUpdateAvailable ? VERSION_INFO.download_url : null,
    changelog_url: VERSION_INFO.changelog_url,

    // Status messages
    message: isUpdateAvailable
      ? isMinimumVersionMet
        ? `Update available: v${VERSION_INFO.current_version}`
        : `Critical update required: v${VERSION_INFO.current_version}`
      : "You are on the latest version",

    // Request context
    platform: platform,
    license_key: license_key ? license_key.substring(0, 8) + "..." : null,
    checked_at: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    headers: {
      // Cache for 1 hour
      "Cache-Control": "public, max-age=3600",
    },
  });
}

// POST: Admin endpoint to get full version details
export async function POST(request: NextRequest) {
  try {
    const { admin_key } = await request.json();

    // Basic admin check (set ADMIN_KEY env variable)
    if (admin_key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      ...VERSION_INFO,
      env: {
        vercel: !!process.env.VERCEL,
        supabase_configured: !!process.env.SUPABASE_URL,
        resend_configured: !!process.env.RESEND_API_KEY,
        razorpay_configured: !!process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
