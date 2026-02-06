import { SCENARIOS, type Scenario } from "./scenarios";
import type { Product, K2ResponseBody, ResponseItem, ItemOffer, IncludedItemMeta } from "./types";
import { toPublicProduct, UCP_META } from "./types";
import type { K2DebugLog } from "./debugStore";

export function matchScenario(query: string): Scenario | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  for (const scenario of SCENARIOS) {
    for (const trigger of scenario.triggers) {
      if (normalized.includes(trigger.toLowerCase())) {
        return scenario;
      }
    }
  }
  return null;
}

export function buildScenarioResponse(
  scenario: Scenario,
  catalog: Product[],
  query: string,
  correlationId: string,
): { responseBody: K2ResponseBody; debug: K2DebugLog } {
  const catalogMap = new Map(catalog.map((p) => [p.id, p]));
  const oosRemovals: K2DebugLog["oos_removals"] = [];

  // ── Phase 1: Build response items, filtering OOS ──────────────────
  const responseItems: ResponseItem[] = [];

  // Sort by rank ascending to ensure correct processing order
  const sortedItems = [...scenario.items].sort((a, b) => a.rank - b.rank);

  for (const scenarioItem of sortedItems) {
    const product = catalogMap.get(scenarioItem.sku_id);
    if (!product) {
      oosRemovals.push({
        sku_id: scenarioItem.sku_id,
        type: "item",
        reason: "SKU not found in catalog",
      });
      continue;
    }
    if (!product.availability.in_stock) {
      oosRemovals.push({
        sku_id: scenarioItem.sku_id,
        type: "item",
        reason: "Out of stock",
      });
      continue;
    }

    // Generate unique item_id: sku_id + rank (handles duplicate SKUs at different ranks)
    const itemId = `${scenarioItem.sku_id}_rank_${scenarioItem.rank}`;

    const responseItem: ResponseItem = {
      ...toPublicProduct(product),
      item_id: itemId,
      rank: scenarioItem.rank,
    };

    if (scenarioItem.offer) {
      // Resolve included items, filtering OOS
      const includedItems: IncludedItemMeta[] = [];
      for (const includedSkuId of scenarioItem.offer.included_items) {
        const includedProduct = catalogMap.get(includedSkuId);
        if (!includedProduct) {
          oosRemovals.push({
            sku_id: includedSkuId,
            type: "included_item",
            reason: "Included item SKU not found in catalog",
          });
          continue;
        }
        if (!includedProduct.availability.in_stock) {
          oosRemovals.push({
            sku_id: includedSkuId,
            type: "included_item",
            reason: "Included item out of stock",
          });
          continue;
        }
        includedItems.push({
          sku_id: includedProduct.id,
          title: includedProduct.title,
          brand: includedProduct.brand,
          retail_value: includedProduct.price,
          currency: "SAR",
          image_url: includedProduct.image_url,
        });
      }

      const includedValue = includedItems.reduce((sum, i) => sum + i.retail_value, 0);

      const offer: ItemOffer = {
        included_items: includedItems,
        perks: scenarioItem.offer.perks,
        price_breakdown: {
          items_subtotal: product.price,
          included_value: includedValue,
          discount_total: 0,
          total_price: product.price,
          currency: "SAR",
        },
        ui: scenarioItem.offer.ui,
      };

      responseItem.offer = offer;
    }

    responseItems.push(responseItem);
  }

  // ── Phase 2: Bundle exclusion enforcement ─────────────────────────
  const topLevelIds = new Set(responseItems.map((i) => i.id));
  let bundleExclusionRemovals = 0;
  for (const item of responseItems) {
    if (item.offer) {
      const originalCount = item.offer.included_items.length;
      item.offer.included_items = item.offer.included_items.filter((inc) => {
        if (topLevelIds.has(inc.sku_id)) {
          oosRemovals.push({
            sku_id: inc.sku_id,
            type: "included_item",
            reason: "Bundle exclusion: removed included item that appeared as top-level item",
          });
          bundleExclusionRemovals++;
          return false;
        }
        return true;
      });
      // Recalculate included_value if items were removed
      if (item.offer.included_items.length !== originalCount) {
        const newIncludedValue = item.offer.included_items.reduce((sum, i) => sum + i.retail_value, 0);
        item.offer.price_breakdown.included_value = newIncludedValue;
      }
    }
  }

  // Sort response items by rank ascending
  responseItems.sort((a, b) => a.rank - b.rank);

  // ── Phase 3: Build response body ──────────────────────────────────
  const recommendedItemId = responseItems.length > 0 ? responseItems[0].item_id : null;

  const responseBody: K2ResponseBody = {
    ucp: { version: UCP_META.version, capabilities: UCP_META.capabilities },
    query,
    items: responseItems,
    recommended_item_id: recommendedItemId,
    correlation_id: correlationId,
  };

  // ── Phase 4: Compute debug fields from final response ─────────────
  const candidatePool = scenario.items.map((si) => {
    const p = catalogMap.get(si.sku_id);
    return {
      sku_id: si.sku_id,
      title: p?.title ?? "Unknown",
      in_stock: p?.availability.in_stock ?? false,
    };
  });

  // Compute aggregates from final response (after enforcement)
  const finalTotalIncludedValue = responseItems.reduce(
    (sum, item) => sum + (item.offer?.price_breakdown.included_value ?? 0),
    0,
  );
  // Attach rate = fraction of items with at least one included item
  const itemsWithIncluded = responseItems.filter(
    (item) => (item.offer?.included_items?.length ?? 0) > 0,
  ).length;

  // Build applied_offers from final response
  const appliedOffers: K2DebugLog["applied_offers"] = responseItems
    .filter((item) => item.offer)
    .map((item) => {
      const perkSummary = item.offer!.perks.map((p) => p.type).join(", ");
      const includedSummary = item.offer!.included_items.map((i) => i.title).join(", ");
      return {
        sku_id: item.id,
        rank: item.rank,
        offer_summary:
          [
            includedSummary ? `includes: ${includedSummary}` : null,
            perkSummary ? `perks: ${perkSummary}` : null,
          ]
            .filter(Boolean)
            .join("; ") || "offer with UI only",
      };
    });

  // Build confidence scores
  const confidenceScores = responseItems.map((item) => ({
    sku_id: item.id,
    rank: item.rank,
    confidence: Math.max(0.95 - (item.rank - 1) * 0.1, 0.5),
  }));

  // Compute guardrail check from final response
  const includedIdsInResponse = new Set(
    responseItems.flatMap((i) => i.offer?.included_items.map((x) => x.sku_id) ?? []),
  );
  const bundleExclusionPassed = !responseItems.some((i) => includedIdsInResponse.has(i.id));

  const debug: K2DebugLog = {
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
    detected_scenario: scenario.id,
    candidate_pool: candidatePool,
    ranking_rationale: `Hand-curated scenario: ${scenario.name}. Items ranked by merchant-defined priority.`,
    applied_offers: appliedOffers,
    oos_removals: oosRemovals,
    kpi_deltas: {
      inventory_risk_delta: finalTotalIncludedValue > 0 ? -0.15 : 0,
      attach_rate: responseItems.length > 0 ? itemsWithIncluded / responseItems.length : 0,
      bundle_value_added: finalTotalIncludedValue,
    },
    guardrail_checks: [
      { rule: "discount_total_zero", passed: true, detail: "All offers have discount_total = 0" },
      { rule: "total_price_equals_item_price", passed: true, detail: "total_price equals item retail price in all offers" },
      {
        rule: "bundle_exclusion",
        passed: bundleExclusionPassed,
        detail: bundleExclusionRemovals > 0
          ? `Enforced: removed ${bundleExclusionRemovals} included item(s) that appeared as top-level`
          : "No included items appear as top-level items",
      },
    ],
    confidence_scores: confidenceScores,
    narrative: scenario.narrative,
  };

  return { responseBody, debug };
}
