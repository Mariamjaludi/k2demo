import { NextRequest, NextResponse } from "next/server";
import { getMerchantMode, setMerchantMode } from "@/lib/config/demo";

export async function GET() {
  return NextResponse.json({ mode: getMerchantMode() });
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const mode = body?.mode;

  if (mode !== "baseline" && mode !== "k2") {
    return NextResponse.json(
      { error: 'Invalid mode. Must be "baseline" or "k2".' },
      { status: 400 },
    );
  }

  setMerchantMode(mode);
  return NextResponse.json({ mode: getMerchantMode() });
}
