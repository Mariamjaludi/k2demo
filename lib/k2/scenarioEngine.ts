import { SCENARIOS, type Scenario } from "./scenarios";
import type { Product, K2ResponseBody, ResponseItem, RankedOffer, Perk, PerkType, IncludedItemMeta, InternalPerk } from "./types";
import { toPublicProduct, UCP_META } from "./types";
import type { K2DebugLog } from "./debugStore";

// ── Query normalization ───────────────────────────────────────────────

/** Strip Arabic tashkeel (diacritics) and tatweel (kashida) */
const TASHKEEL_AND_TATWEEL = /[\u0610-\u061A\u0640\u064B-\u065F\u0670]/g;

/** Common punctuation in both Latin and Arabic */
const PUNCTUATION = /[؟،؛.,:;!?'"()\[\]{}\-_]/g;

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(TASHKEEL_AND_TATWEEL, "")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Trigger matching ──────────────────────────────────────────────────

/** Precomputed normalized triggers per scenario (built once at module init) */
const NORMALIZED_TRIGGERS: Map<string, string[]> = new Map(
  SCENARIOS.map((s) => [s.id, s.triggers.map(normalizeText)]),
);

export function matchScenario(query: string): Scenario | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;

  for (const scenario of SCENARIOS) {
    const triggers = NORMALIZED_TRIGGERS.get(scenario.id);
    if (!triggers) continue;
    for (const trigger of triggers) {
      if (normalized.includes(trigger)) {
        return scenario;
      }
    }
  }
  return null;
}

// ── Perk mapping ──────────────────────────────────────────────────────

const API_PERK_TYPES: ReadonlySet<PerkType> = new Set<PerkType>([
  "pickup",
  "delivery",
  "assembly",
  "loyalty",
  "raffle",
  "event_invite",
  "variant_option",
]);

type PerkMapResult = { perk: Perk; warning?: string };

/**
 * Maps an internal perk to an API-safe perk.
 * Returns null for unknown/unmappable types (caller should log and drop).
 */
function mapToApiPerk(ip: InternalPerk): PerkMapResult | null {
  if (ip.type === "pickup_optional_paid") {
    return {
      perk: { type: "pickup", title: ip.title, details: { ...ip.details, paid: true } },
    };
  }

  if (ip.type === "pickup") {
    const warning =
      ip.details.price_sar != null || ip.details.paid != null
        ? `Free pickup perk had price/paid fields in details — overridden to paid: false, price_sar: 0`
        : undefined;
    return {
      perk: { type: "pickup", title: ip.title, details: { ...ip.details, paid: false, price_sar: 0 } },
      warning,
    };
  }

  // pickup and pickup_optional_paid handled above; remaining InternalPerkType
  // values are all valid PerkType so the Set check is a runtime guard only.
  if (API_PERK_TYPES.has(ip.type)) {
    return { perk: { type: ip.type, title: ip.title, details: ip.details } };
  }

  // Unknown type — drop it
  return null;
}

// ── Identity gating UI sanitization ───────────────────────────────────

const GIFT_BADGE_PATTERN = /gift|personali[sz]ed|هدية|شخصي/i;

function sanitizeUiForNoIdentity(ui: { title: string; subtitle: string; badges: string[] }): {
  title: string;
  subtitle: string;
  badges: string[];
} {
  return {
    title: ui.title.replace(/\s*[\u2014-]\s*Personali[sz]ed\b/i, ""),
    subtitle: ui.subtitle
      // English gift patterns
      .replace(/\s*\+\s*free\s+book\s+gift[^+]*/i, "")
      .replace(/\s*\(next in your series\)/i, "")
      // Arabic gift patterns
      .replace(/\s*\+\s*هدية[^+]*/i, "")
      .replace(/\s*\(.*?مجان[اً].*?\)/i, "")
      .trim(),
    badges: ui.badges.filter((b) => !GIFT_BADGE_PATTERN.test(b)),
  };
}

// ── Scenario response builder ─────────────────────────────────────────

