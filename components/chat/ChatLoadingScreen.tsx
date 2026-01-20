"use client";

import { useState } from "react";
import { PostSendHeader } from "./PostSendHeader";
import { TabRow } from "./TabRow";
import { PostSendComposer } from "./PostSendComposer";
import { ChatMessagesList } from "./ChatMessage";
import { SimulatedKeyboard } from "./SimulatedKeyboard";
import { SAFE_AREA } from "../DeviceFrame";
import type { ChatMessage } from "@/lib/agentFlow/types";

interface ChatLoadingScreenProps {
  lastQuery: string;
  queryText: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
  messages?: ChatMessage[];
}

function QueryBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text.length > 50;
  const displayText = isTruncated && !expanded ? text.slice(0, 47) + "..." : text;

  return (
    <div className="flex justify-end px-4 mb-4">
      <div className="inline-flex items-start gap-2 rounded-2xl bg-zinc-100 px-4 py-3">
        <span className="text-sm text-zinc-800">{displayText}</span>
        {isTruncated && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-zinc-400 hover:text-zinc-600"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SearchingIndicator() {
  return (
    <div className="mx-4 flex items-center gap-2">
      <span className="text-sm text-zinc-600">Searching</span>
      {/* Animated dots with brand colors */}
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 animate-bounce rounded-full bg-red-500" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 animate-bounce rounded-full bg-yellow-500" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

export function ChatLoadingScreen({
  lastQuery,
  queryText,
  onQueryChange,
  onSubmit,
  messages = [],
}: ChatLoadingScreenProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Show messages except the last user message (which is shown in QueryBubble)
  // Find last user message index and exclude it, don't blindly slice
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");
  const priorMessages = messages.filter((_, i) => i !== lastUserMessageIndex);

  const handleFocus = () => {
    setKeyboardVisible(true);
  };

  const handleSubmit = () => {
    setKeyboardVisible(false);
    onSubmit();
  };

  return (
    <div
      className="flex h-full flex-col bg-white"
      style={{ paddingTop: SAFE_AREA.topInset, paddingBottom: SAFE_AREA.bottom }}
    >
      {/* Post-send header */}
      <PostSendHeader />

      {/* Tab row */}
      <TabRow />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Prior messages */}
        <ChatMessagesList messages={priorMessages} />

        {/* Query bubble (current query being processed) */}
        <QueryBubble text={lastQuery} />

        {/* Searching indicator */}
        <SearchingIndicator />
      </div>

      {/* Post-send composer */}
      <PostSendComposer
        value={queryText}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onFocus={handleFocus}
      />

      {/* Simulated keyboard */}
      <SimulatedKeyboard visible={keyboardVisible} />
    </div>
  );
}
