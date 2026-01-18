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
  created_at: string;
  expires_at: string;
  updated_at: string;
};

// NOTE: In-memory only. In serverless deployments, sessions may be lost between requests.
// For demo reliability on Vercel, migrate this to persistent storage (KV/Redis/Postgres).
const sessions = new Map<string, CheckoutSession>();

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
