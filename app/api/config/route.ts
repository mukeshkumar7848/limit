import { NextResponse } from "next/server";

export async function GET() {
  const FREE_WEEKLY_MAX = process.env.FREE_WEEKLY_MAX || "20";

  return NextResponse.json(
    {
      FREE_WEEKLY_MAX: parseInt(FREE_WEEKLY_MAX, 10),
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
