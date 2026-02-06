"use client";

import { useEffect, useState } from "react";
import { clearLogs } from "@/lib/demoLogs/logBus";

type MerchantMode = "baseline" | "k2";

export function DemoControlBar() {
  const [mode, setMode] = useState<MerchantMode>("baseline");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch("/api/demo/mode")
      .then((r) => r.json())
      .then((data) => setMode(data.mode))
      .catch(() => {});
  }, []);

  const toggleMode = async () => {
    if (switching) return;
    const prev = mode;
    const next: MerchantMode = mode === "baseline" ? "k2" : "baseline";

    // Optimistic update
    setMode(next);
    setSwitching(true);

    try {
      const res = await fetch("/api/demo/mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = await res.json();
      // Sync with server response (should match)
      if (data.mode !== next) {
        setMode(data.mode);
      }
    } catch {
      // Revert on error
      setMode(prev);
    } finally {
      setSwitching(false);
    }
  };

  const handleClear = () => {
    clearLogs();
    fetch("/api/logs/clear", { method: "POST" }).catch(() => {});
  };

  const isK2 = mode === "k2";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2">
      <button
        onClick={toggleMode}
        disabled={switching}
        className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
          isK2
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-zinc-600 text-zinc-300 hover:bg-zinc-500"
        } disabled:opacity-50`}
      >
        {isK2 ? "K2 ON" : "K2 OFF"}
      </button>
      <div className="mx-1 h-4 w-px bg-zinc-600" />
      <span className="text-xs text-zinc-400">
        {isK2 ? "K2 enabled" : "Baseline mode — standard catalog responses"}
      </span>
      <div className="flex-1" />
      <button
        onClick={handleClear}
        className="rounded bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-500"
      >
        Clear Logs
      </button>
    </div>
  );
}
