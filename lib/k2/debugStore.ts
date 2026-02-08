export type K2DebugLog = {
  correlation_id: string;
  timestamp: string;
  detected_scenario: string | null;
  candidate_pool: { sku_id: string; title: string; in_stock: boolean }[];
  ranking_rationale: string;
  applied_offers: {
    sku_id: string;
    offer_id: string;
    item_rank: number;
    offer_rank: number;
    offer_summary: string;
    reasoning: string;
    confidence: number;
    confidence_explanation: string;
    kpi_numbers: Record<string, number>;
    data_sources: Array<{ name: string; freshness_minutes: number }>;
    gated_without_identity: boolean;
  }[];
  item_removals: {
    sku_id: string;
    type: "item" | "included_item";
    reason_type: "oos" | "missing" | "policy";
    reason: string;
  }[];
  kpi_deltas: { inventory_risk_delta: number; attach_rate: number; bundle_value_added: number };
  guardrail_checks: { rule: string; passed: boolean; detail: string }[];
  narrative: string;
  response_payload_sent: unknown;
};

const MAX_ENTRIES = 50;

const g = globalThis as unknown as { __k2DebugLogs?: Map<string, K2DebugLog> };

function getStore(): Map<string, K2DebugLog> {
  if (!g.__k2DebugLogs) {
    g.__k2DebugLogs = new Map();
  }
  return g.__k2DebugLogs;
}

export function storeDebugLog(log: K2DebugLog): void {
  const store = getStore();
  // Only evict if this is a new entry and we're at capacity
  if (!store.has(log.correlation_id) && store.size >= MAX_ENTRIES) {
    // FIFO eviction — delete the oldest entry
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) {
      store.delete(firstKey);
    }
  }
  store.set(log.correlation_id, log);
}

export function getDebugLog(correlationId: string): K2DebugLog | undefined {
  return getStore().get(correlationId);
}
