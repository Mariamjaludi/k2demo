import { NextRequest, NextResponse } from "next/server";
import { buildUcpProfile } from "@/lib/ucpProfile";

export async function GET(request: NextRequest) {
  const profile = buildUcpProfile(request);
  return NextResponse.json(profile);
}