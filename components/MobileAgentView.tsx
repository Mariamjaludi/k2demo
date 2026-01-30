"use client";

import { useCallback, useEffect, useRef } from "react";
import { DeviceFrame, SAFE_AREA } from "./DeviceFrame";
import { ChatIdleScreen, ChatActiveScreen, Header, ProductDetailScreen } from "./chat";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { useAgentFlowState } from "@/lib/agentFlow";
import { fetchProducts, type FetchProductsResult } from "@/lib/productClient";

interface PendingFetch {
  /** ID of the user message that triggered this fetch */
  messageId: string;
  promise: Promise<FetchProductsResult>;
}

export function MobileAgentView() {
  const {
    state,
    selectedProduct,
    setQuery,
    submitQuery,
    setProducts,
    selectProduct,
    backToResults,
    startOrderProcessing,
  } = useAgentFlowState();

  // Holds the in-flight fetch promise paired with the triggering message ID
  const pendingFetchRef = useRef<PendingFetch | null>(null);
  const screenRef = useRef(state.currentScreen);
  useEffect(() => {
    screenRef.current = state.currentScreen;
  }, [state.currentScreen]);

  const handleSubmit = useCallback(() => {
    const query = state.queryText.trim();
    if (!query) return;

    // Generate the message ID that SUBMIT_QUERY will use
    const messageId = `msg-${Date.now()}`;

    // Start fetching immediately, before the animation begins
    pendingFetchRef.current = {
      messageId,
      promise: fetchProducts({ query }),
    };

    // Adds user message and transitions to chat_active
    submitQuery(messageId);
  }, [state.queryText, submitQuery]);

  const handleAnimationComplete = useCallback(async () => {
    const pending = pendingFetchRef.current;
    if (!pending) return;

    const result = await pending.promise;

    // Only apply if this is still the active fetch (not superseded by a newer submit)
    if (pendingFetchRef.current?.messageId !== pending.messageId) return;

    // Guard against applying results after navigating away from chat
    if (screenRef.current !== "chat_active") {
      pendingFetchRef.current = null;
      return;
    }

    pendingFetchRef.current = null;
    setProducts(result.products, result.productDescription);
  }, [setProducts]);

  // Determine header variant based on current screen
  const headerVariant = state.currentScreen === "chat_idle" ? "idle" : "active";

  const renderScreen = () => {
    switch (state.currentScreen) {
      case "chat_idle":
        return (
          <ChatIdleScreen
            queryText={state.queryText}
            onQueryChange={setQuery}
            onSubmit={handleSubmit}
            messages={state.messages}
          />
        );

      case "chat_active":
        return (
          <ChatActiveScreen
            queryText={state.queryText}
            onQueryChange={setQuery}
            onSubmit={handleSubmit}
            messages={state.messages}
            onClickTitle={(id: string) => selectProduct(id)}
            onAnimationComplete={handleAnimationComplete}
          />
        );

      // Placeholder screens for now
      case "results_list":
      case "order_processing":
      case "order_complete":
        return (
          <PlaceholderScreen title={state.currentScreen.replace(/_/g, " ")} />
        );

      case "product_detail":
        return null; // Rendered as overlay

      default:
        return null;
    }
  };

  // For product_detail, we render chat_active underneath so the slide-out reveals it
  const renderBase = () => {
    if (state.currentScreen === "product_detail") {
      return (
        <ChatActiveScreen
          queryText={state.queryText}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          messages={state.messages}
          onClickTitle={(id: string) => selectProduct(id)}
          onAnimationComplete={handleAnimationComplete}
        />
      );
    }
    return renderScreen();
  };

  return (
    <DeviceFrame statusBarVariant="dark">
      <div className="relative flex h-full flex-col" style={{ paddingTop: SAFE_AREA.topInset }}>
        <Header variant={headerVariant} />
        <div className={`flex min-h-0 flex-1 flex-col ${state.currentScreen === "product_detail" ? "pointer-events-none overflow-hidden" : ""}`}>
          {renderBase()}
        </div>
        {state.currentScreen === "product_detail" && selectedProduct && (
          <ProductDetailScreen
            product={selectedProduct}
            onClose={backToResults}
            onBuy={startOrderProcessing}
          />
        )}
      </div>
    </DeviceFrame>
  );
}
