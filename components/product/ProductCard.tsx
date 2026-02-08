"use client";

import Image from "next/image";

export enum Retailer {
  Jarir = "Jarir",
  Amazon = "Amazon.sa",
  Noon = "Noon",
  Extra = "Extra",
  Lulu = "Lulu",
}

export const RETAILER_LOGOS: Partial<Record<Retailer, string>> = {
  [Retailer.Jarir]: "/jarirLogo.svg",
  [Retailer.Amazon]: "/amazonLogo.svg",
  [Retailer.Noon]: "/noonLogo.svg",
  [Retailer.Extra]: "/extraLogo.svg",
  [Retailer.Lulu]: "/luluLogo.svg",
};

export interface BundledItem {
  title: string;
  brand?: string;
  retail_value: number;
  image_url?: string;
}

export interface ProductBundle {
  title: string;
  subtitle: string;
  badges: string[];
  includedItems?: BundledItem[];
  perks?: { type: string; title: string }[];
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  retailer: Retailer;
  price: number;
  currency: "SAR";
  rating: number;
  reviewCount: number;
  image_url?: string;
  attributes?: {
    type?: string;
    [key: string]: unknown;
  };
  availability: {
    in_stock: boolean;
    stock_level: number;
  };
  delivery: {
    default_promise: string;
  };
  tags?: string[];
  /** Single offer/bundle for this product */
  bundle?: ProductBundle;
  /** Multiple bundle options (used when same product has multiple offer variants) */
  bundles?: ProductBundle[];
}

interface ProductCardProps {
  product: Product;
  onClickTitle?: (id: string) => void;
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      <span>{rating.toFixed(1)}</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={star <= rounded ? "0" : "2"}
          className={star <= rounded ? "text-amber-400" : "text-zinc-300"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatPrice(price: number, currency: string): string {
  if (currency === "SAR") {
    return `SAR ${price.toFixed(2)}`;
  }
  return `$${price.toFixed(2)}`;
}

function formatReviewCount(count: number): string {
  if (count >= 1000) {
    return `(${(count / 1000).toFixed(1)}K)`;
  }
  return `(${count})`;
}

export function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} className="font-semibold text-zinc-900">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function generateReviewSummary(product: Product): string {
  const summaries: Record<string, string> = {
    office_supplies:
      "Customers praise its **reliable quality** and **excellent value** for everyday office use.",
    school_supplies:
      "Parents appreciate the **durable construction** and **kid-friendly design** that lasts the school year.",
    toys_kids_learning:
      "Reviewers highlight the **educational value** and **engaging activities** that keep children entertained.",
    arts_crafts:
      "Artists love the **smooth texture** and **vibrant results** for creative projects.",
    english_books:
      "Learners commend the **clear explanations** and **practical exercises** for building language skills.",
  };

  return (
    summaries[product.category] ||
    "Customers consistently rate this product for its **quality** and **reliability**."
  );
}

export function ProductCard({ product, onClickTitle }: ProductCardProps) {
  const tags = (product.tags ?? []).slice(0, 2);
  const retailerLogo = RETAILER_LOGOS[product.retailer];

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onClickTitle?.(product.id)}
      className="flex flex-col rounded-xl shadow-sm text-left cursor-pointer"
    >
      {/* Image area with benefit tags */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-zinc-100">
        <Image
          src={product.image_url ?? "/product-list-card-image-placeholder.svg"}
          alt={product.image_url ? product.title : ""}
          aria-hidden={!product.image_url}
          fill
          className={product.image_url ? "object-cover" : "object-contain p-6"}
          unoptimized
        />
        {tags.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-sm bg-emerald-700 px-1.5 py-px text-[10px] font-bold uppercase text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="mt-2 flex flex-col px-2.5 pb-3">
        <span className="product-title text-sm font-normal leading-snug text-zinc-900 line-clamp-2">
          {product.title}
        </span>

        <p className="product-price mt-0.5 text-sm font-normal text-zinc-900">
          {formatPrice(product.price, product.currency)}
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          {retailerLogo && (
            <Image
              src={retailerLogo}
              alt={product.retailer}
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
              unoptimized
            />
          )}
          <span className="text-xs text-zinc-500">{product.retailer}</span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
          <RatingStars rating={product.rating} />
          <span>{formatReviewCount(product.reviewCount)}</span>
        </p>
      </div>
    </button>
  );
}
