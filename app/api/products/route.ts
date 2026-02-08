import { NextRequest, NextResponse } from "next/server";
import catalogJson from "@/lib/data/jarir-catalog.json";
import { merchantEmitLog, createCorrelationId } from "@/lib/demoLogs/merchantContext";
import { isK2Enabled } from "@/lib/config/demo";
import { matchScenario, buildScenarioResponse } from "@/lib/k2/scenarioEngine";
import { storeDebugLog } from "@/lib/k2/debugStore";
import { toPublicProduct, UCP_META, type Product, type K2ResponseBody, type ResponseItem } from "@/lib/k2/types";
import type { Json } from "@/lib/demoLogs/types";

const catalog = catalogJson as Product[];

// ── Search helpers ──────────────────────────────────────────────────

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

function searchCatalog(query: string, baseCatalog: Product[]): Product[] {
  if (!query) return baseCatalog;
  const tokens = tokenize(query);
  return baseCatalog
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}

function buildBaselineResponse(
  query: string,
  results: Product[],
  limit: number,
  correlationId: string,
): K2ResponseBody {
  const items = results.slice(0, limit);
  // Recommended item is the first result (closest match to query)
  // Baseline uses product id as item_id (stable, no duplicates)
  const recommendedItemId = items.length > 0 ? items[0].id : null;
  return {
    ucp: { version: UCP_META.version, capabilities: UCP_META.capabilities },
    query: query || "",
    items: items.map((p, i) => ({
      ...toPublicProduct(p),
      item_id: p.id,
      rank: i + 1,
    } as ResponseItem)),
    recommended_item_id: recommendedItemId,
    correlation_id: correlationId,
  };
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const correlationId = createCorrelationId();
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("q") ?? "").toLowerCase();

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

    const k2Mode = isK2Enabled(request);

    if (k2Mode && query) {
      // K2 path
      const scenario = matchScenario(query);

      if (scenario) {
        merchantEmitLog({
          category: "k2",
          event: "k2.intercept",
          message: `Intercepting search: "${query}"`,
          correlationId,
          payload: { query, catalog_size: baseCatalog.length },
        });

        merchantEmitLog({
          category: "k2",
          event: "k2.analyze.catalog",
          message: `Scanning ${baseCatalog.length} SKUs for relevance, inventory levels, margins`,
          correlationId,
          payload: {
            in_stock_count: baseCatalog.filter((p) => p.availability?.in_stock).length,
            categories: [...new Set(baseCatalog.map((p) => p.category))],
          },
        });

        const { responseBody, debug } = buildScenarioResponse(scenario, baseCatalog, query, correlationId);
        responseBody.items = responseBody.items.slice(0, limit);
        storeDebugLog(debug);

        merchantEmitLog({
          category: "k2",
          event: "k2.compute.kpis",
          message: `Computing KPIs: attach rate ${(debug.kpi_deltas.attach_rate * 100).toFixed(0)}%, bundle value SAR ${debug.kpi_deltas.bundle_value_added.toFixed(2)}`,
          correlationId,
          payload: debug.kpi_deltas,
        });

        merchantEmitLog({
          category: "k2",
          event: "k2.assemble.offers",
          message: `Assembled ${responseBody.items.length} ranked items with ${debug.applied_offers.length} value-added offers`,
          correlationId,
          payload: {
            ranked_items: responseBody.items.map((i) => ({ item_id: i.item_id, rank: i.rank, has_offer: !!i.offer })),
            recommended_item_id: responseBody.recommended_item_id,
          },
        });

        merchantEmitLog({
          category: "merchant",
          event: "merchant.products.search.response",
          message: `200 OK — ${responseBody.items.length} item${responseBody.items.length !== 1 ? "s" : ""} returned`,
          correlationId,
          payload: responseBody as unknown as Json,
        });

        return NextResponse.json(responseBody);
      }

      // K2 mode but no match — fall through to baseline search
    }

    // Baseline path (also used for K2 no-match fallback)
    const results = searchCatalog(query, baseCatalog);
    const responseBody = buildBaselineResponse(query, results, limit, correlationId);

    merchantEmitLog({
      category: "merchant",
      event: "merchant.products.search.response",
      message: `200 OK — ${responseBody.items.length} item${responseBody.items.length !== 1 ? "s" : ""} found`,
      correlationId,
      payload: responseBody as unknown as Json,
    });

    return NextResponse.json(responseBody);
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
