"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Retailer, type Product } from "./ProductCard";
import { SHIPPING_RIYADH, round2 } from "@/lib/pricing";

interface ProductDetailScreenProps {
  product: Product;
  onClose: () => void;
  onBuy: () => void;
}

function getShippingCost(product: Product): number {
  if (product.retailer === Retailer.Jarir) return 0;
  return SHIPPING_RIYADH;
}

function getDeliveryTag(product: Product): string | null {
  const promise = product.delivery?.default_promise?.toLowerCase() ?? "";
  if (promise.includes("today")) return "Arrives today before 10pm";
  if (promise.includes("tomorrow")) return "Arrives tomorrow";
  if (promise.includes("1–2 days") || promise.includes("1-2 days")) return "Arrives in 1–2 days";
  if (promise.includes("2–3 days") || promise.includes("2-3 days")) return "Arrives in 2–3 days";
  if (promise) return product.delivery.default_promise;
  return null;
}

function formatPrice(price: number, currency: string): string {
  if (currency === "SAR") return `SAR ${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
}

function HeroStarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const clampedRating = Math.min(Math.max(rating, 0), 5);
  const fullStars = Math.floor(clampedRating);
  const hasHalf = clampedRating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const star = (fill: string, key: string) => (
    <svg key={key} width="13" height="13" viewBox="0 0 24 24" fill={fill} className="inline-block">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <span className="inline-flex items-center gap-0.5 text-[13px]">
      <span className="font-medium text-zinc-700">{rating.toFixed(1)}</span>
      <span className="inline-flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => star("#f59e0b", `f${i}`))}
        {hasHalf && (
          <svg key="h" width="13" height="13" viewBox="0 0 24 24" className="inline-block">
            <defs><linearGradient id="halfGrad"><stop offset="50%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#d4d4d8" /></linearGradient></defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#halfGrad)" />
          </svg>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => star("#d4d4d8", `e${i}`))}
      </span>
      <span className="text-blue-600">
        ({reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}K` : reviewCount} user reviews)
      </span>
    </span>
  );
}

function FloatingIconButton({ onClick, children, label }: { onClick?: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-500/60 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
    >
      {children}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-bold text-zinc-800">
      {label}
    </span>
  );
}

const RETAILER_LOGOS: Partial<Record<Retailer, string>> = {
  [Retailer.Jarir]: "/jarirLogo.svg",
  [Retailer.Amazon]: "/amazonLogo.svg",
  [Retailer.Noon]: "/noonLogo.svg",
  [Retailer.Extra]: "/extraLogo.svg",
  [Retailer.Lulu]: "/luluLogo.svg",
};

function RetailerLogo({ retailer }: { retailer: Retailer }) {
  const logo = RETAILER_LOGOS[retailer];
  if (logo) {
    return (
      <Image
        src={logo}
        alt={retailer}
        width={20}
        height={20}
        className="h-5 w-5 rounded object-contain"
        unoptimized
      />
    );
  }
  const initial = retailer.charAt(0).toUpperCase();
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-white">
      {initial}
    </span>
  );
}

export function ProductDetailScreen({ product, onClose, onBuy }: ProductDetailScreenProps) {
  const [isClosing, setIsClosing] = useState(false);

  const images = product.image_url ? [product.image_url] : [];

  const tags = product.tags ?? [];
  const deliveryTag = getDeliveryTag(product);
  const shipping = getShippingCost(product);
  const inStock = product.availability?.in_stock ?? false;
  const estimatedTotal = round2(product.price + shipping);

  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsClosing(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  return (
    <div
      className={`absolute inset-0 z-10 bg-white ${isClosing ? "animate-slide-out-right" : "animate-slide-in-left"}`}
      style={{ borderRadius: "inherit" }}
    >
      <div className="scrollbar-none flex h-full flex-col overflow-y-auto">

        <div className="hero-image relative shrink-0 px-3 pt-12">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-100" style={{ height: 280 }}>
            {images.length > 0 ? (
              <div className="scrollbar-none flex h-full w-full snap-x snap-mandatory overflow-x-auto">
                {images.map((src, idx) => (
                  <div key={idx} className="relative h-full w-full shrink-0 snap-center">
                    <Image
                      src={src}
                      alt={product.title}
                      fill
                      className="object-contain p-6"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Image
                  src="/product-list-card-image-placeholder.svg"
                  alt="No image available"
                  width={80}
                  height={80}
                  className="opacity-40"
                  unoptimized
                />
              </div>
            )}

            <div className="retailer-badge absolute bottom-2.5 right-2.5 rounded bg-zinc-800/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {product.retailer}
            </div>
          </div>

          <div className="floating-actions absolute right-5 top-14 flex items-center gap-1.5">
            <FloatingIconButton label="Share"><ShareIcon /></FloatingIconButton>
            <FloatingIconButton label="More options"><MoreIcon /></FloatingIconButton>
            <FloatingIconButton onClick={handleClose} label="Close"><CloseIcon /></FloatingIconButton>
          </div>
        </div>

        <div className="product-info px-4 pt-3">
          <h1 className="text-[15px] font-semibold leading-snug text-zinc-900">{product.title}</h1>
          <div className="mt-1">
            <HeroStarRating rating={product.rating} reviewCount={product.reviewCount} />
          </div>
        </div>

        <div className="product-detail-card mx-4 mt-4 rounded-lg border border-zinc-100 bg-zinc-50">

          <div className="tags-row flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
            {deliveryTag && <Tag label={deliveryTag} />}
          </div>

          <div className="retailer-price flex items-start justify-between px-4 pb-2">
            <div className="flex items-center gap-1.5">
              <RetailerLogo retailer={product.retailer} />
              <span className="text-sm font-semibold text-blue-700">{product.retailer}</span>
            </div>
            <div className="text-right">
              <span className="text-[15px] font-bold text-zinc-900">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
          </div>

          <div className="mx-4 border-t border-dotted border-zinc-200" />

          <div className="delivery-row flex items-center justify-between px-4 py-2 text-[13px] text-zinc-600">
            <span>Delivery</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping, product.currency)}</span>
          </div>

          <div className="estimated-total flex items-center justify-between px-4 pb-2">
            <span className="text-[13px] font-bold text-zinc-900">Est. total</span>
            <span className="text-[13px] font-bold text-zinc-900">
              {formatPrice(estimatedTotal, product.currency)}
              <span className="ml-0.5 text-xs font-normal text-zinc-500">+ VAT</span>
            </span>
          </div>

          <div className="stock-status px-4 pb-1">
            <span className={`text-[13px] font-medium ${inStock ? "text-green-600" : "text-red-500"}`}>
              {inStock ? "In stock online" : "Out of stock"}
            </span>
          </div>

          <div className="rating-returns flex items-center gap-1 px-4 pb-3 text-[13px] text-zinc-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{product.rating.toFixed(1)}/5</span>
            <span className="text-zinc-300">·</span>
            <span>100-day returns</span>
          </div>

          <div className="action-buttons flex gap-2.5 px-4 pb-4">
            <button
              type="button"
              onClick={onBuy}
              className="rounded-full border border-blue-600 px-5 py-1.5 text-[13px] font-medium text-blue-600 hover:bg-blue-50"
            >
              Buy
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-300 px-5 py-1.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Visit site
            </button>
          </div>
        </div>

        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
