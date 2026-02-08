"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Retailer, RETAILER_LOGOS, type Product, type ProductBundle, type BundledItem, generateReviewSummary, HighlightedText } from "./ProductCard";
import { SHIPPING_RIYADH, round2 } from "@/lib/pricing";

interface ProductDetailScreenProps {
  product: Product;
  onClose: () => void;
  onBuy: () => void;
  disabled?: boolean;
}

function getShippingCost(product: Product): number {
  if (product.retailer === Retailer.Jarir) return 0;
  return SHIPPING_RIYADH;
}

function getDeliveryTag(product: Product): string | null {
  const promise = product.delivery?.default_promise?.toLowerCase() ?? "";
  const hoursMatch = promise.match(/(\d+)\s*h(ou)?rs?/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    if (hours <= 12) return `Arrives in ${hours} hours`;
    if (hours <= 24) return "Arrives today";
    if (hours <= 48) return "Arrives tomorrow";
  }
  if (promise.includes("same-day") || promise.includes("same day") || promise.includes("today")) return "Arrives today";
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

const RETAILER_DOMAINS: Record<Retailer, string> = {
  [Retailer.Jarir]: "jarir.com",
  [Retailer.Amazon]: "amazon.sa",
  [Retailer.Noon]: "noon.com",
  [Retailer.Extra]: "extra.com",
  [Retailer.Lulu]: "lulu-hypermarket.com",
};

const HIDDEN_ATTRIBUTES = new Set(["source_url", "vat_included"]);

function formatAttributeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function HeroStarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const clampedRating = Math.min(Math.max(rating, 0), 5);
  const fullStars = Math.floor(clampedRating);
  const hasHalf = clampedRating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const star = (fill: string, key: string) => (
    <svg key={key} width="16" height="16" viewBox="0 0 24 24" fill={fill} className="inline-block">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <span className="inline-flex items-center gap-1 text-[14px]">
      <span className="font-medium text-zinc-800">{rating.toFixed(1)}</span>
      <span className="inline-flex items-center gap-px">
        {Array.from({ length: fullStars }).map((_, i) => star("#f59e0b", `f${i}`))}
        {hasHalf && (
          <svg key="h" width="16" height="16" viewBox="0 0 24 24" className="inline-block">
            <defs><linearGradient id="halfGrad"><stop offset="50%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#d4d4d8" /></linearGradient></defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#halfGrad)" />
          </svg>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => star("#d4d4d8", `e${i}`))}
      </span>
      <span className="text-[14px] text-zinc-700 underline decoration-zinc-400 underline-offset-2">
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

function BundledItemCard({ item }: { item: BundledItem }) {
  const displayName = item.brand ? `${item.brand} ${item.title}` : item.title;

  return (
    <div className="flex w-28 max-w-28 shrink-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2">
      <div className="relative mx-auto h-16 w-16">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src="/product-list-card-image-placeholder.svg"
              alt="No image"
              width={24}
              height={24}
              className="opacity-40"
              unoptimized
            />
          </div>
        )}
      </div>
      <span className="mt-2 line-clamp-3 text-[10px] font-medium leading-tight text-zinc-700">
        {displayName}
      </span>
      <span className="mt-0.5 text-[9px] text-zinc-500">
        valued at SAR {item.retail_value.toFixed(2)}
      </span>
    </div>
  );
}

