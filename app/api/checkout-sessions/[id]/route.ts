import { NextRequest, NextResponse } from "next/server";
import { getSession, saveSession, ShippingAddress, CheckoutSession } from "@/lib/checkoutSessionStore";

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
  const { id } = await context.params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
  }

  if (session.status === "completed" || 
    session.status === "canceled" || 
    session.status === "complete_in_progress" || 
    session.status === "requires_escalation") {
    return NextResponse.json(
      { error: `Cannot update session with status: ${session.status}` },
      { status: 409 }
    );
  }

  let body: UpdateCheckoutRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate and extract email
  let newEmail = session.customer.email;
  if (body.customer?.email !== undefined) {
    const result = validateEmail(body.customer.email);
    if (!result.valid) {
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

  return NextResponse.json({
    session: updatedSession,
    ...(missingFields.length > 0 && { missing_fields: missingFields }),
  });
}
