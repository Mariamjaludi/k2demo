"use client";

import { DeviceFrame } from "./DeviceFrame";
import { ChatIdleScreen, ChatLoadingScreen } from "./chat";
import { PlaceholderScreen } from "./PlaceholderScreen";
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
            messages={state.messages}
          />
        );

      case "chat_loading":
        return (
          <ChatLoadingScreen
            lastQuery={state.lastSubmittedQuery}
            queryText={state.queryText}
            onQueryChange={setQuery}
            onSubmit={submitQuery}
            messages={state.messages}
          />
        );

      // Placeholder screens for now
      case "results_list":
      case "product_detail":
      case "order_processing":
      case "order_complete":
        return (
          <PlaceholderScreen title={state.currentScreen.replace(/_/g, " ")} />
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
