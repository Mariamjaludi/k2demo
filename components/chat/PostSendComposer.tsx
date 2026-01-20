"use client";

import { useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";

interface PostSendComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const LINE_HEIGHT = 24;
const MAX_ROWS = 4;

export function PostSendComposer({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder = "Ask anything",
  disabled = false,
}: PostSendComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = value.trim().length > 0 && !disabled;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_ROWS;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2">
        {/* Text input */}
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
            maxHeight: `${LINE_HEIGHT * MAX_ROWS}px`,
          }}
        />

        {/* Mic icon */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500"
          aria-label="Voice input"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* Camera/Lens icon */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500"
          aria-label="Camera"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            canSubmit ? "bg-blue-500 text-white" : "bg-zinc-300 text-zinc-400"
          }`}
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
