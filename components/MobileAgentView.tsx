"use client";

import { DeviceFrame, SAFE_AREA } from "./DeviceFrame";

export function MobileAgentView() {
  return (
    <DeviceFrame statusBarVariant="dark">
      {/* App screen with safe area padding */}
      <div
        className="flex h-full flex-col bg-white"
        style={{ paddingTop: SAFE_AREA.topInset, paddingBottom: SAFE_AREA.bottom }}
      >
        {/* Header */}
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <h1 className="text-center text-sm font-semibold text-zinc-900">
            K2 Shopping Agent
          </h1>
        </div>

        {/* Chat area placeholder */}
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="mb-4 text-4xl">🛒</div>
            <p className="text-sm text-zinc-500">Mobile Agent View</p>
            <p className="mt-1 text-xs text-zinc-400">Chat interface coming soon</p>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full bg-zinc-200 px-4 py-2 text-sm text-zinc-400">
              Ask the agent...
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white"
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </DeviceFrame>
  );
}
