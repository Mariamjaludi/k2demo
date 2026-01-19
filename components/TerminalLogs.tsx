"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DemoLogEvent, LogCategory } from "@/lib/demoLogs/types";
import { subscribeLogs, getLogSnapshot, clearLogs, MAX_BUFFER_SIZE } from "@/lib/demoLogs/logBus";

const CATEGORY_COLORS: Record<LogCategory, string> = {
  ui: "text-purple-400",
  agent: "text-blue-400",
  k2: "text-yellow-400",
  merchant: "text-cyan-400",
  checkout: "text-green-400",
  payment: "text-pink-400",
  system: "text-zinc-500",
};


const LEVEL_COLORS: Record<NonNullable<DemoLogEvent["level"]>, string>  = {
  debug: "text-zinc-500",
  info: "text-zinc-300",
  warn: "text-yellow-400",
  error: "text-red-400",
};

function LogEntry({ log, isExpanded, onToggle }: {
  log: DemoLogEvent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const categoryColor = CATEGORY_COLORS[log.category] || "text-zinc-400";
  const levelColor = LEVEL_COLORS[log.level || "info"] || "text-zinc-300";
  const hasPayload = log.payload !== undefined;

  return (
    <div className="group border-b border-zinc-800/50 py-1.5 hover:bg-zinc-800/30">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-zinc-600">{time}</span>
        <span className={`shrink-0 w-20 ${categoryColor}`}>[{log.category}]</span>
        <span className={`flex-1 ${levelColor}`}>{log.message}</span>
        {hasPayload && (
          <button
            onClick={onToggle}
            className="shrink-0 px-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        )}
      </div>
      {hasPayload && isExpanded && (
        <pre className="mt-1 ml-[7.5rem] overflow-x-auto rounded bg-zinc-800/50 p-2 text-xs text-zinc-400">
          {JSON.stringify(log.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function TerminalLogs() {
  const [logs, setLogs] = useState<DemoLogEvent[]>(() => getLogSnapshot());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Subscribe for live events (with trimming to prevent unbounded growth)
  useEffect(() => {
    const unsubscribe = subscribeLogs((event) => {
      setLogs((prev) => {
        const next = [...prev, event];
        return next.length > MAX_BUFFER_SIZE ? next.slice(-MAX_BUFFER_SIZE) : next;
      });
    });

    return unsubscribe;
  }, []);

  // Prune expandedIds when logs are trimmed
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync of derived state
    setExpandedIds((prev) => {
      if (prev.size === 0) return prev;

      const currentIds = new Set(logs.map((l) => l.id));
      let changed = false;

      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) next.add(id);
        else changed = true;
      }

      return changed ? next : prev;
    });
  }, [logs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldAutoScroll.current = isAtBottom;
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    clearLogs();
    setLogs([]);
    setExpandedIds(new Set());
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="ml-2 flex-1 text-xs text-zinc-500">K2 Demo Logs</span>
        <button
          onClick={handleClear}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      </div>

      {/* Terminal content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-500">
            <p className="text-green-400">$ k2-demo --start</p>
            <p className="mt-2 text-zinc-400">[system] Initializing K2 Demo...</p>
            <p className="text-zinc-400">[system] Merchant: Jarir</p>
            <p className="text-zinc-400">[system] Ready for agent interactions</p>
            <p className="mt-4 text-zinc-600">─────────────────────────────────</p>
            <p className="mt-4 text-zinc-500">Waiting for events...</p>
          </div>
        ) : (
          logs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              isExpanded={expandedIds.has(log.id)}
              onToggle={() => toggleExpand(log.id)}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-500">
        <span>{logs.length} events</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Connected
        </span>
      </div>
    </div>
  );
}
