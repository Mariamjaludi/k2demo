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
  availability: {
    in_stock: boolean;
    stock_level: number;
  };
  delivery: {
    default_promise: string;
  };
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  onClickTitle?: (id: string) => void;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {rating.toFixed(1)}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="inline-block text-amber-500"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
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

function HighlightedText({ text }: { text: string }) {
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

function generateReviewSummary(product: Product): string {
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

function generateFeatureSummary(product: Product): string {
  const defaultPromise = product.delivery?.default_promise ?? "";

  const deliveryHighlight = defaultPromise.toLowerCase().includes("tomorrow")
    ? "**next-day delivery** in Riyadh"
    : "**fast delivery** across Saudi Arabia";

  const summaries: Record<string, string> = {
    office_supplies: `Features ${deliveryHighlight}.`,
    school_supplies: `Includes ${deliveryHighlight} with **easy returns** within 14 days.`,
    toys_kids_learning: `Comes with ${deliveryHighlight} and is **age-appropriate** for safe play.`,
    arts_crafts: `Offers ${deliveryHighlight} with **premium materials** for lasting creations.`,
    english_books: `Available with ${deliveryHighlight} from **trusted publishers** with quality content.`,
  };

  return (
    summaries[product.category] ||
    `Features ${deliveryHighlight} and **quality guarantee** from ${product.retailer}.`
  );
}

export function ProductCard({ product, onClickTitle }: ProductCardProps) {
  const reviewSummary = generateReviewSummary(product);
  const featureSummary = generateFeatureSummary(product);

  return (
    <div className="py-3">
      {/* Main row: image, info */}
      <div className="flex items-center gap-3">
        <div className={`product-thumbnail h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ${!product.image_url ? "flex items-center justify-center" : ""}`}>
          <Image
            src={product.image_url ?? "/product-list-card-image-placeholder.svg"}
            alt={product.image_url ? product.title : ""}
            aria-hidden={!product.image_url}
            width={64}
            height={64}
            className={product.image_url ? "h-full w-full object-cover" : "h-6 w-6"}
            unoptimized
          />
        </div>

        <div className="product-name min-w-0 flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => onClickTitle?.(product.id)}
            className="product-title block max-w-full text-left text-sm font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 rounded-sm"
          >
            {product.title}
          </button>

          <p className="product-price mt-0.5 text-sm text-zinc-900">
            {formatPrice(product.price, product.currency)}
          </p>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <RatingStars rating={product.rating} />
            <span>{formatReviewCount(product.reviewCount)}</span>
            <span className="text-zinc-300">·</span>
            <span>{product.retailer}</span>
          </p>
        </div>
      </div>


      <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-600">
        <li className="reviews-summary flex gap-2">
          <span className="shrink-0 text-zinc-400">•</span>
          <span>
            <HighlightedText text={reviewSummary} />
          </span>
        </li>
        <li className="feature-summary flex gap-2">
          <span className="shrink-0 text-zinc-400">•</span>
          <span>
            <HighlightedText text={featureSummary} />
          </span>
        </li>
      </ul>
    </div>
  );
}
