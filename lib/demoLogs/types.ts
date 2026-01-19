/**
 * Demo Logging Infrastructure
 *
 * Client-side only, ephemeral logging for the K2 demo split-screen UI.
 * Used to narrate agent actions, K2 reasoning, and merchant API calls
 * in a terminal-style log panel.
 *
 * NOT for production logging or persistence.
 */

export type LogCategory =
  | "ui"        // user actions and client orchestration
  | "agent"       // AI shopping agent actions
  | "k2"          // K2 middleware reasoning/negotiation
  | "merchant"    // Merchant API requests/responses
  | "checkout"    // Checkout session lifecycle
  | "payment"  // mada flow and order confirmation
  | "system";    // System-level events (init, errors)


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type DemoLogEvent = {
  /** Unique identifier for this log entry */
  id: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** High-level category for filtering/styling */
  category: LogCategory;

  /** e.g. "checkout.complete.request"  */
  event: string;

  /** Human-readable action description (e.g., "Searching for products") */
  message: string;

  /** Associated checkout session ID, if applicable */
  session_id?: string;

  /** Arbitrary structured data (request/response bodies, reasoning, etc.) */
  payload?: Json;

  /** logging level for ui styling */
  level?: "debug" | "info" | "warn" | "error";
};
