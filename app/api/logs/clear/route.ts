import { clearMerchantSession } from "@/lib/demoLogs/merchantContext";

export const runtime = "nodejs";

export async function POST() {
  try {
    clearMerchantSession();
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 500 });
  }
}
