import type { Product } from "./agentFlow/types";
import type { ProductCardData } from "@/components/chat/ProductCard";

// Mock competitor data - these would come from competitor APIs in production
const MOCK_COMPETITORS: ProductCardData[] = [
  {
    id: "comp_amazon_1",
    title: "AmazonBasics Copy Paper A4 – 500 Sheets",
    retailer: "Amazon.sa",
    price: 28,
    currency: "SAR",
    rating: 4.6,
    reviewCount: 3200,
    reviewSummary:
      "Customers highlight the **consistent quality** and **smooth printing performance** across inkjet and laser printers.",
    featureSummary:
      "Features **92 brightness rating** and **20lb weight**, compatible with all standard office equipment.",
  },
  {
    id: "comp_noon_1",
    title: "Double A Premium Paper A4 – 500 Sheets",
    retailer: "Noon",
    price: 32,
    currency: "SAR",
    rating: 4.7,
    reviewCount: 1850,
    reviewSummary:
      "Reviewers praise the **jam-free performance** and **professional finish** for important documents.",
    featureSummary:
      "Made from **sustainable farmed trees** with **high opacity** to prevent show-through on double-sided prints.",
  },
  {
    id: "comp_extra_1",
    title: "Navigator Universal Paper A4 – 500 Sheets",
    retailer: "Extra",
    price: 35,
    currency: "SAR",
    rating: 4.5,
    reviewCount: 920,
    reviewSummary:
      "Users appreciate the **ultra-smooth surface** and **excellent color reproduction** for presentations.",
    featureSummary:
      "Premium **169 CIE whiteness** paper with **Colorlok technology** for faster drying and bolder colors.",
  },
];

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
function calculateRelevance(product: ProductCardData, searchTerms: string[]): number {
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
function sortByRelevance(products: ProductCardData[], searchTerms: string[]): ProductCardData[] {
  if (searchTerms.length === 0) {
    return products;
  }

  const scored = products.map(product => ({
    product,
    relevance: calculateRelevance(product, searchTerms),
    isJarir: product.isJarir ?? false,
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

  const deliveryHighlight = defaultPromise.includes("tomorrow")
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
    `Features ${deliveryHighlight} and **quality guarantee** from Jarir.`
  );
}

/**
 * Convert a Jarir Product to ProductCardData
 */
function toProductCardData(product: Product): ProductCardData {
  const rating = 4.5 + Math.random() * 0.4;
  const reviewCount = Math.floor(500 + Math.random() * 2000);

  return {
    id: product.id,
    title: product.title,
    retailer: "Jarir",
    price: product.price,
    currency: product.currency,
    rating: Math.round(rating * 10) / 10,
    reviewCount,
    imageUrl: product.image_url,
    reviewSummary: generateReviewSummary(product),
    featureSummary: generateFeatureSummary(product),
    isJarir: true,
  };
}

export interface FetchProductsOptions {
  query: string;
  limit?: number;
}

export interface FetchProductsResult {
  products: ProductCardData[];
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

    // Convert Jarir products to card data
    const jarirProducts: ProductCardData[] = (data.items || []).map(toProductCardData);

    // Combine with mock competitors
    const allProducts = [...jarirProducts, ...MOCK_COMPETITORS];

    // Sort by relevance
    const sortedProducts = sortByRelevance(allProducts, searchTerms);

    return {
      products: sortedProducts,
      searchTerms,
      productDescription,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);

    // Return just competitors on error, sorted by relevance
    const sortedCompetitors = sortByRelevance(MOCK_COMPETITORS, searchTerms);

    return {
      products: sortedCompetitors,
      searchTerms,
      productDescription,
    };
  }
}
