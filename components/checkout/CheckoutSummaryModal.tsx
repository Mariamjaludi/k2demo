"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { type Product, ProductSummaryCard } from "@/components/product";
import type { OrderTotals } from "@/lib/agentFlow/types";
import { BaseModal } from "./BaseModal";
import { CtaButton } from "./CtaButton";
import { PaySummary } from "./PaySummary";

interface CheckoutSummaryModalProps {
  product: Product;
  moreFromRetailer: Product[];
  totals: OrderTotals;
  onClose: () => void;
  onContinueToCheckout: () => void;
}

function formatPrice(price: number, currency: string): string {
  return currency === "SAR" ? `SAR ${price.toFixed(2)}` : `$${price.toFixed(2)}`;
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
  totals,
  onClose,
  onContinueToCheckout,
}: CheckoutSummaryModalProps) {
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  return (
    <BaseModal
      retailer={product.retailer}
      onClose={onClose}
      ariaLabelledBy="checkout-summary-title"
      footer={
        <CtaButton ref={ctaRef} label="Continue to checkout" onClick={onContinueToCheckout} />
      }
    >
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
        <PaySummary
          retailerName={product.retailer}
          subtotal={totals.subtotal}
          shipping={totals.shipping}
          vat={totals.vat}
          total={totals.total}
          currency={totals.currency}
        />
      </div>
    </BaseModal>
  );
}
