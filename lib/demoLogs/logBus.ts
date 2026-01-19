"use client";

import { DemoLogEvent, LogCategory, Json } from "./types";

const MAX_BUFFER_SIZE = 250;

type LogListener = (event: DemoLogEvent) => void;

const buffer: DemoLogEvent[] = [];
const listeners = new Set<LogListener>();

let idCounter = 0;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `log-${Date.now()}-${idCounter}`;
}

export type EmitLogParams = {
  category: LogCategory;
  event: string;
  message: string;
  session_id?: string;
  payload?: Json;
  level?: "debug" | "info" | "warn" | "error";
};

export function emitLog(params: EmitLogParams): DemoLogEvent {
  const logEvent: DemoLogEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    category: params.category,
    event: params.event,
    message: params.message,
    session_id: params.session_id,
    payload: params.payload,
    level: params.level ?? "info",
  };

  buffer.push(logEvent);

  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }

  for (const listener of listeners) {
    try {
      listener(logEvent);
    } catch {
      // ignore
    }
  }

  return logEvent;
}
