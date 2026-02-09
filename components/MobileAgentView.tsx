"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { DeviceFrame, SAFE_AREA } from "./DeviceFrame";
import { ChatScreen } from "./chat";
import { ProductDetailScreen } from "./product";
import { CreateAccountModal, CheckoutSummaryModal, ReviewOrderModal } from "./checkout";
import { OrderProcessingScreen, OrderCompleteScreen } from "./order";

import { useAgentFlowState } from "@/lib/agentFlow";
import { DEMO_CUSTOMER } from "@/lib/agentFlow/types";
import { fetchProducts, getProductsByRetailer, type FetchProductsResult } from "@/lib/productClient";
import { createCheckoutSession, updateCheckoutSession, completeCheckoutSession } from "@/lib/checkoutClient";
import { Retailer } from "@/components/product/ProductCard";

interface PendingFetch {
  /** ID of the user message that triggered this fetch */
  messageId: string;
  promise: Promise<FetchProductsResult>;
}

export function MobileAgentView() {
  const {
    state,
    selectedProduct,
    totals,
    setQuery,
    submitQuery,
    setProducts,
    selectProduct,
    backToResults,
    openModal,
    closeModal,
    setCustomer,
    setCheckoutSession,
    startOrderProcessing,
    completeOrder,
  } = useAgentFlowState();

  // Holds the checkout session creation promise and resolved ID
  const checkoutSessionIdRef = useRef<string | null>(null);
  const checkoutSessionPromiseRef = useRef<Promise<string | null> | null>(null);

  // Holds the in-flight fetch promise paired with the triggering message ID
  const pendingFetchRef = useRef<PendingFetch | null>(null);
  const screenRef = useRef(state.currentScreen);
  useEffect(() => {
    screenRef.current = state.currentScreen;
  }, [state.currentScreen]);

  const handleSubmit = useCallback(() => {
    const query = state.queryText.trim();
    if (!query) return;

    const now = Date.now();
    const messageId = `msg-${now}`;

    // Start fetching immediately, before the animation begins
    pendingFetchRef.current = {
      messageId,
      promise: fetchProducts({ query }),
    };

    submitQuery(messageId, now);
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
    setProducts(result.products, result.productDescription, result.correlationId);
  }, [setProducts]);

  // More products from the same retailer for the checkout modal
  const moreFromRetailer = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductsByRetailer(selectedProduct.retailer, selectedProduct.id);
  }, [selectedProduct]);

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

      case "order_processing":
        return selectedProduct ? (
          <OrderProcessingScreen
            product={selectedProduct}
            onComplete={completeOrder}
            checkoutSessionId={state.checkoutSessionId}
          />
        ) : null;

      case "order_complete":
        return selectedProduct && totals && state.orderId && state.customer ? (
          <OrderCompleteScreen
            product={selectedProduct}
            totals={totals}
            orderId={state.orderId}
            customer={state.customer}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <DeviceFrame statusBarVariant="dark">
      <div className="relative flex h-full flex-col" style={{ paddingTop: SAFE_AREA.topInset }}>
        <div
          className={`flex min-h-0 flex-1 flex-col ${state.currentScreen === "product_detail" ? "pointer-events-none overflow-hidden" : ""}`}
          aria-hidden={state.currentScreen === "product_detail" || undefined}
        >
          {renderScreen()}
        </div>
        {state.currentScreen === "product_detail" && selectedProduct && (
          <>
            <ProductDetailScreen
              product={selectedProduct}
              onClose={backToResults}
              onBuy={() => {
                openModal("create_account");
                // Only Jarir products go through the merchant API — other retailers are external
                checkoutSessionIdRef.current = null;
                checkoutSessionPromiseRef.current = null;
                if (selectedProduct?.retailer === Retailer.Jarir) {
                  // Bundles are pre-sorted by rank in toProduct; first entry is top-ranked
                  const topBundle = selectedProduct.bundles?.[0] ?? selectedProduct.bundle;
                  const offerId = topBundle?.offerId;
                  const productCorrelationId = state.correlationIdByProductId[selectedProduct.id];
                  const promise = createCheckoutSession({
                    productId: selectedProduct.id,
                    quantity: state.quantity,
                    offerId,
                    correlationId: productCorrelationId,
                  }).then((result) => {
                    const sid = result?.sessionId ?? null;
                    if (sid) {
                      checkoutSessionIdRef.current = sid;
                      setCheckoutSession(sid);
                    }
                    return sid;
                  }).catch((error) => {
                    console.error("Failed to create checkout session:", error);
                    return null;
                  });
                  checkoutSessionPromiseRef.current = promise;
                }
              }}
              disabled={state.modalState !== null}
            />
            {state.modalState === "create_account" && (
              <CreateAccountModal
                retailerName={selectedProduct.retailer}
                customerEmail={DEMO_CUSTOMER.email}
                onClose={closeModal}
                onContinue={() => openModal("checkout")}
              />
            )}
            {state.modalState === "checkout" && totals && (
              <CheckoutSummaryModal
                product={selectedProduct}
                moreFromRetailer={moreFromRetailer}
                totals={totals}
                onClose={closeModal}
                onContinueToCheckout={() => {
                  setCustomer(DEMO_CUSTOMER);
                  openModal("review_order");
                  // Await session creation if still in flight, then update with customer info
                  const sendUpdate = async () => {
                    try {
                      const sid = checkoutSessionIdRef.current
                        ?? await checkoutSessionPromiseRef.current;
                      if (sid && DEMO_CUSTOMER.address) {
                        await updateCheckoutSession({
                          sessionId: sid,
                          email: DEMO_CUSTOMER.email,
                          address: DEMO_CUSTOMER.address,
                        });
                      }
                    } catch (error) {
                      console.error("Failed to update checkout session:", error);
                    }
                  };
                  sendUpdate();
                }}
              />
            )}
            {state.modalState === "review_order" && totals && (
              <ReviewOrderModal
                product={selectedProduct}
                totals={totals}
                customer={DEMO_CUSTOMER}
                onClose={closeModal}
                onPay={() => {
                  startOrderProcessing();
                  // Await session creation if still in flight, then complete checkout
                  const sendComplete = async () => {
                    const sid = checkoutSessionIdRef.current
                      ?? await checkoutSessionPromiseRef.current;
                    if (sid) {
                      completeCheckoutSession(sid);
                    }
                  };
                  sendComplete();
                }}
              />
            )}
          </>
        )}
      </div>
    </DeviceFrame>
  );
}
