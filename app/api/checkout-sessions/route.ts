import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import catalog from "@/lib/data/jarir-catalog.json";
import { CheckoutSession, LineItem, saveSession } from "@/lib/checkoutSessionStore";
import { merchantEmitLog, createCorrelationId } from "@/lib/demoLogs/merchantContext";

type RequestItem = { product_id: string; quantity: number };
type CreateCheckoutRequest = { items: RequestItem[] };

const VAT_RATE = 0.15;
const MAX_ITEMS = 50;

// module scope: runs once per server instance
const catalogById = new Map(catalog.map(p => [p.id, p]));

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  let body: CreateCheckoutRequest;

  try {
    body = await request.json();
  } catch {
    merchantEmitLog({
      category: "agent",
      event: "agent.checkout_sessions.create.request",
      message: "POST /api/checkout-sessions",
      correlationId,
      payload: { method: "POST", body: "(invalid JSON)" },
    });
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.create.error",
      message: "400 Bad Request — Invalid JSON body",
      level: "error",
      correlationId,
      payload: { status: 400, error: "Invalid JSON body" },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  merchantEmitLog({
    category: "agent",
    event: "agent.checkout_sessions.create.request",
    message: `POST /api/checkout-sessions — ${body.items?.length ?? 0} item(s)`,
    correlationId,
    payload: {
      method: "POST",
      items: body.items?.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) ?? [],
    },
  });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.create.error",
      message: "400 Bad Request — items array is required",
      level: "error",
      correlationId,
      payload: { status: 400, error: "items array is required and must not be empty" },
    });
    return NextResponse.json(
      { error: "items array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (body.items.length > MAX_ITEMS) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.create.error",
      message: `400 Bad Request — items must not exceed ${MAX_ITEMS}`,
      level: "error",
      correlationId,
      payload: { status: 400, error: `items must not exceed ${MAX_ITEMS}` },
    });
    return NextResponse.json(
      { error: `items must not exceed ${MAX_ITEMS}` },
      { status: 400 }
    );
  }

  // Aggregate duplicates
  const qtyByProduct = new Map<string, number>();
  const errors: string[] = [];

  for (const item of body.items) {
    if (!item?.product_id || !Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push(`Invalid item: ${JSON.stringify(item)}`);
      continue;
    }
    qtyByProduct.set(item.product_id, (qtyByProduct.get(item.product_id) ?? 0) + item.quantity);
  }

  const lineItems: LineItem[] = [];

  for (const [productId, quantity] of qtyByProduct.entries()) {
    const product = catalogById.get(productId);

    if (!product) {
      errors.push(`Product not found: ${productId}`);
      continue;
    }
    if (!product.availability?.in_stock) {
      errors.push(`Out of stock: ${productId}`);
      continue;
    }

    const total = Math.round(product.price * quantity * 100) / 100;

    lineItems.push({
      product_id: product.id,
      title: product.title,
      quantity,
      unit_price: product.price,
      total,
    });
  }

  if (lineItems.length === 0) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.checkout_sessions.create.error",
      message: "400 Bad Request — No valid items",
      level: "error",
      correlationId,
      payload: { status: 400, error: "No valid items", details: errors },
    });
    return NextResponse.json(
      { error: "No valid items", details: errors },
      { status: 400 }
    );
  }

  const subtotal = Math.round(lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const session: CheckoutSession = {
    id: randomUUID(),
    status: "incomplete",
    currency: "SAR",
    line_items: lineItems,
    customer: { email: null },
    shipping: { address: null, fee: 0 },
    totals: { subtotal, vat, vat_rate: VAT_RATE, total },
    delivery: { promise: null, eta_minutes: null },
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  };

  saveSession(session);

  const responseBody = errors.length
  ? { session, warnings: errors, missing_fields: ["customer.email", "shipping.address"] }
  : { session, missing_fields: ["customer.email", "shipping.address"] };

  merchantEmitLog({
    category: "merchant",
    event: "merchant.checkout_sessions.create.response",
    message: `201 Created — session ${session.id.slice(0, 8)}… status: ${session.status}`,
    correlationId,
    payload: {
      status: 201,
      session_id: session.id,
      session_status: session.status,
      line_items: lineItems.length,
      subtotal,
      total,
      currency: "SAR",
    },
  });

  return NextResponse.json(responseBody, { status: 201 });
}
