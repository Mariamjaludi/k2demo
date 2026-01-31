"use client";

import Image from "next/image";
import type { Product } from "./ProductCard";

function formatPrice(price: number, currency: string): string {
  return currency === "SAR" ? `SAR ${price.toFixed(2)}` : `$${price.toFixed(2)}`;
}

interface ProductSummaryCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductSummaryCard({ product, compact = false }: ProductSummaryCardProps) {
  if (compact) {
    return (
      <div className="rounded-xl bg-zinc-100 p-2.5">
        <div className="flex gap-2.5">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
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
            <p className="text-xs font-medium text-blue-600 underline decoration-blue-300 underline-offset-2">
              {product.title}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-green-700">
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="text-[11px] text-zinc-500">Qty: 1 · Return policy: 100-day returns</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-100 p-3">
      <div className="flex gap-3">
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-600 underline decoration-blue-300 underline-offset-2">
            {product.title}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-green-700">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Qty: 1</p>
          <p className="text-xs text-zinc-500">Return policy: 100-day returns</p>
        </div>
      </div>
    </div>
  );
}
