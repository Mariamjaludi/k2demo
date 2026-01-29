"use client";

import { useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

interface IdleChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onClear?: () => void;
  placeholder?: string;
  maxRows?: number;
  disabled?: boolean;
}

const LINE_HEIGHT = 24; // px per line
const MIN_ROWS = 1;

export function IdleChatInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  onClear,
  placeholder = "Message",
  maxRows = 5,
  disabled = false,
}: IdleChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = value.trim().length > 0 && !disabled;
  const showClear = value.length > 0;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to calculate scrollHeight
    textarea.style.height = "auto";

    const minHeight = LINE_HEIGHT * MIN_ROWS;
    const maxHeight = LINE_HEIGHT * maxRows;
    const scrollHeight = textarea.scrollHeight;

    textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
  }, [maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };
  const handleClear = () => {
    onChange("");
    onClear?.();
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="px-3 pb-2">
      {/* Composer card */}
      <div className="rounded-2xl bg-zinc-100 px-4 py-3">
        {/* Text input area */}
        <div className="relative flex items-start gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-base leading-6 text-zinc-900 placeholder-zinc-400 outline-none"
            style={{
              minHeight: `${LINE_HEIGHT}px`,
              maxHeight: `${LINE_HEIGHT * maxRows}px`,
            }}
          />

          {/* Clear button */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-400 text-white"
              aria-label="Clear input"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Plus button */}
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
            {/* Mic button */}
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-zinc-500"
              aria-label="Voice input"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Camera button */}
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-zinc-500"
              aria-label="Camera"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                canSubmit
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-300 text-zinc-400"
              }`}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
