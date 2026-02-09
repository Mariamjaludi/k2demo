"use client";

/**
 * Client-side helpers that call the merchant checkout API endpoints.
 * These exist purely to trigger server-side merchant logs in the TerminalLogs panel.
 * The UI flow itself doesn't depend on the responses.
 */

export interface CreateCheckoutParams {
  productId: string;
  quantity: number;
  offerId?: string;
  correlationId?: string;
}

export interface CreateCheckoutResult {
  sessionId: string;
}

/** POST /api/checkout-sessions — create a new checkout session */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (params.correlationId) headers["x-k2-correlation-id"] = params.correlationId;
    if (params.offerId) headers["x-k2-offer-id"] = params.offerId;

    const res = await fetch("/api/checkout-sessions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: [{ product_id: params.productId, quantity: params.quantity }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const sessionId = data.session?.id;
    if (!sessionId) return null;
    return { sessionId };
  } catch {
    return null;
  }
}

export interface UpdateCheckoutParams {
  sessionId: string;
  email: string;
  address: {
    country: "SA";
    city: string;
    district?: string;
    address_line1: string;
    address_line2?: string;
    postcode?: string;
  };
}

/** PATCH /api/checkout-sessions/{id} — update with customer email + shipping address */
export async function updateCheckoutSession(
  params: UpdateCheckoutParams
): Promise<boolean> {
  try {
    const res = await fetch(`/api/checkout-sessions/${params.sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { email: params.email },
        shipping: { address: params.address },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** POST /api/checkout-sessions/{id}/complete — complete checkout with mada */
export async function completeCheckoutSession(
  sessionId: string
): Promise<string | null> {
  try {
    const res = await fetch(`/api/checkout-sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_method: "mada" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session?.order?.id ?? null;
  } catch {
    return null;
  }
}

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;

export interface PollResult {
  orderId: string;
  status: "completed";
}

/**
 * GET /api/checkout-sessions/{id} — poll until status flips to "completed".
 * Returns the order ID from the server, or null on timeout/error.
 */
export async function pollForCompletion(
  sessionId: string,
  signal?: AbortSignal
): Promise<PollResult | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) return null;

    try {
      const res = await fetch(`/api/checkout-sessions/${sessionId}`, {
        signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const session = data.session;

      if (session?.status === "completed" && session.order?.id) {
        return { orderId: session.order.id, status: "completed" };
      }
    } catch {
      if (signal?.aborted) return null;
    }

    // Wait before next poll
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, POLL_INTERVAL_MS);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }

  return null;
}
