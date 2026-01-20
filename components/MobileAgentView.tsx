"use client";

import { DeviceFrame } from "./DeviceFrame";
import { ChatIdleScreen } from "./chat";
import { useAgentFlowState } from "@/lib/agentFlow";

export function MobileAgentView() {
  const {
    state,
    setQuery,
    submitQuery,
  } = useAgentFlowState();

  const renderScreen = () => {
    switch (state.currentScreen) {
      case "chat_idle":
        return (
          <ChatIdleScreen
            queryText={state.queryText}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
          />
        );

      case "chat_loading":
        return (
          <ChatIdleScreen
            queryText={state.queryText}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
          />
        );

      // Placeholder screens for now
      case "results_list":
      case "product_detail":
      case "order_processing":
      case "order_complete":
        return (
          <div className="flex h-full items-center justify-center bg-white p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-700">
                {state.currentScreen.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-xs text-zinc-400">Coming soon</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DeviceFrame statusBarVariant="dark">
      {renderScreen()}
    </DeviceFrame>
  );
}
