import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession, saveSession, CheckoutSession } from "@/lib/checkoutSessionStore";

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
  const { id } = await context.params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
  }

  if (session.status === "completed") {
    return noStoreJson(
      { error: "Session already completed", session },
      409
    )
  }

  if (session.status === "complete_in_progress") {
    return noStoreJson(
      { message: "Completion already in progress", session },
      202
    )
  }

  if (session.status !== "ready_for_complete") {
    return noStoreJson(
      { error: `Cannot complete session with status: ${session.status}` },
      409
    )
  );
}

  if (!session.customer?.email || !session.shipping?.address) {
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
    return NextResponse.json(
      { error: "Only mada is supported in this demo" },
      { status: 400 }
    );
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

  return NextResponse.json(
    {
      session: updatedSession,
      poll_url: `/api/checkout-sessions/${updatedSession.id}`,
      message: "Checkout completion in progress",
    },
    { status: 202, headers: { "Cache-Control": "no-store" } }
  );
}
