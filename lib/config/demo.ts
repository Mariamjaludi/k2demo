export type MerchantMode = "baseline" | "k2";

// Use globalThis so the value survives Next.js dev-mode module re-evaluation
const g = globalThis as unknown as { __k2DemoMode?: MerchantMode };

export function getMerchantMode(): MerchantMode {
  if (g.__k2DemoMode) return g.__k2DemoMode;
  const raw = process.env.MERCHANT_MODE?.toLowerCase();
  if (raw === "k2") return "k2";
  return "baseline";
}

export function setMerchantMode(mode: MerchantMode): void {
  g.__k2DemoMode = mode;
}

export function isK2Enabled(request?: { headers: { get(name: string): string | null } }): boolean {
  // 1. x-k2-mode header override
  if (request) {
    const headerVal = request.headers.get("x-k2-mode");
    if (headerVal !== null) {
      const lower = headerVal.toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
    }
  }

  // 2. Runtime toggle (globalThis)
  if (g.__k2DemoMode === "k2") return true;
  if (g.__k2DemoMode === "baseline") return false;

  // 3. K2_MODE env var
  const k2Mode = process.env.K2_MODE?.toLowerCase();
  if (k2Mode === "true" || k2Mode === "1") return true;
  if (k2Mode === "false" || k2Mode === "0") return false;

  // 4. MERCHANT_MODE env var (legacy)
  const merchantMode = process.env.MERCHANT_MODE?.toLowerCase();
  if (merchantMode === "k2") return true;

  // 5. Default: false
  return false;
}
