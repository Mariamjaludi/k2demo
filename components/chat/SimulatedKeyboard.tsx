"use client";

interface SimulatedKeyboardProps {
  visible: boolean;
}

function KeyboardKey({ label, flex, className }: { label: string; flex?: number; className?: string }) {
  const isSpecial = ["shift", "delete", "123", "emoji", "return"].includes(label);

  return (
    <div
      className={`flex h-11 items-center justify-center rounded-md shadow-sm ${
        isSpecial ? "bg-zinc-300" : "bg-white"
      } ${className ?? ""}`}
      style={{ flex: flex ?? 1 }}
    >
      {label === "shift" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ) : label === "delete" ? (
        <svg width="22" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 3H7l-6 6 6 6h15a1 1 0 001-1V4a1 1 0 00-1-1z" />
          <line x1="18" y1="6" x2="12" y2="12" />
          <line x1="12" y1="6" x2="18" y2="12" />
        </svg>
      ) : label === "emoji" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ) : label === "123" ? (
        <span className="text-sm font-medium text-zinc-800">123</span>
      ) : label === "return" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 10l-5 5 5 5" />
          <path d="M20 4v7a4 4 0 01-4 4H4" />
        </svg>
      ) : label === "space" ? (
        null
      ) : (
        <span className="text-xl text-zinc-900">{label}</span>
      )}
    </div>
  );
}

export function SimulatedKeyboard({ visible }: SimulatedKeyboardProps) {
  if (!visible) return null;

  return (
    <div className="bg-zinc-200 px-1 pb-5 pt-2">
      {/* Suggestion bar */}
      <div className="mb-2 flex items-center gap-1 px-1">
        {/* Grid icon */}
        <div className="flex h-9 w-9 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-zinc-600">
            <rect x="1" y="1" width="7" height="7" rx="1.5" />
            <rect x="12" y="1" width="7" height="7" rx="1.5" />
            <rect x="1" y="12" width="7" height="7" rx="1.5" />
            <rect x="12" y="12" width="7" height="7" rx="1.5" />
          </svg>
        </div>

        {/* GIF */}
        <div className="flex h-9 w-10 items-center justify-center">
          <span className="text-sm font-semibold text-zinc-600">GIF</span>
        </div>

        {/* Image icon */}
        <div className="flex h-9 w-9 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        {/* Settings gear */}
        <div className="flex h-9 w-9 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>

        {/* More dots */}
        <div className="flex h-9 w-9 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-600">
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <circle cx="5" cy="12" r="2" />
          </svg>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Microphone */}
        <div className="flex h-9 w-9 items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      </div>

      {/* Keyboard rows */}
      <div className="flex flex-col gap-1.5 px-0.5">
        {/* Row 1: q-p */}
        <div className="flex gap-1">
          {["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((key) => (
            <KeyboardKey key={key} label={key} />
          ))}
        </div>

        {/* Row 2: a-l (with side padding) */}
        <div className="flex gap-1 px-4">
          {["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((key) => (
            <KeyboardKey key={key} label={key} />
          ))}
        </div>

        {/* Row 3: shift, z-m, delete */}
        <div className="flex gap-1 px-0.5">
          <KeyboardKey label="shift" flex={1.2} />
          {["z", "x", "c", "v", "b", "n", "m"].map((key) => (
            <KeyboardKey key={key} label={key} />
          ))}
          <KeyboardKey label="delete" flex={1.2} />
        </div>

        {/* Row 4: 123, emoji, space, return */}
        <div className="flex gap-1.5">
          <KeyboardKey label="123" flex={1.2} />
          <KeyboardKey label="emoji" flex={1} />
          <KeyboardKey label="space" flex={5} className="bg-white" />
          <KeyboardKey label="return" flex={1.5} />
        </div>
      </div>
    </div>
  );
}
