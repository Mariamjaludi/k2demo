"use client";

import { SAFE_AREA } from "./DeviceFrame";

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <div
      className="flex h-full items-center justify-center bg-white p-4"
      style={{ paddingTop: SAFE_AREA.topInset, paddingBottom: SAFE_AREA.bottom }}
    >
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-700">{title}</p>
        <p className="mt-1 text-xs text-zinc-400">Coming soon</p>
      </div>
    </div>
  );
}
