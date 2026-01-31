"use client";

import Image from "next/image";
import { Retailer, RETAILER_LOGOS, type Product } from "@/components/product";
import type { OrderTotals, CustomerInfo } from "@/lib/agentFlow/types";
import { SAFE_AREA } from "@/components/DeviceFrame";

interface OrderCompleteScreenProps {
  product: Product;
  totals: OrderTotals;
  orderId: string;
  customer: CustomerInfo;
}

function formatPrice(amount: number, currency: string): string {
  return currency === "SAR" ? `SAR ${amount.toFixed(2)}` : `$${amount.toFixed(2)}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 text-[15px] font-semibold text-zinc-900">
      {children}
    </h3>
  );
}

function VerifiedCheckBadge() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="15" fill="#2563EB" />
      <path
        d="M13 20.5l4 4 10-10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Parse a delivery promise string like "Deliver tomorrow in Riyadh" or
 * "Deliver in 2–3 days" into a concrete arrival date string.
 */
function formatArrivalDate(deliveryPromise: string): string {
  const d = new Date();

  if (/today/i.test(deliveryPromise)) {
    // same day — no offset
  } else if (/tomorrow/i.test(deliveryPromise)) {
    d.setDate(d.getDate() + 1);
  } else {
    const rangeMatch = deliveryPromise.match(/(\d+)\s*[-–]\s*(\d+)\s*day/i);
    const singleMatch = deliveryPromise.match(/(\d+)\s*day/i);
    const days = rangeMatch ? parseInt(rangeMatch[2], 10)
      : singleMatch ? parseInt(singleMatch[1], 10)
      : 7;
    d.setDate(d.getDate() + days);
  }

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-zinc-500">
      <path
        d="M9 21h6M12 3a6 6 0 0 0-4 10.47V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.53A6 6 0 0 0 12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OrderCompleteScreen({
  product,
  totals,
  orderId,
  customer,
}: OrderCompleteScreenProps) {
  const logoSrc = RETAILER_LOGOS[product.retailer];
  const isJarirMember = product.retailer === Retailer.Jarir && totals.shipping === 0;
  const address = customer.address;
  const displayName = customer.name ?? customer.email;

  return (
    <div
      className="flex h-full flex-col animate-fade-in bg-white px-5"
      style={{ paddingBottom: SAFE_AREA.bottom }}
    >
      {/* Retailer header */}
      <div className="flex items-center gap-2 pt-3">
        {logoSrc && (
          <Image
            src={logoSrc}
            alt={product.retailer}
            width={20}
            height={20}
            className="rounded"
            unoptimized
          />
        )}
        <span className="text-[13px] font-semibold text-zinc-900">{product.retailer}</span>
      </div>

      {/* Title row with check badge */}
      <div className="mt-1.5 flex items-center justify-between">
        <h1 className="text-[22px] font-light text-zinc-900">Order complete</h1>
        <VerifiedCheckBadge />
      </div>

      {/* Order ID */}
      <p className="text-xs text-zinc-500">Order ID: {orderId}</p>

      {/* Confirmation text with inline "View orders" link */}
      <p className="mt-2 text-xs text-zinc-700">
        Thank you. Your order has been confirmed.{" "}
        <span className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2">
          View orders
        </span>
      </p>

      {/* Order summary section */}
      <div className="mt-4">
        <SectionHeading>Order summary</SectionHeading>
        <div className="flex items-start gap-2.5">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            <Image
              src={product.image_url ?? "/product-list-card-image-placeholder.svg"}
              alt={product.title}
              width={56}
              height={56}
              className={product.image_url ? "h-full w-full object-contain p-1" : "h-full w-full p-3 opacity-40"}
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-blue-600">{product.title}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Qty: 1
            </p>
          </div>
          <p className="shrink-0 text-[13px] font-semibold text-zinc-900">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </div>

      {/* Totals breakdown */}
      <div className="mt-3 text-[13px]">
        <div className="flex justify-between text-zinc-700">
          <span>Subtotal</span>
          <span>{formatPrice(totals.subtotal, totals.currency)}</span>
        </div>
        {isJarirMember && (
          <div className="mt-1 flex justify-between text-green-700">
            <span>Member perk</span>
            <span>Free overnight delivery</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-zinc-700">
          <span>Shipping and other fees</span>
          <span>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping, totals.currency)}</span>
        </div>
        <div className="mt-1 flex justify-between text-zinc-700">
          <span>Tax</span>
          <span>{formatPrice(totals.vat, totals.currency)}</span>
        </div>
        <div className="my-1.5 border-t border-zinc-200" />
        <div className="flex justify-between font-semibold text-zinc-900">
          <span>Total price</span>
          <span>{formatPrice(totals.total, totals.currency)}</span>
        </div>
        <div className="mt-1 flex justify-between text-zinc-500">
          <span>Payment method</span>
          <span>Visa ··1234 with Mada</span>
        </div>
      </div>

      {/* Delivery information */}
      <div className="mt-4">
        <SectionHeading>Delivery information</SectionHeading>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-zinc-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs text-zinc-700">Arrives by {formatArrivalDate(product.delivery.default_promise)}</span>
          </div>
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-zinc-400">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div className="text-xs text-zinc-700">
              <p className="font-medium">{displayName}</p>
              {address && (
                <>
                  <p className="text-zinc-600">{address.address_line1}</p>
                  <p className="text-zinc-600">
                    {[address.city, address.district, address.postcode].filter(Boolean).join(", ")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order updates */}
      <div className="mt-4">
        <SectionHeading>Order updates</SectionHeading>
        <div className="flex gap-2 rounded-xl bg-blue-50/70 px-3 py-2.5">
          <LightbulbIcon />
          <p className="text-xs leading-relaxed text-zinc-700">
            <span className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2">
              Contact {product.retailer}
            </span>
            {" "}if you need support with your order. {product.retailer} can help you with questions about shipping, delivery, returns, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
