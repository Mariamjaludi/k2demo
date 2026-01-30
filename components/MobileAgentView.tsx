"use client";

import { useCallback, useEffect, useRef } from "react";
import { DeviceFrame, SAFE_AREA } from "./DeviceFrame";
import { ChatScreen, ProductDetailScreen } from "./chat";
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

    submitQuery(messageId);
  }, [state.queryText, submitQuery]);

  const handleAnimationComplete = useCallback(async () => {
    const pending = pendingFetchRef.current;
    if (!pending) return;

    const result = await pending.promise;

    // Only apply if this is still the active fetch (not superseded by a newer submit)
    if (pendingFetchRef.current?.messageId !== pending.messageId) return;

    // Guard against applying results after navigating away from chat
    // Allow "product_detail" since ChatScreen is still rendered underneath
    if (screenRef.current !== "chat" && screenRef.current !== "product_detail") {
      pendingFetchRef.current = null;
      return;
    }

    pendingFetchRef.current = null;
    setProducts(result.products, result.productDescription);
  }, [setProducts]);

  const renderScreen = () => {
    switch (state.currentScreen) {
      case "chat":
      case "product_detail":
        return (
          <ChatScreen
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

      default:
        return null;
    }
  };

  return (
    <DeviceFrame statusBarVariant="dark">
      <div className="relative flex h-full flex-col" style={{ paddingTop: SAFE_AREA.topInset }}>
        <div className={`flex min-h-0 flex-1 flex-col ${state.currentScreen === "product_detail" ? "pointer-events-none overflow-hidden" : ""}`}>
          {renderScreen()}
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
