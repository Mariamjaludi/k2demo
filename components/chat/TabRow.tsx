"use client";

import { GlowBar } from "./LoadingIndicators";

const TABS = [
  { id: "ai_mode", label: "AI Mode", selected: true, hasDropdown: true },
  { id: "all", label: "All", selected: false },
  { id: "images", label: "Images", selected: false },
  { id: "videos", label: "Videos", selected: false },
  { id: "news", label: "News", selected: false },
];

function DropdownCaret() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  );
}

interface TabRowProps {
  loading?: boolean;
}

/** Tab row with AI Mode, All, Images, Videos, News - decorative only */
export function TabRow({ loading = false }: TabRowProps) {
  return (
    <div className="relative">
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-4 px-4 py-2">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              className={`flex shrink-0 items-center whitespace-nowrap text-sm ${
                tab.selected
                  ? "font-semibold text-zinc-900"
                  : "font-normal text-zinc-600"
              }`}
            >
              {tab.label}
              {tab.hasDropdown && <DropdownCaret />}
            </div>
          ))}
        </div>
      </div>
      <GlowBar visible={loading} />
    </div>
  );
}
