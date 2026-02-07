export type Velocity = "fast" | "normal" | "slow" | "overstock";
export type LifecycleStage = "current" | "aging" | "clearance";

/** All monetary fields (price, unit_cost, fulfillment_cost) are SAR decimals. */
export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  /** SAR decimals */
  price: number;
  currency: string;
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
  currency: string;
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

export type UcpMeta = {
  version: string;
  capabilities: readonly string[];
};

// ── New scenario-based types ────────────────────────────────────────

export type PerkType =
  | "pickup"
  | "pickup_optional_paid"
  | "delivery"
  | "assembly"
  | "loyalty"
  | "raffle"
  | "event_invite";

export type Perk = {
  type: PerkType;
  title: string;
  details: Record<string, unknown>;
};

export type IncludedItemMeta = {
  sku_id: string;
  title: string;
  brand: string;
  retail_value: number;
  currency: "SAR";
  image_url: string;
};

export type PriceBreakdown = {
  items_subtotal: number;
  included_value: number;
  discount_total: 0;
  total_price: number;
  currency: "SAR";
};

export type OfferUI = {
  title: string;
  subtitle: string;
  badges: string[];
};

export type ItemOffer = {
  included_items: IncludedItemMeta[];
  perks: Perk[];
  price_breakdown: PriceBreakdown;
  ui: OfferUI;
};

export type ResponseItem = PublicProduct & {
  item_id: string;
  rank: number;
  /** Single offer for this item (mutually exclusive with bundles) */
  offer?: ItemOffer;
  /** Multiple bundle options for the same product (used when same SKU appears multiple times with different offers) */
  bundles?: ItemOffer[];
};

export type K2ResponseBody = {
  ucp: { version: string; capabilities: readonly string[] };
  query: string;
  items: ResponseItem[];
  recommended_item_id: string | null;
  correlation_id: string;
};
