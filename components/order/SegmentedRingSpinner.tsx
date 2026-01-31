"use client";

import { useEffect, useState } from "react";

const SEGMENT_COUNT = 6;
const RADIUS = 10;
const STROKE_WIDTH = 2.5;
const CENTER = RADIUS + STROKE_WIDTH;
const SIZE = CENTER * 2;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;
const ARC_LENGTH = (CIRCUMFERENCE - GAP * SEGMENT_COUNT) / SEGMENT_COUNT;

/** Interval between highlight advances (ms) */
const STEP_MS = 200;

export function SegmentedRingSpinner({ size = 24 }: { size?: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % SEGMENT_COUNT);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
    >
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
        <circle
          key={i}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          className={i === active ? "stroke-blue-600" : "stroke-blue-200"}
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
          strokeDashoffset={-(i * (ARC_LENGTH + GAP))}
        />
      ))}
    </svg>
  );
}
