"use client";

export function MobileAgentView() {
  return (
    <div className="flex h-[700px] w-[375px] flex-col rounded-[40px] border-4 border-zinc-600 bg-black shadow-2xl">
      {/* Phone notch */}
      <div className="flex justify-center pt-2">
        <div className="h-6 w-24 rounded-full bg-zinc-800" />
      </div>

      {/* Screen content */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-b-[36px] bg-white">
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

        {/* Input area placeholder */}
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
    </div>
  );
}
