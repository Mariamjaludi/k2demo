import { NextRequest, NextResponse } from "next/server";
import { getSession, saveSession, ShippingAddress, CheckoutSession } from "@/lib/checkoutSessionStore";
import { merchantEmitLog, createCorrelationId } from "@/lib/demoLogs/merchantContext";
import type { Json } from "@/lib/demoLogs/types";

// Check if completion is ready and flip status
function checkForSessionCompletion(session: CheckoutSession): CheckoutSession {
  if (session.status !== "complete_in_progress") return session;

  const completion = session.completion;
  if (!completion?.ready_at) return session;

  const readyAtMs = Date.parse(completion.ready_at);
  if (!Number.isFinite(readyAtMs)) return session;

  if (Date.now() < readyAtMs) return session;

  return {
    ...session,
    status: "completed",
    completion: { started_at: completion.started_at, ready_at: null },
    updated_at: new Date().toISOString(),
  };
}


export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId = createCorrelationId();
  const { id } = await context.params;

  merchantEmitLog({
    category: "agent",
    event: "agent.checkout_sessions.get.request",
    message: `GET /api/checkout-sessions/${id.slice(0, 8)}…`,
    correlationId,
    payload: { method: "GET", session_id: id },
  });

  const session = getSession(id);

  if (!session) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.get.error",
      message: `404 Not Found — session ${id.slice(0, 8)}…`,
      level: "error",
      correlationId,
      payload: { status: 404, error: "Checkout session not found" },
    });
    return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
  }

  // Check if ready to flip to completed
  const updatedSession = checkForSessionCompletion(session);
  if (updatedSession.status !== session.status) saveSession(updatedSession);

  const getBody = { session: updatedSession };

  merchantEmitLog({
    category: "merchant",
    event: "merchant.checkout_sessions.get.response",
    message: `200 OK — session ${id.slice(0, 8)}… status: ${updatedSession.status}`,
    correlationId,
    payload: getBody as unknown as Json,
  });

  return NextResponse.json(getBody, {
    headers: { "Cache-Control": "no-store" }
  });
}

type UpdateCheckoutRequest = {
  customer?: {
    email?: string;
  };
  shipping?: {
    address?: ShippingAddress;
  };
};

function validateEmail(email: string): { valid: true; email: string } | { valid: false; error: string } {
  const trimmed = email.trim();
  if (!trimmed.includes("@") || !trimmed.includes(".")) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true, email: trimmed };
}

function validateAddress(addr: ShippingAddress): { valid: true; normalized: ShippingAddress } | { valid: false; error: string } {
  const country = addr.country;
  const city = addr.city?.trim();
  const address1 = addr.address_line1?.trim();

  if (!country || !city || !address1) {
    return { valid: false, error: "Shipping address requires country, city, and address_line1" };
  }
  if (country !== "SA") {
    return { valid: false, error: "Only shipping to Saudi Arabia (SA) is supported" };
  }

  return {
    valid: true,
    normalized: {
      ...addr,
      city,
      address_line1: address1,
      district: addr.district?.trim() || undefined,
      address_line2: addr.address_line2?.trim() || undefined,
      postcode: addr.postcode?.trim() || undefined,
      phone: addr.phone?.trim() || undefined,
    }
  };
}

function computeShippingAndDelivery(city: string): { fee: number; promise: string } {
  const normalized = city.trim().toLowerCase().split(",")[0];
  const isRiyadh = normalized === "riyadh";
  return {
    fee: isRiyadh ? 10 : 20,
    promise: isRiyadh ? "Deliver tomorrow in Riyadh" : "Deliver in 2-3 days",
  };
}

