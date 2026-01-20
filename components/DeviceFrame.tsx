"use client";

import { ReactNode } from "react";

interface DeviceFrameProps {
  children: ReactNode;
  showDynamicIsland?: boolean;
  /** Status bar text color: "dark" for light backgrounds, "light" for dark backgrounds */
  statusBarVariant?: "dark" | "light";
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
      <rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="2" y="3" width="17" height="6" rx="1" fill="currentColor" />
      <path d="M23 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
      <path d="M4.5 7.5c2-2 5-2 7 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M2 5c3.5-3.5 8.5-3.5 12 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M0 2.5c4.5-4.5 11.5-4.5 16 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CellularIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.5" />
      <rect x="5" y="5" width="3" height="7" rx="0.5" />
      <rect x="10" y="2" width="3" height="10" rx="0.5" />
      <rect x="15" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

export function DeviceFrame({
  children,
  showDynamicIsland = true,
  statusBarVariant = "dark"
}: DeviceFrameProps) {
  const statusBarColor = statusBarVariant === "dark" ? "text-zinc-900" : "text-white";

  return (
    <div className="relative h-[700px] w-[375px] overflow-hidden rounded-[40px] border-4 border-zinc-700 bg-black shadow-2xl">
      {/* Full-height viewport container for app screens */}
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-white">
        {/* App content */}
        {children}

        {/* Status bar overlay - inside viewport, over app content */}
        <div className={`pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pb-1 pt-3 ${statusBarColor}`}>
          {/* Left: Time */}
          <span className="text-sm font-semibold">09:41</span>

          {/* Right: Icons */}
          <div className="flex items-center gap-1.5">
            <CellularIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* Dynamic Island overlay - inside viewport, always black */}
        {showDynamicIsland && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
            <div className="h-[22px] w-[90px] rounded-full bg-black" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Safe area constants for consistent spacing across screens */
export const SAFE_AREA = {
  statusBar: 28,  // Height of status bar zone
  topInset: 28,   // Top padding for app content to clear status bar
  bottom: 16,     // Bottom safe area for CTAs
} as const;
