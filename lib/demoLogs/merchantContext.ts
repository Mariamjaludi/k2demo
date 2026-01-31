/**
 * Server-side merchant logging context.
 *
 * Provides session IDs, correlation IDs, and a log emitter for use
 * exclusively inside Next.js route handlers (app/api/*).
 *
 * Uses globalThis to persist state across hot-reloads in dev mode.
 * Logs are stored in a server-side buffer and streamed to the client
 * via SSE (/api/logs/stream).
 */

import type { DemoLogEvent, LogCategory, Json } from "./types";

const GLOBAL_KEY = Symbol.for("__k2_merchant_log_store__");
const MAX_BUFFER = 250;

type LogListener = (event: DemoLogEvent) => void;

interface MerchantLogStore {
  sessionId: string | null;
  buffer: DemoLogEvent[];
  listeners: Set<LogListener>;
  idCounter: number;
}

function getStore(): MerchantLogStore {
  const g = globalThis as unknown as Record<symbol, MerchantLogStore | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      sessionId: null,
      buffer: [],
      listeners: new Set(),
      idCounter: 0,
    };
  }
  return g[GLOBAL_KEY]!;
}

// ─── Session ID ──────────────────────────────────────────────────────────

/** Lazy-init a merchant session ID. One per demo run, reset on clear. */
export function getMerchantSessionId(): string {
  const store = getStore();
  if (!store.sessionId) {
    store.sessionId = `MSESS-${Date.now()}`;
  }
  return store.sessionId;
}

/** Reset session ID and clear the server-side log buffer. */
export function clearMerchantSession(): void {
  const store = getStore();
  store.sessionId = null;
  store.buffer.length = 0;
  store.idCounter = 0;
}

// ─── Correlation ID ──────────────────────────────────────────────────────

/** Generate a unique correlation ID to link a request/response log pair. */
export function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `corr-${crypto.randomUUID()}`;
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ─── Log Emitter ─────────────────────────────────────────────────────────

function generateId(): string {
  const store = getStore();
  store.idCounter += 1;
  return `mlog-${Date.now()}-${store.idCounter}`;
}

export type MerchantEmitLogParams = {
  category: LogCategory;
  event: string;
  message: string;
  correlationId?: string;
  payload?: Json;
  level?: "debug" | "info" | "warn" | "error";
};

/**
 * Emit a merchant log event.
 *
 * Automatically attaches the merchant session ID. If a correlationId is
 * provided it is merged into the payload so request/response pairs are
 * linkable.
 */
export function merchantEmitLog(params: MerchantEmitLogParams): DemoLogEvent {
  const store = getStore();

  // Build payload with optional correlation_id
  let finalPayload: Json | undefined = params.payload;
  if (params.correlationId) {
    const isPlainObject =
      typeof params.payload === "object" &&
      params.payload !== null &&
      !Array.isArray(params.payload);

    if (isPlainObject) {
      finalPayload = { ...(params.payload as Record<string, Json>), correlation_id: params.correlationId };
    } else if (params.payload !== undefined) {
      finalPayload = { correlation_id: params.correlationId, data: params.payload };
    } else {
      finalPayload = { correlation_id: params.correlationId };
    }
  }

  const logEvent: DemoLogEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    category: params.category,
    event: params.event,
    message: params.message,
    session_id: getMerchantSessionId(),
    payload: finalPayload,
    level: params.level ?? "info",
  };

  store.buffer.push(logEvent);
  if (store.buffer.length > MAX_BUFFER) {
    store.buffer.splice(0, store.buffer.length - MAX_BUFFER);
  }

  for (const listener of store.listeners) {
    try {
      listener(logEvent);
    } catch {
      // ignore
    }
  }

  return logEvent;
}

// ─── Subscriptions (for SSE streaming) ───────────────────────────────────

/** Subscribe to new merchant log events. Returns an unsubscribe function. */
export function subscribeMerchantLogs(listener: LogListener): () => void {
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

/** Get a snapshot of all buffered merchant log events. */
export function getMerchantLogSnapshot(): DemoLogEvent[] {
  return [...getStore().buffer];
}