function computeTotals(
  subtotal: number,
  shippingFee: number,
  vatRate: number
): { subtotal: number; vat: number; vat_rate: number; total: number } {
  const vatBase = subtotal + shippingFee;
  const vat = Math.round(vatBase * vatRate * 100) / 100;
  const total = Math.round((vatBase + vat) * 100) / 100;
  return { subtotal, vat, vat_rate: vatRate, total };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId = createCorrelationId();
  const { id } = await context.params;
  const session = getSession(id);

  if (!session) {
    merchantEmitLog({
      category: "agent",
      event: "agent.checkout_sessions.update.request",
      message: `PATCH /api/checkout-sessions/${id.slice(0, 8)}…`,
      correlationId,
      payload: { method: "PATCH", session_id: id },
    });
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.update.error",
      message: `404 Not Found — session ${id.slice(0, 8)}…`,
      level: "error",
      correlationId,
      payload: { status: 404, error: "Checkout session not found" },
    });
    return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
  }

  if (session.status === "completed" ||
    session.status === "canceled" ||
    session.status === "complete_in_progress" ||
    session.status === "requires_escalation") {
    merchantEmitLog({
      category: "agent",
      event: "agent.checkout_sessions.update.request",
      message: `PATCH /api/checkout-sessions/${id.slice(0, 8)}…`,
      correlationId,
      payload: { method: "PATCH", session_id: id },
    });
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.update.error",
      message: `409 Conflict — cannot update session with status: ${session.status}`,
      level: "error",
      correlationId,
      payload: { status: 409, error: `Cannot update session with status: ${session.status}` },
    });
    return NextResponse.json(
      { error: `Cannot update session with status: ${session.status}` },
      { status: 409 }
    );
  }

  let body: UpdateCheckoutRequest;
  try {
    body = await request.json();
  } catch {
    merchantEmitLog({
      category: "agent",
      event: "agent.checkout_sessions.update.request",
      message: `PATCH /api/checkout-sessions/${id.slice(0, 8)}…`,
      correlationId,
      payload: { method: "PATCH", session_id: id, body: "(invalid JSON)" },
    });
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.update.error",
      message: "400 Bad Request — Invalid JSON body",
      level: "error",
      correlationId,
      payload: { status: 400, error: "Invalid JSON body" },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  merchantEmitLog({
    category: "agent",
    event: "agent.checkout_sessions.update.request",
    message: `PATCH /api/checkout-sessions/${id.slice(0, 8)}…`,
    correlationId,
    payload: {
      method: "PATCH",
      session_id: id,
      updates: {
        ...(body.customer?.email ? { email: body.customer.email } : {}),
        ...(body.shipping?.address ? { address_city: body.shipping.address.city } : {}),
      },
    },
  });

  // Validate and extract email
  let newEmail = session.customer.email;
  if (body.customer?.email !== undefined) {
    const result = validateEmail(body.customer.email);
    if (!result.valid) {
      merchantEmitLog({
        category: "merchant",
        event: "merchant.checkout_sessions.update.error",
        message: `400 Bad Request — ${result.error}`,
        level: "error",
        correlationId,
        payload: { status: 400, error: result.error },
      });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    newEmail = result.email;
  }

  // Validate and extract shipping address
  let newAddress = session.shipping.address;
  let newShippingFee = session.shipping.fee;
  let newDeliveryPromise = session.delivery.promise;
  let newTotals = session.totals;

  if (body.shipping?.address !== undefined) {
    const result = validateAddress(body.shipping.address);
    if (!result.valid) {
      merchantEmitLog({
        category: "merchant",
        event: "merchant.checkout_sessions.update.error",
        message: `400 Bad Request — ${result.error}`,
        level: "error",
        correlationId,
        payload: { status: 400, error: result.error },
      });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    newAddress = result.normalized;

    const shipping = computeShippingAndDelivery(newAddress.city);
    newShippingFee = shipping.fee;
    newDeliveryPromise = shipping.promise;

    newTotals = computeTotals(session.totals.subtotal, newShippingFee, session.totals.vat_rate);
  }

  // Determine new status
  const hasEmail = newEmail !== null;
  const hasAddress = newAddress !== null;
  const newStatus =
    hasEmail && hasAddress && session.status === "incomplete"
      ? "ready_for_complete"
      : session.status;

  // Create new session object
  const updatedSession: CheckoutSession = {
    ...session,
    status: newStatus,
    customer: { email: newEmail },
    shipping: { address: newAddress, fee: newShippingFee },
    delivery: {
      ...session.delivery,
      promise: newDeliveryPromise,
      eta_minutes: null
    },
    totals: newTotals,
    updated_at: new Date().toISOString(),
  };

  saveSession(updatedSession);

  // Build missing fields list
  const missingFields: string[] = [];
  if (!hasEmail) missingFields.push("customer.email");
  if (!hasAddress) missingFields.push("shipping.address");

  const patchBody = {
    session: updatedSession,
    ...(missingFields.length > 0 && { missing_fields: missingFields }),
  };

  merchantEmitLog({
    category: "merchant",
    event: "merchant.checkout_sessions.update.response",
    message: `200 OK — session ${id.slice(0, 8)}… status: ${updatedSession.status}`,
    correlationId,
    payload: patchBody as unknown as Json,
  });

  return NextResponse.json(patchBody);
}
