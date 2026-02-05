import { NextResponse } from "next/server";

export async function GET() {
  const advertisementImageUrl = process.env.ADVERTISEMENT_IMAGE_URL || "";
  const redirectUrl = process.env.REDIRECT_URL || "";
  const viewPop = process.env.VIEW_POP === "true";

  return NextResponse.json(
    {
      advertisementImageUrl,
      redirectUrl,
      viewPop,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
  
}
  