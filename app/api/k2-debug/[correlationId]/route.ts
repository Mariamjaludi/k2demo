import { NextResponse } from "next/server";
import { getDebugLog } from "@/lib/k2/debugStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ correlationId: string }> },
) {
  const { correlationId } = await params;
  const log = getDebugLog(correlationId);

  if (!log) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(log);
}
