export type Velocity = "fast" | "normal" | "slow" | "overstock";
export type LifecycleStage = "core" | "new" | "seasonal" | "aging";

/** All monetary fields (price, unit_cost, fulfillment_cost) are SAR decimals. */
export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  /** SAR decimals */
  price: number;
  currency: "SAR";
  margin_bps: number;
  /** SAR decimals — cost of goods sold */
  unit_cost: number;
  /** SAR decimals — pick/pack/ship cost */
  fulfillment_cost: number;
  velocity: Velocity;
  lifecycle_stage: LifecycleStage;
  compatible_with: string[];
  attachments: string[];
  image_url: string;
  attributes: Record<string, unknown>;
  availability: { in_stock: boolean; stock_level: number };
  delivery: { default_promise: string };
};

/** Consumer-facing product shape — strips merchant-confidential fields. */
export type PublicProduct = {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: "SAR";
  image_url: string;
  attributes: Record<string, unknown>;
  availability: { in_stock: boolean; stock_level: number };
  delivery: { default_promise: string };
};

export function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    category: p.category,
    price: p.price,
    currency: p.currency,
    image_url: p.image_url,
    attributes: { ...p.attributes },
    availability: { ...p.availability },
    delivery: { ...p.delivery },
  };
}

// ── Shared UCP metadata ─────────────────────────────────────────────

export const UCP_META = {
  version: "2025-04-25",
  capabilities: ["com.jarir.shopping.discovery"],
} as const;

// ── New scenario-based types ────────────────────────────────────────

/** API-facing perk types — matches the contract sent to the shopping agent. */
export type PerkType =
  | "pickup"
  | "delivery"
  | "assembly"
  | "loyalty"
  | "raffle"
  | "event_invite"
  | "variant_option";

/** Internal perk types — includes values that are valid in scenario definitions but not exposed in the API. */
export type InternalPerkType = PerkType | "pickup_optional_paid";

export type Perk = {
  type: PerkType;
  title: string;
  details: Record<string, unknown>;
};

export type InternalPerk = {
  type: InternalPerkType;
  title: string;
  details: Record<string, unknown>;
};

export type IncludedItemMeta = {
  sku_id: string;
  title: string;
  brand: string;
  /** SAR decimals — retail price of the included item */
  retail_value: number;
  currency: "SAR";
  image_url: string;
};

export type PriceBreakdown = {
  /** SAR decimals — sum of primary item retail prices */
  items_subtotal: number;
  /** SAR decimals — sum of included items' retail values */
  included_value: number;
  discount_total: 0;
  /** SAR decimals — amount charged to buyer */
  total_price: number;
  currency: "SAR";
};

export type OfferUI = {
  title: string;
  subtitle: string;
  badges: string[];
};

/**
 * Internal offer shape — used only within scenario engine internals.
 * NOT part of the API response contract.
 */
export type ItemOffer = {
  included_items: IncludedItemMeta[];
  perks: InternalPerk[];
  price_breakdown: PriceBreakdown;
  ui: OfferUI;
};

/**
 * A ranked offer attached to a single item.
 *
 * IMPORTANT: This type is part of the API response contract sent to the
 * shopping agent. It must NEVER contain reasoning, confidence,
 * confidence_explanation, economics, or KPI metadata.
 */
export type RankedOffer = {
  offer_id: string;
  rank: number;
  ui: OfferUI;
  included_items: IncludedItemMeta[];
  perks: Perk[];
  price_breakdown: PriceBreakdown;
};

export type ResponseItem = PublicProduct & {
  item_id: string;
  rank: number;
  ranked_offers?: RankedOffer[];
};

export type K2ResponseBody = {
  ucp: { version: string; capabilities: readonly string[] };
  query: string;
  items: ResponseItem[];
  recommended: { item_id: string; offer_id: string | null } | null;
  correlation_id: string;
};
