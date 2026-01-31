"use client";

import { useEffect, useState, type CSSProperties } from "react";

// Badge data - Jarir plus competitors
const SOURCE_BADGES = [
  { id: "jarir", name: "Jarir", color: "#fff", textColor: "#fff", logo: "/jarirLogo.svg" },
  { id: "amazon", name: "Amazon", color: "#ff9900", textColor: "#000", logo: "/amazonLogo.svg" },
  { id: "noon", name: "Noon", color: "#feee00", textColor: "#000", logo: "/noonLogo.svg" },
  { id: "extra", name: "Extra", color: "#fff", textColor: "#fff", logo: "/extraLogo.svg" },
  { id: "lulu", name: "Lulu", color: "#fff", textColor: "#fff", logo: "/luluLogo.svg" },
];

export enum LoadingPhase {
  Thinking = "thinking",
  Searching = "searching",
  Complete = "complete"
}

/**
 * Soft glow bar that sits under the tab row during loading.
 * Displays a gradient through Google-like colors (red, yellow, green, blue).
 */
export function GlowBar() {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-full z-0 h-5 overflow-visible">
      {/* Grey gradient base that fades to white */}
      <div
        className="absolute inset-x-4 top-0 h-3"
        style={{
          background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(180,180,180,0.4) 0%, rgba(200,200,200,0.2) 40%, transparent 70%)",
        }}
      />
      {/* Colored glow band - centered with blur fading down */}
      <div
        className="absolute left-1/2 top-0 h-2 w-3/4 -translate-x-1/2 animate-glow-color-fade"
        style={{
          opacity: 0.55,
          filter: "blur(12px)",
          maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Single circular badge with initial letter or logo
 */
function SourceBadge({
  badge,
  size = 20,
  className = "",
  zIndex = 0,
}: {
  badge: (typeof SOURCE_BADGES)[number];
  size?: number;
  className?: string;
  zIndex?: number;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold shadow-sm ring-1 ring-black/10 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: badge.color,
        color: badge.textColor,
        fontSize: size * 0.45,
        zIndex,
      }}
    >
      {badge.logo ? (
        <div className="flex h-full w-full items-center justify-center p-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.logo}
            alt={badge.name}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        badge.name[0]
      )}
    </div>
  );
}

/**
 * "Thinking" text where each character animates opacity in a left-to-right wave.
 */
export function ThinkingPhase({ visible = true }: { visible?: boolean }) {
  const text = "Thinking";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className={`flex items-center px-4 py-2 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"
        }`}
    >
      <span className="text-sm text-zinc-500" aria-label="Thinking">
        {text.split("").map((char, i) => (
          <span
            key={i}
            className={mounted ? "animate-thinking-wave" : ""}
            style={{
              animationDelay: `${i * 100}ms`,
              display: "inline-block",
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}

/**
 * "Searching" label with step-animated badges (staccato pace)
 */
function SearchingPhase({ visible = true }: { visible?: boolean }) {
  // Double the badges for seamless loop
  const marqueeItems = [...SOURCE_BADGES, ...SOURCE_BADGES];
  const badgeSize = 18;
  const badgeOverlap = 4; // -ml-1 = 4px
  const step = badgeSize - badgeOverlap;

  // Exactly 3 badges visible (with overlap)
  const viewportWidth = badgeSize + 2 * step;

  const marqueeStyle: CSSProperties = {
    width: viewportWidth,
    height: badgeSize,
  };

  const stepStyle = {
    "--badge-step": `${step}px`,
  } as CSSProperties;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"
        }`}
    >
      <span className="text-sm text-zinc-500">Searching</span>

      <div
        className="relative overflow-hidden"
        style={marqueeStyle}
      >
        <div
          className="flex"
          style={stepStyle}
        >
          <div className="animate-badge-step flex">
            {marqueeItems.map((badge, i) => (
              <div key={`${badge.id}-${i}`} style={{ marginLeft: i == 0 ? 0 : -badgeOverlap }} >
                <SourceBadge
                  badge={badge}
                  size={badgeSize}
                  zIndex={i + 1}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Results meta state - overlapping badges with "X sites" text
 */
function CompletedPhase({
  visible = true,
  siteCount = 15,
}: {
  visible?: boolean;
  siteCount?: number;
}) {
  const displayBadges = SOURCE_BADGES.slice(0, 3);
  const badgeSize = 18;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 transition-all duration-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
    >
      {/* Overlapping badges */}
      <div className="flex items-center">
        {displayBadges.map((badge, i) => (
          <SourceBadge
            key={badge.id}
            badge={badge}
            size={badgeSize}
            className={i > 0 ? "-ml-1.5" : ""}
            zIndex={i + 1}
          />
        ))}
      </div>
      <span className="text-sm text-zinc-500">{siteCount} sites</span>
    </div>
  );
}

export function LoadingIndicator({
  loadingPhase,
  fadingOut,
}: {
  loadingPhase: LoadingPhase;
  fadingOut: boolean;
}) {
  return (
    <div className={`transition-opacity duration-200 ${fadingOut ? "opacity-0" : "opacity-100"}`}>
      {loadingPhase === LoadingPhase.Thinking && <ThinkingPhase />}
      {loadingPhase === LoadingPhase.Searching && <SearchingPhase />}
      {loadingPhase === LoadingPhase.Complete && <CompletedPhase />}
    </div>
  );
}