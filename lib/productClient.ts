import { Retailer, type Product, type ProductBundle } from "@/components/product/ProductCard";
import amazonCatalog from "./data/amazon-catalog.json";
import noonCatalog from "./data/noon-catalog.json";
import extraCatalog from "./data/extra-catalog.json";
import { matchTriggers, productMatchesTrigger, type TriggerMatch } from "./triggerMatcher";
import { normalizeText } from "./text/normalize";

const VALID_RETAILERS = new Set<string>(Object.values(Retailer));

function toCompetitorProduct(raw: Record<string, unknown>): Product | null {
  const retailer = typeof raw.retailer === "string" && VALID_RETAILERS.has(raw.retailer)
    ? (raw.retailer as Retailer)
    : null;
  if (!retailer) return null;
  return { ...(raw as Omit<Product, "retailer">), retailer };
}

const MOCK_COMPETITORS: Product[] = [
  ...amazonCatalog,
  ...noonCatalog,
  ...extraCatalog,
].map(toCompetitorProduct).filter((p): p is Product => p !== null);

const FILLER_WORDS = new Set([
  "i", "im", "i'm", "am", "looking", "for", "a", "an", "the", "some",
  "need", "want", "find", "me", "show", "get", "can", "you", "please",
  "search", "help", "good", "best", "great", "nice", "quality"
]);

/**
 * Extract meaningful search terms from a user query.
 * Uses normalizeText for Arabic diacritics/tatweel parity with server.
 */
function extractSearchTerms(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter(t => t.length > 1 && !FILLER_WORDS.has(t));
}

/**
 * Extract a clean product description from the query for display purposes.
 * Returns the product and any descriptors without filler words.
 */
function extractProductDescription(query: string): string {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return "";
  return terms.join(" ");
}

/**
 * Calculate relevance score for a product based on search terms and optional trigger match.
 * If a trigger match is provided and the product matches the trigger's categories/types,
 * the product gets a boost even if the search terms don't directly match.
 */
