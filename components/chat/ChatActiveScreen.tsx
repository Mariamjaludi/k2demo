"use client";

import { useEffect, useRef, useState } from "react";
import { TabRow } from "./TabRow";
import { ActiveChatInput } from "./ActiveChatInput";
import { SimulatedKeyboard } from "./SimulatedKeyboard";
import { SAFE_AREA } from "../DeviceFrame";
import { LoadingIndicator, LoadingPhase } from "./LoadingIndicators";
import { ProductList } from "./ProductList";
import type { ChatMessage } from "@/lib/agentFlow/types";


interface ChatActiveScreenProps {
  queryText: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
  messages?: ChatMessage[];
  onClickTitle?: (id: string) => void;
  onAnimationComplete?: () => void;
}

interface ExpandChevronButtonProps {
  expanded: boolean;
  onToggle: () => void;
}

function truncate(text: string, max = 50) {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
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
  const displayText = !expanded ? truncate(text) : text;

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

function AISummary({ productDescription }: { productDescription?: string }) {
  const summary = productDescription
    ? `Here are several ${productDescription} options that I found.`
    : "Here are several options I found for you.";

  return (
    <div className="pb-3">
      <p className="text-sm leading-relaxed text-zinc-600">
        {summary}
        <span className="ml-1 inline-block text-blue-500">🔗</span>
      </p>
    </div>
  );
}

function ResultsHeader() {
  return (
    <div className="py-3">
      <h2 className="text-base font-semibold text-zinc-900">Top Recommendations</h2>
    </div>
  );
}

function ProductResultMessage({
  message,
  onClickTitle,
}: {
  message: ChatMessage;
  onClickTitle?: (id: string) => void;
}) {
  return (
    <div className="mt-4 px-4 animate-in fade-in duration-300">
      <AISummary productDescription={message.productDescription} />
      <ResultsHeader />
      <ProductList
        products={message.products ?? []}
        onClickTitle={onClickTitle}
      />
    </div>
  );
}

const THINKING_MS = 1800;
const SEARCHING_MS = 4000;
const FADE_MS = 300;
const COMPLETE_DISPLAY_MS = 800;

/**
 * Self-contained loading sequence component.
 * Each mount gets its own Thinking → Searching → Complete lifecycle.
 */
function LoadingSequence({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<LoadingPhase>(LoadingPhase.Thinking);
  const [fadingOut, setFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const transitionTo = (next: LoadingPhase) => {
      setFadingOut(true);
      window.setTimeout(() => {
        setPhase(next);
        requestAnimationFrame(() => setFadingOut(false));
      }, FADE_MS);
    };

    const t1 = window.setTimeout(() => {
      transitionTo(LoadingPhase.Searching);
    }, THINKING_MS);

    const t2 = window.setTimeout(() => {
      transitionTo(LoadingPhase.Complete);
    }, THINKING_MS + SEARCHING_MS);

    const t3 = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, THINKING_MS + SEARCHING_MS + FADE_MS + COMPLETE_DISPLAY_MS);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return <LoadingIndicator loadingPhase={phase} fadingOut={fadingOut} />;
}


export function ChatActiveScreen({
  queryText,
  onQueryChange,
  onSubmit,
  messages = [],
  onClickTitle,
  onAnimationComplete,
}: ChatActiveScreenProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Find the last user message to determine loading state
  const lastUserMessage = messages.findLast((m) => m.role === "user");
  const isLoading =
    !!lastUserMessage &&
    !messages.some((m) => m.role === "agent" && m.products && m.products.length > 0 && m.timestamp > lastUserMessage.timestamp);

  const handleFocus = () => setKeyboardVisible(true);

  const handleSubmit = () => {
    setKeyboardVisible(false);
    onSubmit();
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-white"
      style={{ paddingBottom: SAFE_AREA.bottom }}
    >
      <TabRow loading={isLoading} />

      <div className="content min-h-0 flex-1 overflow-y-auto py-4">
        {/* Render all messages in chronological order */}
        {messages.map((msg) => {
          // Agent message with products → render product list
          if (msg.role === "agent" && msg.products && msg.products.length > 0) {
            return (
              <ProductResultMessage
                key={msg.id}
                message={msg}
                onClickTitle={onClickTitle}
              />
            );
          }

          // User message → query bubble
          if (msg.role === "user") {
            return <QueryBubble key={msg.id} text={msg.content} />;
          }

          // Agent text message (no products)
          if (msg.role === "agent" && msg.content) {
            return (
              <div key={msg.id} className="mb-4 flex justify-start px-4">
                <div className="inline-block max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3">
                  <span className="text-sm text-zinc-800">{msg.content}</span>
                </div>
              </div>
            );
          }

          return null;
        })}

        {isLoading && (
          <LoadingSequence key={lastUserMessage?.id} onComplete={onAnimationComplete} />
        )}
      </div>

      <ActiveChatInput
        value={queryText}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onFocus={handleFocus}
      />

      <SimulatedKeyboard visible={keyboardVisible} />
    </div>
  );
}
