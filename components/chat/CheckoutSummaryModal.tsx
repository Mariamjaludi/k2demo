"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Retailer, RETAILER_LOGOS, type Product } from "./ProductCard";
import { SAFE_AREA } from "../DeviceFrame";
import { SHIPPING_RIYADH, VAT_RATE, round2 } from "@/lib/pricing";

interface CheckoutSummaryModalProps {
  product: Product;
  moreFromRetailer: Product[];
  onClose: () => void;
  onContinueToCheckout: () => void;
}

function formatPrice(price: number, currency: string): string {
  return currency === "SAR" ? `SAR ${price.toFixed(2)}` : `$${price.toFixed(2)}`;
}

function getShippingCost(product: Product): number {
  if (product.retailer === Retailer.Jarir) return 0;
  return SHIPPING_RIYADH;
}

function RetailerHeader({ retailer }: { retailer: Retailer }) {
  const logoSrc = RETAILER_LOGOS[retailer];
  const initial = retailer.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={retailer}
          width={22}
          height={22}
          className="rounded"
          unoptimized
        />
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-white">
          {initial}
        </span>
      )}
      <span className="text-sm font-semibold text-zinc-900">{retailer}</span>
    </div>
  );
}

function ProductSummaryCard({ product }: { product: Product }) {
  return (
    <div className="rounded-xl bg-zinc-100 p-3">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
          <Image
            src={product.image_url ?? "/product-list-card-image-placeholder.svg"}
            alt={product.title}
            width={64}
            height={64}
            className={product.image_url ? "h-full w-full object-contain p-1" : "h-full w-full p-4 opacity-40"}
            unoptimized
          />
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-600 underline decoration-blue-300 underline-offset-2">
            {product.title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-green-700">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Qty: 1
          </p>
          <p className="text-xs text-zinc-500">
            Return policy: 100-day returns
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendedCard({ product }: { product: Product }) {
  return (
    <div className="w-40 shrink-0">
      <div className="h-28 overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={product.image_url ?? "/product-list-card-image-placeholder.svg"}
          alt={product.title}
          width={160}
          height={112}
          className={product.image_url ? "h-full w-full object-contain p-3" : "h-full w-full p-8 opacity-40"}
          unoptimized
        />
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium text-zinc-900">
        {product.title}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-zinc-900">
        {formatPrice(product.price, product.currency)}
      </p>
    </div>
  );
}

export function CheckoutSummaryModal({
  product,
  moreFromRetailer,
  onClose,
  onContinueToCheckout,
}: CheckoutSummaryModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [closing, setClosing] = useState(false);

  const subtotal = product.price;
  const shipping = getShippingCost(product);
  const vat = round2((subtotal + shipping) * VAT_RATE);
  const estimatedTotal = round2(subtotal + shipping + vat);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 250);
  }, [closing, onClose]);

  // Autofocus CTA on mount, restore focus on unmount
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    ctaRef.current?.focus();
    return () => returnFocusRef.current?.focus();
  }, []);

  // Focus trap + Escape
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // If focus is outside the sheet, pull it back
      if (!sheet.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col backdrop-blur-sm transition-colors duration-250 ${closing ? "bg-black/0" : "bg-black/40"}`}
      style={{ borderRadius: "inherit" }}
      onClick={handleClose}
    >
      {/* Modal sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-summary-title"
        className={`relative mt-auto flex max-h-[80%] flex-col rounded-t-2xl bg-white ${closing ? "animate-sheet-out" : "animate-sheet-in"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: SAFE_AREA.bottom }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        {/* Header: retailer name + close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <RetailerHeader retailer={product.retailer} />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center text-zinc-500"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-zinc-200" />

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
          {/* Title */}
          <h2 id="checkout-summary-title" className="text-xl font-medium text-zinc-900">
            Checkout
          </h2>

          {/* Product card */}
          <div className="mt-4">
            <ProductSummaryCard product={product} />
          </div>

          {/* Recommended for you */}
          {moreFromRetailer.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-zinc-900">Recommended for you</h3>
              <div className="scrollbar-none -mx-5 mt-3 flex gap-3 overflow-x-auto px-5">
                {moreFromRetailer.map((p) => (
                  <RecommendedCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Payment summary row */}
          <div className="mt-5 pb-4">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-1 text-sm text-zinc-500">
                <span>Pay {product.retailer}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-zinc-400 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-zinc-900">
                {formatPrice(estimatedTotal, product.currency)}
              </span>
            </button>

            {showBreakdown && (
              <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, product.currency)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping, product.currency)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>VAT (15%)</span>
                  <span>{formatPrice(vat, product.currency)}</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold text-zinc-900">
                  <span>Total</span>
                  <span>{formatPrice(estimatedTotal, product.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 px-5 pb-4 pt-2">
          <button
            ref={ctaRef}
            type="button"
            onClick={onContinueToCheckout}
            className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
