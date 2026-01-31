import { Retailer, type Product } from "@/components/product/ProductCard";
import amazonCatalog from "./data/amazon-catalog.json";
import noonCatalog from "./data/noon-catalog.json";
import extraCatalog from "./data/extra-catalog.json";

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
 * Extract meaningful search terms from a user query
 */
function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/[^\p{L}\p{N}]+/gu, ""))
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
 * Calculate relevance score for a product based on search terms
 */
function calculateRelevance(product: Product, searchTerms: string[]): number {
  if (searchTerms.length === 0) return 0;

  let score = 0;
  const titleLower = product.title.toLowerCase();
  const retailerLower = product.retailer.toLowerCase();

  for (const term of searchTerms) {
    if (titleLower.includes(term)) {
      score += 10;
      if (titleLower.split(/\s+/).includes(term)) {
        score += 5;
      }
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
function sortByRelevance(products: Product[], searchTerms: string[]): Product[] {
  if (searchTerms.length === 0) {
    return products;
  }

  const scored = products.map(product => ({
    product,
    relevance: calculateRelevance(product, searchTerms),
    isJarir: product.retailer === Retailer.Jarir,
  }));

  scored.sort((a, b) => {
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    if (a.isJarir !== b.isJarir) {
      return a.isJarir ? -1 : 1;
    }
    return 0;
  });

  return scored.map(s => s.product);
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
    if (lower.includes("today")) return 0;
    if (lower.includes("tomorrow")) return 1;
    if (lower.includes("1–2 days") || lower.includes("1-2 days")) return 2;
    if (lower.includes("2–3 days") || lower.includes("2-3 days")) return 3;
    return 4;
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

    // Jarir products may have bundle offerings
    if (p.retailer === Retailer.Jarir) {
      if (p.category === "office_supplies" || p.category === "school_supplies") {
        tags.push("Best value bundle");
      } else {
        tags.push("Free gift with purchase");
      }
    }

    return { ...p, tags };
  });
}

/** Catalog item shape returned by the /api/products endpoint */
interface CatalogItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: "SAR";
  image_url?: string;
  availability: { in_stock: boolean; stock_level: number };
  delivery: { default_promise: string };
}

/**
 * Convert a catalog item to a Product
 */
function toProduct(item: CatalogItem): Product {
  const rating = 4.5 + Math.random() * 0.4;
  const reviewCount = Math.floor(500 + Math.random() * 2000);

  return {
    id: item.id,
    title: item.title,
    brand: item.brand,
    category: item.category,
    retailer: Retailer.Jarir,
    price: item.price,
    currency: item.currency,
    rating: Math.round(rating * 10) / 10,
    reviewCount,
    image_url: item.image_url,
    availability: item.availability,
    delivery: item.delivery,
  };
}

/**
 * Get products from a specific retailer's catalog (for recommendations).
 * Excludes a given product ID so the selected item isn't recommended to itself.
 */
export function getProductsByRetailer(retailer: Retailer, excludeId?: string, limit = 6): Product[] {
  if (retailer === Retailer.Jarir) {
    // Jarir catalog is loaded via API normally, but we can import it directly for recs
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jarirCatalog = require("./data/jarir-catalog.json") as CatalogItem[];
    return jarirCatalog
      .map(toProduct)
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
  const { query, limit = 3 } = options;

  // Extract search terms and product description from the query
  const searchTerms = extractSearchTerms(query);
  const productDescription = extractProductDescription(query);

  // Build API URL with search term if available
  const searchParam = searchTerms.length > 0 ? `&q=${encodeURIComponent(searchTerms.join(" "))}` : "";
  const url = `/api/products?limit=${limit}${searchParam}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Product API returned ${response.status}`);
    }
    const data = await response.json();

    // Convert catalog items to Product
    const jarirProducts: Product[] = (data.items || []).map(toProduct);

    // Combine with mock competitors
    const allProducts = [...jarirProducts, ...MOCK_COMPETITORS];

    // Sort by relevance, then assign tags
    const sortedProducts = sortByRelevance(allProducts, searchTerms);
    const taggedProducts = tagProducts(sortedProducts);

    return {
      products: taggedProducts,
      searchTerms,
      productDescription,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);

    // Return just competitors on error, sorted by relevance
    const sortedCompetitors = sortByRelevance(MOCK_COMPETITORS, searchTerms);
    const taggedCompetitors = tagProducts(sortedCompetitors);

    return {
      products: taggedCompetitors,
      searchTerms,
      productDescription,
    };
  }
}
