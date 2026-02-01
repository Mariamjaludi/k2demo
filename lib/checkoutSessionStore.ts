export type LineItem = {
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type ShippingAddress = {
  country: "SA";
  city: string;
  district?: string;
  address_line1: string;
  address_line2?: string;
  postcode?: string;
  phone?: string;
};

export type CheckoutSession = {
  id: string;
  status:
  | "incomplete"
  | "requires_escalation"
  | "ready_for_complete"
  | "complete_in_progress"
  | "completed"
  | "canceled";
  currency: "SAR";
  line_items: LineItem[];
  customer: {
    email: string | null;
  };
  shipping: {
    address: ShippingAddress | null;
    fee: number;
  };
  totals: {
    subtotal: number;
    vat: number;
    vat_rate: number;
    total: number;
  };
  delivery: {
    promise: string | null;
    eta_minutes?: number | null;
  };
  completion?: {
    started_at: string;
    ready_at: string | null;
  };
  order?: {
    id: string | null;
    created_at: string | null;
  };
  payment?: {
    method: string;
  };
  created_at: string;
  expires_at: string;
  updated_at: string;
};

// Persist across hot-reloads in dev via globalThis (same pattern as merchantContext.ts).
// In serverless deployments, sessions may still be lost between cold starts.
const SESSIONS_KEY = Symbol.for("__k2_checkout_sessions__");
const g = globalThis as unknown as Record<symbol, Map<string, CheckoutSession> | undefined>;
if (!g[SESSIONS_KEY]) {
  g[SESSIONS_KEY] = new Map<string, CheckoutSession>();
}
const sessions: Map<string, CheckoutSession> = g[SESSIONS_KEY]!;

export function getSession(id: string): CheckoutSession | undefined {
  const s = sessions.get(id);
  if (!s) return undefined;

  if (Date.now() > Date.parse(s.expires_at)) {
    sessions.delete(id);
    return undefined;
  }
  return s;
}

export function saveSession(session: CheckoutSession): void {
  sessions.set(session.id, session);
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}
