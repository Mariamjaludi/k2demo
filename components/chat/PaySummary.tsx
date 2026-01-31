"use client";

import { useState } from "react";

interface PaySummaryProps {
  retailerName: string;
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
  currency: string;
}

function formatPrice(price: number, currency: string): string {
  return currency === "SAR" ? `SAR ${price.toFixed(2)}` : `$${price.toFixed(2)}`;
}

export function PaySummary({
  retailerName,
  subtotal,
  shipping,
  vat,
  total,
  currency,
}: PaySummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <span>Pay {retailerName}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <span className="text-xl font-bold text-zinc-900">
          {formatPrice(total, currency)}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping, currency)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>VAT (15%)</span>
            <span>{formatPrice(vat, currency)}</span>
          </div>
          <div className="flex justify-between pt-1 font-semibold text-zinc-900">
            <span>Total</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