function OffersSection({ bundle, bundles }: { bundle?: ProductBundle; bundles?: ProductBundle[] }) {
  // Collect all included items from bundle(s)
  const allBundles = bundles ?? (bundle ? [bundle] : []);
  if (allBundles.length === 0) return null;

  const includedItems = allBundles.flatMap((b) => b.includedItems ?? []);

  if (includedItems.length === 0) return null;

  return (
    <div className="offers-section px-4 pt-3">
      <h2 className="text-[13px] font-semibold text-zinc-900">Free Gifts with Purchase</h2>
      <div className="scrollbar-none mt-2 flex gap-3 overflow-x-auto pb-2">
        {includedItems.map((item, idx) => (
          <BundledItemCard key={`${item.title}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

/** Extract perks from bundle(s) */
function getPerks(bundle?: ProductBundle, bundles?: ProductBundle[]): { type: string; title: string }[] {
  const allBundles = bundles ?? (bundle ? [bundle] : []);
  return allBundles.flatMap((b) => b.perks ?? []);
}

interface DetailCardProps {
  product: Product;
  shipping: number;
  estimatedTotal: number;
  inStock: boolean;
  tags: string[];
  perks: { type: string; title: string }[];
  deliveryTag: string | null;
  onBuy: () => void;
}

function ProductDetailCard({ product, shipping, estimatedTotal, inStock, tags, perks, deliveryTag, onBuy }: DetailCardProps) {
  return (
    <div className="product-detail-card mx-4 mt-4 rounded-2xl bg-[#f8f9fa] px-5 py-4">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RetailerLogo retailer={product.retailer} />
          <span className="text-[15px] font-bold text-blue-800">{product.retailer}</span>
        </div>
        <span className="text-[15px] text-zinc-900">
          {formatPrice(product.price, product.currency)}
        </span>
      </div>

      <p className="mt-1 text-[12px] leading-snug text-zinc-500">
        {product.brand ? `${product.brand} ` : ""}{product.title} - {product.retailer}
      </p>

      <div className="mt-1">
        <span className={`text-[12px] font-bold ${inStock ? "text-green-700" : "text-red-500"}`}>
          {inStock ? "In stock online" : "Out of stock"}
        </span>
      </div>

      <p className="mt-0.5 text-[12px] text-zinc-500">
        Delivery {shipping === 0 ? "Free" : formatPrice(shipping, product.currency)}
        <span className="mx-1">·</span>
        100-day returns
      </p>

      {(tags.length > 0 || perks.length > 0 || deliveryTag) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
          {perks.map((perk, idx) => (
            <Tag key={`perk-${perk.type}-${idx}`} label={perk.title} />
          ))}
          {deliveryTag && <Tag label={deliveryTag} />}
        </div>
      )}

      <div className="mt-3 border-t border-zinc-300/60" />

      <div className="mt-3 flex items-baseline justify-between text-[13px] text-zinc-600">
        <span>Base price + VAT</span>
        <span>{formatPrice(product.price, product.currency)}</span>
      </div>
      <div className="mt-0.5 flex items-baseline justify-between text-[13px] text-zinc-600">
        <span>Delivery fee</span>
        <span>{shipping === 0 ? "Free" : `+ ${formatPrice(shipping, product.currency)}`}</span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-[14px] font-bold text-zinc-900">Total</span>
        <span className="text-[15px] font-bold text-zinc-900">{formatPrice(estimatedTotal, product.currency)}</span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onBuy}
          className="flex-1 rounded-full bg-[#1a73e8] py-3 text-[14px] font-medium text-white hover:bg-[#1765cc]"
        >
          Buy
        </button>
        <button
          type="button"
          className="flex-1 rounded-full border border-zinc-300/70 bg-[#f8f9fa] py-3 text-[14px] font-medium text-[#1a73e8] hover:bg-zinc-100"
        >
          Visit site
        </button>
      </div>
    </div>
  );
}

export function ProductDetailScreen({ product, onClose, onBuy, disabled = false }: ProductDetailScreenProps) {
  const [isClosing, setIsClosing] = useState(false);

  const images = product.image_url ? [product.image_url] : [];

  const tags = product.tags ?? [];
  const perks = getPerks(product.bundle, product.bundles);
  const deliveryTag = getDeliveryTag(product);
  const shipping = getShippingCost(product);
  const inStock = product.availability?.in_stock ?? false;
  const estimatedTotal = round2(product.price + shipping);

  const handleClose = useCallback(() => {
    if (disabled) return;
    setIsClosing(true);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsClosing(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled]);

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
      aria-hidden={disabled || undefined}
    >
      <div className="scrollbar-none flex h-full flex-col overflow-y-auto">

        <div className="hero-image relative shrink-0 pt-12">
          <div className="relative overflow-hidden bg-zinc-100" style={{ height: 280 }}>
            {images.length > 0 ? (
              <div className="scrollbar-none flex h-full w-full snap-x snap-mandatory overflow-x-auto">
                {images.map((src, idx) => (
                  <div key={idx} className="relative h-full w-full shrink-0 snap-center">
                    <Image
                      src={src}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
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

          <div className="floating-actions absolute right-3 top-14 flex items-center gap-1.5">
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

        <div className="mx-4 mt-3 border-t border-zinc-200" />

        <OffersSection bundle={product.bundle} bundles={product.bundles} />

        <ProductDetailCard
          product={product}
          shipping={shipping}
          estimatedTotal={estimatedTotal}
          inStock={inStock}
          tags={tags}
          perks={perks}
          deliveryTag={deliveryTag}
          onBuy={onBuy}
        />

        <div className="mx-4 mt-1 border-t border-blue-100" />

        <div className="about-product px-4 pt-4">
          <h2 className="text-[17px] font-bold text-zinc-900">About this product</h2>

          <div className="mt-3 flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              <RetailerLogo retailer={product.retailer} />
            </div>
            <div>
              <p className="text-[13px] font-medium leading-snug text-blue-700">{product.title}</p>
              <p className="text-[12px] text-zinc-500">{RETAILER_DOMAINS[product.retailer]} · Retailer</p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[13px] leading-relaxed text-zinc-600">
              <HighlightedText text={generateReviewSummary(product)} />
            </p>
          </div>

          {product.attributes && Object.keys(product.attributes).filter((k) => !HIDDEN_ATTRIBUTES.has(k)).length > 0 && (
            <div className="mt-4 space-y-2.5">
              {Object.entries(product.attributes)
                .filter(([key]) => !HIDDEN_ATTRIBUTES.has(key))
                .map(([key, value]) => (
                  <div key={key} className="flex gap-4 text-[13px]">
                    <span className="w-28 shrink-0 font-medium text-zinc-700">{formatAttributeKey(key)}</span>
                    <span className="text-zinc-600">{Array.isArray(value) ? (value as string[]).join(", ") : String(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
