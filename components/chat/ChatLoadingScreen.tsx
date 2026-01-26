"use client";

import { useEffect, useMemo, useState } from "react";
import { PostSendHeader } from "./PostSendHeader";
import { TabRow } from "./TabRow";
import { PostSendComposer } from "./PostSendComposer";
import { ChatMessagesList } from "./ChatMessage";
import { SimulatedKeyboard } from "./SimulatedKeyboard";
import { SAFE_AREA } from "../DeviceFrame";
import { LoadingIndicator, LoadingPhase } from "./LoadingIndicators";
import type { ChatMessage } from "@/lib/agentFlow/types";


interface ChatLoadingScreenProps {
  queryText: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
  messages?: ChatMessage[];
}

interface ExpandChevronButtonProps {
  expanded: boolean;
  onToggle: () => void;
}

function truncate(text: string) {
  return text.slice(0, 47) + "..."
}

function ExpandChevronButton({ expanded, onToggle }: ExpandChevronButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-600"
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
  )
}

function QueryBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text.length > 50;
  const displayText = isTruncated && !expanded ? truncate(text) : text;

  return (
    <div className="mb-4 flex justify-end px-4">
      <div className="inline-flex items-start gap-2 rounded-2xl bg-zinc-100 px-4 py-3">
        <span className="text-sm text-zinc-800">{displayText}</span>
        {isTruncated && (
          <ExpandChevronButton expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        )}
      </div>
    </div>
  );
}

const THINKING_MS = 1800;
const SEARCHING_MS = 5000;
const FADE_MS = 300;


export function ChatLoadingScreen({
  queryText,
  onQueryChange,
  onSubmit,
  messages = [],
}: ChatLoadingScreenProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // ChatLoadingScreen owns the phase machine
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(
    LoadingPhase.Thinking
  );

  const [fadingOut, setFadingOut] = useState(false);

  const lastUserMessageIndex = useMemo(
    () => messages.findLastIndex((m) => m.role === "user"),
    [messages]
  );

  const lastUserText =
    lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex]?.content : "";

  const priorMessages = useMemo(() => {
    if (lastUserMessageIndex < 0) return messages;
    return messages.filter((_, i) => i !== lastUserMessageIndex);
  }, [messages, lastUserMessageIndex]);

  const handleFocus = () => setKeyboardVisible(true);

  const handleSubmit = () => {
    setKeyboardVisible(false);
    onSubmit();
  };

  const transitionTo = (next: LoadingPhase) => {
    setFadingOut(true);

    window.setTimeout(() => {
      setLoadingPhase(next);
      requestAnimationFrame(() => setFadingOut(false));
    }, FADE_MS);
  };

  // Advance Thinking -> Searching -> Complete (demo timeline)
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      transitionTo(LoadingPhase.Searching);
    }, THINKING_MS);

    const t2 = window.setTimeout(() => {
      transitionTo(LoadingPhase.Complete);
    }, THINKING_MS + SEARCHING_MS);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="flex h-full flex-col bg-white"
      style={{ paddingTop: SAFE_AREA.topInset, paddingBottom: SAFE_AREA.bottom }}
    >
      <PostSendHeader />

      <TabRow loading={loadingPhase !== LoadingPhase.Complete} />

      <div className="content flex-1 overflow-y-auto py-4">
        <ChatMessagesList messages={priorMessages} />

        {lastUserText ? <QueryBubble text={lastUserText} /> : null}

        <LoadingIndicator loadingPhase={loadingPhase} fadingOut={fadingOut} />
      </div>

      <PostSendComposer
        value={queryText}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onFocus={handleFocus}
      />

      <SimulatedKeyboard visible={keyboardVisible} />
    </div>
  );
}
