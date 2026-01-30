"use client";

import { useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

interface ChatInputProps {
  variant: "idle" | "active";
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onClear?: () => void;
  placeholder?: string;
  maxRows?: number;
  disabled?: boolean;
}

const LINE_HEIGHT = 24;
const DEFAULT_MAX_ROWS_IDLE = 5;
const DEFAULT_MAX_ROWS_ACTIVE = 4;

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SendButton({ canSubmit, onClick }: { canSubmit: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canSubmit}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        canSubmit ? "bg-blue-500 text-white" : "bg-zinc-300 text-zinc-400"
      }`}
      aria-label="Send message"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
      </svg>
    </button>
  );
}

export function ChatInput({
  variant,
  value,
  onChange,
  onSubmit,
  onFocus,
  onClear,
  placeholder,
  maxRows,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isIdle = variant === "idle";
  const resolvedMaxRows = maxRows ?? (isIdle ? DEFAULT_MAX_ROWS_IDLE : DEFAULT_MAX_ROWS_ACTIVE);
  const resolvedPlaceholder = placeholder ?? (isIdle ? "Message" : "Ask anything");
  const canSubmit = value.trim().length > 0 && !disabled;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT * resolvedMaxRows;
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, LINE_HEIGHT), maxHeight)}px`;
  }, [resolvedMaxRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  const handleClear = () => {
    onChange("");
    onClear?.();
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (canSubmit) onSubmit();
  };

  if (isIdle) {
    const showClear = value.length > 0;

    return (
      <div className="px-3 pb-2">
        <div className="rounded-2xl bg-zinc-100 px-4 py-3">
          <div className="relative flex items-start gap-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder={resolvedPlaceholder}
              disabled={disabled}
              rows={1}
              className="flex-1 resize-none bg-transparent text-base leading-6 text-zinc-900 placeholder-zinc-400 outline-none"
              style={{
                minHeight: `${LINE_HEIGHT}px`,
                maxHeight: `${LINE_HEIGHT * resolvedMaxRows}px`,
              }}
            />

            {showClear && (
              <button
                type="button"
                onClick={handleClear}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-400 text-white"
                aria-label="Clear input"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center text-zinc-500"
                aria-label="Add attachment"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center text-zinc-500"
                aria-label="Voice input"
              >
                <MicIcon />
              </button>

              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center text-zinc-500"
                aria-label="Camera"
              >
                <CameraIcon />
              </button>

              <SendButton canSubmit={canSubmit} onClick={handleSubmit} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active variant
  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-base leading-6 text-zinc-900 placeholder-zinc-400 outline-none"
          style={{
            minHeight: `${LINE_HEIGHT}px`,
            maxHeight: `${LINE_HEIGHT * resolvedMaxRows}px`,
          }}
        />

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500"
          aria-label="Voice input"
        >
          <MicIcon />
        </button>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500"
          aria-label="Camera"
        >
          <CameraIcon />
        </button>

        <SendButton canSubmit={canSubmit} onClick={handleSubmit} />
      </div>
    </div>
  );
}
