import { NextRequest, NextResponse } from "next/server";
import catalog from "@/lib/data/jarir-catalog.json";
import { merchantEmitLog, createCorrelationId } from "@/lib/demoLogs/merchantContext";

type Product = (typeof catalog)[number];

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,.;:/()]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function scoreProduct(product: Product, tokens: string[]): number {
  let score = 0;
  const title = product.title.toLowerCase();
  const brand = product.brand.toLowerCase();
  const category = product.category.toLowerCase().replace(/_/g, " ");

  for (const token of tokens) {
    if (brand.includes(token)) score += 3;
    if (title.includes(token)) score += 2;
    if (category.includes(token)) score += 1;
  }

  return score;
}


const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const correlationId = createCorrelationId();
  const searchParams = request.nextUrl.searchParams
  const query = (searchParams.get("q") ?? "").toLowerCase()

  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const includeOOS = searchParams.get("include_oos") === "1";

  merchantEmitLog({
    category: "agent",
    event: "agent.products.search.request",
    message: `GET /api/products${query ? `?q=${query}` : ""}`,
    correlationId,
    payload: { method: "GET", query: query || null, limit, include_oos: includeOOS },
  });

  try {
    const baseCatalog = includeOOS
      ? catalog
      : catalog.filter((p) => p.availability?.in_stock);

    let results: Product[];

    if (!query) {
      results = baseCatalog;
    } else {
      const tokens = tokenize(query)
      results = baseCatalog
        .map((product) => ({ product, score: scoreProduct(product, tokens) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ product }) => product);
    }

    const items = results.slice(0, limit);

    merchantEmitLog({
      category: "merchant",
      event: "merchant.products.search.response",
      message: `200 OK — ${items.length} product${items.length !== 1 ? "s" : ""} found`,
      correlationId,
      payload: { status: 200, count: items.length },
    });

    return NextResponse.json({
      query: query || null,
      count: items.length,
      items
    });
  } catch (error) {
    merchantEmitLog({
      category: "merchant",
      event: "merchant.products.search.error",
      message: `500 Internal Server Error`,
      level: "error",
      correlationId,
      payload: { error: error instanceof Error ? error.message : "Unknown error" },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