function calculateRelevance(
  product: Product,
  searchTerms: string[],
  triggerMatch: TriggerMatch | null = null
): number {
  let score = 0;
  const titleLower = product.title.toLowerCase();
  const brandLower = product.brand.toLowerCase();
  const categoryLower = product.category.toLowerCase().replace(/_/g, " ");
  const retailerLower = product.retailer.toLowerCase();
  const typeLower = (typeof product.attributes?.type === "string" ? product.attributes.type : "").toLowerCase().replace(/_/g, " ");

  // Check if product matches a triggered scenario's categories/types
  if (triggerMatch && productMatchesTrigger(product.category, product.attributes?.type as string | undefined, triggerMatch)) {
    score += 15; // Boost for matching scenario domain
  }

  if (searchTerms.length === 0) return score;

  for (const term of searchTerms) {
    if (titleLower.includes(term)) {
      score += 10;
      if (titleLower.split(/\s+/).includes(term)) {
        score += 5;
      }
    }
    if (brandLower.includes(term)) {
      score += 8;
    }
    if (categoryLower.includes(term)) {
      score += 5;
    }
    if (typeLower.includes(term)) {
      score += 5;
    }
    if (retailerLower.includes(term)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Sort products by relevance, with Jarir priority for ties
 */
/** Fisher-Yates shuffle (in place) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortByRelevance(
  products: Product[],
  searchTerms: string[],
  triggerMatch: TriggerMatch | null = null
): Product[] {
  if (searchTerms.length === 0 && !triggerMatch) {
    return shuffle([...products]);
  }

  const scored = products.map(product => ({
    product,
    relevance: calculateRelevance(product, searchTerms, triggerMatch),
  }));

  // Sort by relevance descending
  scored.sort((a, b) => b.relevance - a.relevance);

  // Shuffle within each relevance tier so retailers are interleaved
  const result: Product[] = [];
  let i = 0;
  while (i < scored.length) {
    let j = i;
    while (j < scored.length && scored[j].relevance === scored[i].relevance) {
      j++;
    }
    const tier = scored.slice(i, j).map(s => s.product);
    shuffle(tier);
    result.push(...tier);
    i = j;
  }

  return result;
}

/**
 * Assign tags to products based on comparative analysis of the list.
 * - "Best price" → lowest price product
 * - "Top rated" → highest rating product
 * - "Fastest delivery" → product with the fastest delivery promise
 * - "Free gift with purchase" / "Best value bundle" → mock bundle offerings for Jarir
 */
function tagProducts(products: Product[]): Product[] {
  if (products.length === 0) return products;

  // Find best price
  let bestPriceId: string | null = null;
  let lowestPrice = Infinity;
  for (const p of products) {
    if (p.price < lowestPrice) {
      lowestPrice = p.price;
      bestPriceId = p.id;
    }
  }

  // Find top rated
  let topRatedId: string | null = null;
  let highestRating = -1;
  for (const p of products) {
    if (p.rating > highestRating) {
      highestRating = p.rating;
      topRatedId = p.id;
    }
  }

  // Find fastest delivery based on promise text
  const deliverySpeed = (promise: string): number => {
    const lower = promise.toLowerCase();
    const hoursMatch = lower.match(/(\d+)\s*h(ou)?rs?/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10);
      if (hours <= 12) return 0;   // Express: faster than same-day
      if (hours <= 24) return 1;   // Same-day tier
      if (hours <= 48) return 2;   // Tomorrow tier
      return 3;                    // 1–2 days tier
    }
    if (lower.includes("same-day") || lower.includes("same day") || lower.includes("today")) return 1;
    if (lower.includes("tomorrow")) return 2;
    if (lower.includes("1–2 days") || lower.includes("1-2 days")) return 3;
    if (lower.includes("2–3 days") || lower.includes("2-3 days")) return 4;
    return 5;
  };

  let fastestDeliveryId: string | null = null;
  let fastestSpeed = Infinity;
  for (const p of products) {
    const speed = deliverySpeed(p.delivery?.default_promise ?? "");
    if (speed < fastestSpeed) {
      fastestSpeed = speed;
      fastestDeliveryId = p.id;
    }
  }

  return products.map(p => {
    const tags: string[] = [];

    if (p.id === bestPriceId) tags.push("Best price");
    if (p.id === topRatedId) tags.push("Top rated");
    if (p.id === fastestDeliveryId) tags.push("Fastest delivery");

    // Tag products that actually have bundled items
    const allBundles = p.bundles ?? (p.bundle ? [p.bundle] : []);
    const hasIncludedItems = allBundles.some(b => b.includedItems.length > 0);
    if (hasIncludedItems) {
      tags.push("Free gift with purchase");
    }

    // Merge first curated badge from the top offer (Jarir items only)
    if (p.retailer === Retailer.Jarir && allBundles.length > 0) {
      const topBadge = allBundles[0].badges[0];
      if (topBadge && !tags.includes(topBadge)) {
        tags.push(topBadge);
      }
    }

    return { ...p, tags };
  });
}

/** API perk types — mirrors server PerkType union */
type ApiPerkType = "pickup" | "delivery" | "assembly" | "loyalty" | "raffle" | "event_invite" | "variant_option";

/** Ranked offer shape from K2 response */
interface ApiRankedOffer {
  offer_id: string;
  rank: number;
  ui: { title: string; subtitle: string; badges: string[] };
  included_items: { sku_id: string; title: string; brand: string; retail_value: number; currency: "SAR"; image_url: string }[];
  perks: { type: ApiPerkType; title: string; details: Record<string, unknown> }[];
  price_breakdown: { items_subtotal: number; included_value: number; discount_total: number; total_price: number; currency: "SAR" };
}

/** Catalog item shape returned by the /api/products endpoint (mirrors ResponseItem) */
interface CatalogItem {
  /** Same as id in this demo; kept for future UCP item identity separation */
  item_id: string;
  id: string;
  rank: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: "SAR";
  image_url: string;
  attributes: Record<string, unknown>;
  availability: { in_stock: boolean; stock_level: number };
  delivery: { default_promise: string };
  ranked_offers?: ApiRankedOffer[];
}

/** Raw shape of items in jarir-catalog.json (no item_id, rank, or ranked_offers) */
interface StaticCatalogItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: "SAR";
  image_url?: string;
  attributes?: Record<string, unknown>;
  availability: { in_stock: boolean; stock_level: number };
  delivery: { default_promise: string };
}

/**
 * Convert an API ranked offer to a ProductBundle for the UI
 */
function toProductBundle(offer: ApiRankedOffer): ProductBundle {
  return {
    offerId: offer.offer_id,
    rank: offer.rank,
    title: offer.ui.title,
    subtitle: offer.ui.subtitle,
    badges: offer.ui.badges,
    includedItems: offer.included_items.map((i) => ({
      title: i.title,
      brand: i.brand,
      retail_value: i.retail_value,
      image_url: i.image_url,
    })),
    perks: offer.perks.map((p) => ({
      type: p.type,
      title: p.title,
    })),
  };
}

/** Generate mock rating/review data for demo display */
function mockRating(): { rating: number; reviewCount: number } {
  const rating = 4.5 + Math.random() * 0.4;
  return {
    rating: Math.round(rating * 10) / 10,
    reviewCount: Math.floor(500 + Math.random() * 2000),
  };
}

/**
 * Convert an API response item (CatalogItem) to a UI Product.
 * UI uses item.id which equals item_id in this demo.
 */
function toProduct(item: CatalogItem): Product {
  const { rating, reviewCount } = mockRating();

  const product: Product = {
    id: item.id,
    title: item.title,
    brand: item.brand,
    category: item.category,
    retailer: Retailer.Jarir,
    price: item.price,
    currency: item.currency,
    rating,
    reviewCount,
    image_url: item.image_url,
    attributes: item.attributes,
    availability: item.availability,
    delivery: item.delivery,
  };

  // Convert ranked_offers from API to UI format
  if (item.ranked_offers && item.ranked_offers.length > 0) {
    if (item.ranked_offers.length === 1) {
      product.bundle = toProductBundle(item.ranked_offers[0]);
    } else {
      product.bundles = item.ranked_offers.map(toProductBundle);
    }
  }

  return product;
}

/**
 * Convert a static catalog JSON item to a UI Product.
 * Used for recommendations where we load the raw JSON directly.
 */
function toProductFromStatic(item: StaticCatalogItem): Product {
  const { rating, reviewCount } = mockRating();
  return {
    id: item.id,
    title: item.title,
    brand: item.brand,
    category: item.category,
    retailer: Retailer.Jarir,
    price: item.price,
    currency: item.currency,
    rating,
    reviewCount,
    image_url: item.image_url,
    attributes: item.attributes ?? {},
    availability: item.availability,
    delivery: item.delivery,
  };
}

/**
 * Get products from a specific retailer's catalog (for recommendations).
 * Excludes a given product ID so the selected item isn't recommended to itself.
 *
 * Note: Jarir recs are loaded from static JSON, so they will not include
 * ranked_offers or identity-gated content. This is acceptable for the demo.
 */
export function getProductsByRetailer(retailer: Retailer, excludeId?: string, limit = 6): Product[] {
  if (retailer === Retailer.Jarir) {
    // Static JSON — no ranked_offers or identity-gated content
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jarirCatalog = require("./data/jarir-catalog.json") as StaticCatalogItem[];
    return jarirCatalog
      .map(toProductFromStatic)
      .filter((p) => p.id !== excludeId)
      .slice(0, limit);
  }

  return MOCK_COMPETITORS
    .filter((p) => p.retailer === retailer && p.id !== excludeId)
    .slice(0, limit);
}

export interface FetchProductsOptions {
  query: string;
  limit?: number;
  /** Send x-k2-mode: 1 header to enable K2 scenario matching */
  k2Mode?: boolean;
  /** Send x-k2-identity: 1 header to enable identity-gated offers */
  hasIdentity?: boolean;
}

export interface FetchProductsResult {
  products: Product[];
  searchTerms: string[];
  /** Clean product description for display (e.g., "paper", "macbook keyboard") */
  productDescription: string;
}

/**
 * Product client that handles fetching, combining, and sorting products
 *
 * 1. Extracts meaningful search terms from the query
 * 2. Fetches products from the Jarir API
 * 3. Combines with mock competitor products
 * 4. Sorts by relevance with Jarir priority
 */
export async function fetchProducts(options: FetchProductsOptions): Promise<FetchProductsResult> {
  const { query, limit = 3, k2Mode, hasIdentity } = options;

  // Extract search terms and product description from the query
  const searchTerms = extractSearchTerms(query);
  const productDescription = extractProductDescription(query);

  // Check if query matches any scenario triggers (for boosting related products)
  const triggerMatch = matchTriggers(query);

  // Send raw query to API for maximum scenario matching fidelity;
  // extractSearchTerms is only used for client-side competitor scoring.
  const searchParam = query ? `&q=${encodeURIComponent(query)}` : "";
  const url = `/api/products?limit=${limit}${searchParam}`;

  // Build headers for K2 mode and identity
  const headers: Record<string, string> = {};
  if (k2Mode) headers["x-k2-mode"] = "1";
  if (hasIdentity) headers["x-k2-identity"] = "1";

  try {
    const response = await fetch(url, Object.keys(headers).length > 0 ? { headers } : undefined);
    if (!response.ok) {
      throw new Error(`Product API returned ${response.status}`);
    }
    const data = await response.json();

    // Convert catalog items to Product
    const jarirProducts: Product[] = (data.items || []).map(toProduct);

    // Filter competitors to only include relevant products (relevance > 0)
    // Uses both search terms and trigger matching for better coverage
    const relevantCompetitorsProducts = (searchTerms.length > 0 || triggerMatch)
      ? MOCK_COMPETITORS.filter(p => calculateRelevance(p, searchTerms, triggerMatch) > 0)
      : MOCK_COMPETITORS;

    // Combine with filtered competitors
    const allProducts = [...jarirProducts, ...relevantCompetitorsProducts];

    // Sort by relevance, then assign tags
    const sortedProducts = sortByRelevance(allProducts, searchTerms, triggerMatch);
    const taggedProducts = tagProducts(sortedProducts);

    return {
      products: taggedProducts,
      searchTerms,
      productDescription,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);

    // Filter competitors to only include relevant products
    const relevantCompetitors = (searchTerms.length > 0 || triggerMatch)
      ? MOCK_COMPETITORS.filter(p => calculateRelevance(p, searchTerms, triggerMatch) > 0)
      : MOCK_COMPETITORS;

    // Return just competitors on error, sorted by relevance
    const sortedCompetitors = sortByRelevance(relevantCompetitors, searchTerms, triggerMatch);
    const taggedCompetitors = tagProducts(sortedCompetitors);

    return {
      products: taggedCompetitors,
      searchTerms,
      productDescription,
    };
  }
}
