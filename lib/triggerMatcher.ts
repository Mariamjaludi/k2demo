import { SCENARIOS } from "./k2/scenarios";

export type TriggerMatch = {
  scenarioId: string;
  categories: string[];
  types: string[];
};

/**
 * Mapping from scenario IDs to the product categories and types they cover.
 * Used to boost competitor products that match a triggered scenario.
 */
const SCENARIO_PRODUCT_MAPPING: Record<string, { categories: string[]; types: string[] }> = {
  childrens_art_supplies: {
    categories: ["arts_crafts", "art_supplies"],
    types: ["marker_set", "markers", "crayons", "pen_set"],
  },
  back_to_school_backpacks: {
    categories: ["school_supplies", "bags"],
    types: ["backpack", "school_bag"],
  },
  office_chairs: {
    categories: ["home_office", "office_furniture", "furniture"],
    types: ["office_chair", "chair", "executive_chair"],
  },
  gaming_console_ps5: {
    categories: ["gaming_consoles", "gaming", "electronics"],
    types: ["gaming_console", "console"],
  },
  arabic_novel: {
    categories: ["arabic_books", "books"],
    types: ["book", "novel"],
  },
};

/**
 * Normalize a query string for matching (lowercase, trim).
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * Check if any scenario trigger matches the query.
 * Returns the first matching scenario's product mapping, or null if no match.
 */
export function matchTriggers(query: string): TriggerMatch | null {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  for (const scenario of SCENARIOS) {
    for (const trigger of scenario.triggers) {
      const triggerLower = trigger.toLowerCase();
      const regex = new RegExp(`\b${triggerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\  for (const scenario of SCENARIOS) {
    for (const trigger of scenario.triggers) {
      if (normalized.includes(trigger.toLowerCase())) {
        const mapping = SCENARIO_PRODUCT_MAPPING[scenario.id];
        if (mapping) {
          return {
            scenarioId: scenario.id,
            categories: mapping.categories,
            types: mapping.types,
          };
        }
      }
    }
  }')}\b`);
      if (regex.test(normalized)) {
        const mapping = SCENARIO_PRODUCT_MAPPING[scenario.id];
        if (mapping) {
          return {
            scenarioId: scenario.id,
            categories: mapping.categories,
            types: mapping.types,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if a product matches a trigger's categories or types.
 */
export function productMatchesTrigger(
  category: string,
  type: string | undefined,
  triggerMatch: TriggerMatch
): boolean {
  const categoryLower = category.toLowerCase().replace(/_/g, " ");
  const typeLower = (type || "").toLowerCase().replace(/_/g, " ");

  // Check if product category matches any of the trigger's categories
  for (const cat of triggerMatch.categories) {
    const catNormalized = cat.toLowerCase().replace(/_/g, " ");
    if (categoryLower.includes(catNormalized) || catNormalized.includes(categoryLower)) {
      return true;
    }
  }

  // Check if product type matches any of the trigger's types
  if (typeLower) {
    for (const t of triggerMatch.types) {
      const tNormalized = t.toLowerCase().replace(/_/g, " ");
      if (typeLower.includes(tNormalized) || tNormalized.includes(typeLower)) {
        return true;
      }
    }
  }

  return false;
}
