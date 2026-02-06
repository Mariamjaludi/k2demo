import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession, saveSession, CheckoutSession } from "@/lib/checkoutSessionStore";
import { merchantEmitLog, createCorrelationId } from "@/lib/demoLogs/merchantContext";
import type { Json } from "@/lib/demoLogs/types";

const COMPLETION_DELAY_SECONDS = 5;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId = createCorrelationId();
  const { id } = await context.params;
  const session = getSession(id);

  merchantEmitLog({
    category: "agent",
    event: "agent.checkout_sessions.complete.request",
    message: `POST /api/checkout-sessions/${id.slice(0, 8)}…/complete`,
    correlationId,
    payload: { method: "POST", session_id: id },
  });

  if (!session) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.error",
      message: `404 Not Found — session ${id.slice(0, 8)}…`,
      level: "error",
      correlationId,
      payload: { status: 404, error: "Checkout session not found" },
    });
    return noStoreJson(
      { error: "Checkout session not found" },
      404
    )
  }

  if (session.status === "completed") {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.error",
      message: `409 Conflict — session already completed`,
      level: "error",
      correlationId,
      payload: { status: 409, error: "Session already completed" },
    });
    return noStoreJson(
      { error: "Session already completed", session },
      409
    )
  }

  if (session.status === "complete_in_progress") {
    const inProgressBody = { message: "Completion already in progress", session };
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.response",
      message: `202 Accepted — completion already in progress`,
      correlationId,
      payload: inProgressBody as unknown as Json,
    });
    return noStoreJson(inProgressBody, 202);
  }
  if (session.status !== "ready_for_complete") {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.error",
      message: `409 Conflict — cannot complete session with status: ${session.status}`,
      level: "error",
      correlationId,
      payload: { status: 409, error: `Cannot complete session with status: ${session.status}` },
    });
    return noStoreJson(
      { error: `Cannot complete session with status: ${session.status}` },
      409
    );
  }

  if (!session.customer?.email || !session.shipping?.address) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.error",
      message: `400 Bad Request — Missing customer email or shipping address`,
      level: "error",
      correlationId,
      payload: { status: 400, error: "Missing customer email or shipping address" },
    });
    return NextResponse.json(
      { error: "Missing customer email or shipping address" },
      { status: 400 }
    );
  }

  // Payment method (demo: mada)
  let paymentMethod = "mada";
  try {
    const body = await request.json();
    if (typeof body?.payment_method === "string") paymentMethod = body.payment_method;
  } catch {
    // ignore
  }

  if (paymentMethod !== "mada") {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.complete.error",
      message: `400 Bad Request — unsupported payment method: ${paymentMethod}`,
      level: "error",
      correlationId,
      payload: { status: 400, error: "Only mada is supported in this demo", payment_method: paymentMethod },
    });
    return noStoreJson(
      { error: "Only mada is supported in this demo" },
      400
    )
  }

  const now = new Date();
  const readyAt = new Date(now.getTime() + COMPLETION_DELAY_SECONDS * 1000);
  const orderId = `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;

  const updatedSession: CheckoutSession = {
    ...session,
    status: "complete_in_progress",
    payment: { method: paymentMethod },
    completion: {
      started_at: now.toISOString(),
      ready_at: readyAt.toISOString(),
    },
    order: {
      id: orderId,
      created_at: now.toISOString(),
    },
    updated_at: now.toISOString(),
  };

  saveSession(updatedSession);

  const completeBody = {
    session: updatedSession,
    poll_url: `/api/checkout-sessions/${updatedSession.id}`,
    message: "Checkout completion in progress",
  };

  merchantEmitLog({
    category: "merchant",
    event: "merchant.checkout_sessions.complete.response",
    message: `202 Accepted — session ${id.slice(0, 8)}… completion started, order ${orderId}`,
    correlationId,
    payload: completeBody as unknown as Json,
  });

  return noStoreJson(completeBody, 202);
}