export function buildScenarioResponse(
  scenario: Scenario,
  catalog: Product[],
  query: string,
  correlationId: string,
  hasIdentity: boolean,
  maxItems?: number,
): { responseBody: K2ResponseBody; debug: K2DebugLog } {
  const catalogMap = new Map(catalog.map((p) => [p.id, p]));
  const itemRemovals: K2DebugLog["item_removals"] = [];
  const appliedOffers: K2DebugLog["applied_offers"] = [];
  const guardrailChecks: K2DebugLog["guardrail_checks"] = [];

  // ── Phase 1: Build one ResponseItem per SKU ──────────────────────
  const responseItems: ResponseItem[] = [];
  const sortedItems = [...scenario.items].sort((a, b) => a.rank - b.rank);

  for (const scenarioItem of sortedItems) {
    const product = catalogMap.get(scenarioItem.sku_id);
    if (!product) {
      itemRemovals.push({
        sku_id: scenarioItem.sku_id,
        type: "item",
        reason_type: "missing",
        reason: "SKU not found in catalog",
      });
      continue;
    }
    if (!product.availability.in_stock) {
      itemRemovals.push({
        sku_id: scenarioItem.sku_id,
        type: "item",
        reason_type: "oos",
        reason: "Out of stock",
      });
      continue;
    }

    const responseItem: ResponseItem = {
      ...toPublicProduct(product),
      item_id: product.id,
      rank: scenarioItem.rank,
    };

    // ── Compile ranked offers ────────────────────────────────────
    if (scenarioItem.ranked_offers && scenarioItem.ranked_offers.length > 0) {
      const rankedOffers: RankedOffer[] = [];

      for (const offerDef of scenarioItem.ranked_offers) {
        const offerId = `${product.id}:offer:${offerDef.rank}`;

        // Identity gating: strip included_items and swap UI when no identity
        const isGatedAndNoIdentity = offerDef.identity_gated === true && !hasIdentity;

        const effectiveIncludedSkuIds = isGatedAndNoIdentity ? [] : offerDef.included_items;

        let effectiveUi = offerDef.ui;
        if (isGatedAndNoIdentity) {
          if (offerDef.identity_absent_ui) {
            effectiveUi = offerDef.identity_absent_ui;
          } else {
            // Auto-sanitize: strip gift/personalization references from UI
            effectiveUi = sanitizeUiForNoIdentity(offerDef.ui);
            guardrailChecks.push({
              rule: "identity_gated_ui_auto_sanitized",
              passed: false,
              detail: `Offer ${offerId}: identity_gated without identity_absent_ui — UI auto-sanitized but authoring defect should be fixed`,
            });
          }
        }

        // Resolve included items, filtering OOS
        const includedItems: IncludedItemMeta[] = [];
        for (const includedSkuId of effectiveIncludedSkuIds) {
          const includedProduct = catalogMap.get(includedSkuId);
          if (!includedProduct) {
            itemRemovals.push({
              sku_id: includedSkuId,
              type: "included_item",
              reason_type: "missing",
              reason: "Included item SKU not found in catalog",
            });
            continue;
          }
          if (!includedProduct.availability.in_stock) {
            itemRemovals.push({
              sku_id: includedSkuId,
              type: "included_item",
              reason_type: "oos",
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

        // Map internal perks to API-safe perks, dropping unknown types
        const apiPerks: Perk[] = [];
        for (const perk of offerDef.perks) {
          const result = mapToApiPerk(perk);
          if (result) {
            apiPerks.push(result.perk);
            if (result.warning) {
              guardrailChecks.push({
                rule: "pickup_free_price_ignored",
                passed: false,
                detail: `Offer ${offerId}: ${result.warning}`,
              });
            }
          } else {
            guardrailChecks.push({
              rule: "unknown_perk_type_dropped",
              passed: false,
              detail: `Offer ${offerId}: dropped perk with unknown type "${perk.type}"`,
            });
          }
        }

        const includedValue = includedItems.reduce((sum, i) => sum + i.retail_value, 0);

        const rankedOffer: RankedOffer = {
          offer_id: offerId,
          rank: offerDef.rank,
          ui: effectiveUi,
          included_items: includedItems,
          perks: apiPerks,
          price_breakdown: {
            items_subtotal: product.price,
            included_value: includedValue,
            discount_total: 0,
            total_price: product.price,
            currency: "SAR",
          },
        };

        rankedOffers.push(rankedOffer);
      }

      rankedOffers.sort((a, b) => a.rank - b.rank);
      responseItem.ranked_offers = rankedOffers;
    }

    responseItems.push(responseItem);
  }

  // ── Phase 2: Sort and apply limit ───────────────────────────────
  responseItems.sort((a, b) => a.rank - b.rank);

  if (maxItems != null && maxItems > 0 && responseItems.length > maxItems) {
    responseItems.length = maxItems;
  }

  // ── Phase 3: Bundle exclusion (uses limited topLevelIds) ──────
  const topLevelIds = new Set(responseItems.map((i) => i.item_id));
  let bundleExclusionRemovals = 0;

  for (const item of responseItems) {
    if (item.ranked_offers) {
      for (const offer of item.ranked_offers) {
        const originalCount = offer.included_items.length;
        offer.included_items = offer.included_items.filter((inc) => {
          if (topLevelIds.has(inc.sku_id)) {
            itemRemovals.push({
              sku_id: inc.sku_id,
              type: "included_item",
              reason_type: "policy",
              reason: "Bundle exclusion: removed included item that appeared as top-level item",
            });
            bundleExclusionRemovals++;
            return false;
          }
          return true;
        });
        if (offer.included_items.length !== originalCount) {
          offer.price_breakdown.included_value = offer.included_items.reduce(
            (sum, i) => sum + i.retail_value,
            0,
          );
        }
      }
    }
  }

  // ── Phase 4: Build applied_offers debug entries ────────────────
  const responseItemBySku = new Map(responseItems.map((i) => [i.item_id, i]));

  for (const scenarioItem of sortedItems) {
    const item = responseItemBySku.get(scenarioItem.sku_id);
    if (!item?.ranked_offers) continue;

    for (const offer of item.ranked_offers) {
      const offerDef = scenarioItem.ranked_offers?.find((od) => od.rank === offer.rank);
      if (!offerDef) continue;

      appliedOffers.push({
        sku_id: item.item_id,
        offer_id: offer.offer_id,
        item_rank: item.rank,
        offer_rank: offer.rank,
        offer_summary:
          [
            offer.included_items.length > 0
              ? `includes: ${offer.included_items.map((i) => i.title).join(", ")}`
              : null,
            offer.perks.length > 0 ? `perks: ${offer.perks.map((p) => p.type).join(", ")}` : null,
          ]
            .filter(Boolean)
            .join("; ") || "offer with UI only",
        reasoning: offerDef.internal.reasoning,
        confidence: offerDef.internal.confidence,
        confidence_explanation: offerDef.internal.confidence_explanation,
        kpi_numbers: offerDef.internal.kpi_numbers,
        data_sources: offerDef.internal.data_sources,
        gated_without_identity: offerDef.identity_gated === true && !hasIdentity,
      });
    }
  }

  // ── Phase 5: Build response body ──────────────────────────────
  const recommended =
    responseItems.length > 0
      ? {
          item_id: responseItems[0].item_id,
          offer_id: responseItems[0].ranked_offers?.[0]?.offer_id ?? null,
        }
      : null;

  const responseBody: K2ResponseBody = {
    ucp: { version: UCP_META.version, capabilities: UCP_META.capabilities },
    query,
    items: responseItems,
    recommended,
    correlation_id: correlationId,
  };

  // ── Phase 6: Debug log ────────────────────────────────────────
  const candidatePool = scenario.items.map((si) => {
    const p = catalogMap.get(si.sku_id);
    return {
      sku_id: si.sku_id,
      title: p?.title ?? "Unknown",
      in_stock: p?.availability.in_stock ?? false,
    };
  });

  const totalIncludedValue = responseItems.reduce(
    (sum, item) =>
      sum + (item.ranked_offers?.reduce((s, o) => s + o.price_breakdown.included_value, 0) ?? 0),
    0,
  );

  const itemsWithIncluded = responseItems.filter(
    (item) => item.ranked_offers?.some((o) => o.included_items.length > 0) ?? false,
  ).length;

  const bundleExclusionPassed = !responseItems.some(
    (item) =>
      item.ranked_offers?.some((o) =>
        o.included_items.some((inc) => topLevelIds.has(inc.sku_id)),
      ) ?? false,
  );

  guardrailChecks.push(
    {
      rule: "discount_total_zero",
      passed: true,
      detail: "All offers have discount_total = 0",
    },
    {
      rule: "total_price_equals_item_price",
      passed: true,
      detail: "total_price equals item retail price in all offers",
    },
    {
      rule: "bundle_exclusion",
      passed: bundleExclusionPassed,
      detail:
        bundleExclusionRemovals > 0
          ? `Enforced: removed ${bundleExclusionRemovals} included item(s) that appeared as top-level`
          : "No included items appear as top-level items",
    },
  );

  const debug: K2DebugLog = {
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
    detected_scenario: scenario.id,
    candidate_pool: candidatePool,
    ranking_rationale: `Hand-curated scenario: ${scenario.name}. Items ranked by merchant-defined priority.`,
    applied_offers: appliedOffers,
    item_removals: itemRemovals,
    kpi_deltas: {
      inventory_risk_delta: totalIncludedValue > 0 ? -0.15 : 0,
      attach_rate: responseItems.length > 0 ? itemsWithIncluded / responseItems.length : 0,
      bundle_value_added: totalIncludedValue,
    },
    guardrail_checks: guardrailChecks,
    narrative: scenario.narrative,
    response_payload_sent: structuredClone(responseBody),
  };

  return { responseBody, debug };
}
