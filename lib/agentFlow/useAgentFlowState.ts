"use client";

import { useReducer, useCallback, useMemo } from "react";
import type {
  AgentFlowState,
  AgentFlowAction,
  ModalKind,
  ChatMessage,
  CustomerInfo,
  OrderTotals,
} from "./types";
import { Retailer, type Product } from "@/components/product/ProductCard";
import { VAT_RATE, SHIPPING_RIYADH, SHIPPING_OTHER, round2 } from "@/lib/pricing";

/** Initial state for the agent flow */
const initialState: AgentFlowState = {
  currentScreen: "chat",
  modalState: null,
  queryText: "",
  messages: [],
  resultsScrollOffset: 0,
  productsById: {},
  correlationIdByProductId: {},
  selectedProductId: null,
  quantity: 1,
  customer: null,
  checkoutSessionId: null,
  paymentMethod: null,
  orderId: null,
};

/** Reducer for agent flow state transitions */
function agentFlowReducer(
  state: AgentFlowState,
  action: AgentFlowAction
): AgentFlowState {
  switch (action.type) {
    // ─── Chat Actions ─────────────────────────────────────────────────
    case "SET_QUERY":
      return { ...state, queryText: action.payload };

    case "SUBMIT_QUERY": {
      const trimmedQuery = state.queryText.trim();
      if (!trimmedQuery) return state;
      const userMessage: ChatMessage = {
        id: action.payload.messageId,
        role: "user",
        content: trimmedQuery,
        timestamp: action.payload.timestamp,
      };
      return {
        ...state,
        messages: [...state.messages, userMessage],
        queryText: "",
        currentScreen: "chat",
        resultsScrollOffset: 0,
        selectedProductId: null,
        modalState: null,
        checkoutSessionId: null,
        paymentMethod: null,
        orderId: null,
      };
    }

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    // ─── Results Actions ──────────────────────────────────────────────
    case "SET_PRODUCTS": {
      const { products, productDescription, correlationId } = action.payload;
      // Merge new products into cache
      const newProductsById = { ...state.productsById };
      for (const product of products) {
        newProductsById[product.id] = product;
      }
      // Map product IDs to the K2 correlation_id from this fetch.
      // Clear stale mappings for incoming products when no correlationId.
      const newCorrelationIds = { ...state.correlationIdByProductId };
      for (const product of products) {
        if (correlationId) {
          newCorrelationIds[product.id] = correlationId;
        } else {
          delete newCorrelationIds[product.id];
        }
      }
      // Add an agent message carrying the product results into the conversation
      const productMessage: ChatMessage = {
        id: `msg-products-${Date.now()}`,
        role: "agent",
        content: "",
        timestamp: Date.now(),
        products,
        productDescription,
      };
      return {
        ...state,
        productsById: newProductsById,
        correlationIdByProductId: newCorrelationIds,
        resultsScrollOffset: 0,
        selectedProductId: null,
        messages: [...state.messages, productMessage],
      };
    }

    case "SAVE_SCROLL_OFFSET":
      return { ...state, resultsScrollOffset: Math.max(0, action.payload) };

    // ─── Navigation Actions ───────────────────────────────────────────
    case "SELECT_PRODUCT":
      return {
        ...state,
        selectedProductId: action.payload,
        quantity: 1,
        // Reset checkout session state, but keep customer (Google account persists)
        checkoutSessionId: null,
        paymentMethod: null,
        orderId: null,
        currentScreen: "product_detail",
      };

    case "BACK_TO_RESULTS":
      // Navigate back to chat, preserve scroll position, close any modal
      return {
        ...state,
        currentScreen: "chat",
        modalState: null,
      };

    case "OPEN_MODAL":
      if (state.currentScreen !== "product_detail") return state;
      return { ...state, modalState: action.payload };

    case "CLOSE_MODAL":
      return { ...state, modalState: null };

    // ─── Checkout Actions ─────────────────────────────────────────────
    case "SET_CUSTOMER":
      return { ...state, customer: action.payload };

    case "SET_QUANTITY":
      return { ...state, quantity: Math.max(1, action.payload) };

    case "SET_CHECKOUT_SESSION":
      return { ...state, checkoutSessionId: action.payload };

    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.payload };

    case "START_ORDER_PROCESSING":
      // Close any modal and navigate to order processing screen
      return {
        ...state,
        modalState: null,
        currentScreen: "order_processing",
      };

    case "COMPLETE_ORDER":
      return {
        ...state,
        modalState: null,
        orderId: action.payload,
        currentScreen: "order_complete",
      };

    // ─── Reset ────────────────────────────────────────────────────────
    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/** Hook return type */
export interface AgentFlowContext {
  state: AgentFlowState;

  // Derived values
  selectedProduct: Product | null;
  totals: OrderTotals | null;
  canCheckout: boolean;

  // Chat actions
  setQuery: (text: string) => void;
  submitQuery: (messageId: string, timestamp: number) => void;
  addAgentMessage: (content: string) => void;

  // Results actions
  setProducts: (products: Product[], productDescription: string, correlationId?: string) => void;
  saveScrollOffset: (offset: number) => void;
  // Navigation actions
  selectProduct: (productId: string) => void;
  backToResults: () => void;
  openModal: (modal: ModalKind) => void;
  closeModal: () => void;

  // Checkout actions
  setCustomer: (customer: CustomerInfo) => void;
  setQuantity: (quantity: number) => void;
  setCheckoutSession: (sessionId: string) => void;
  setPaymentMethod: (method: "mada" | null) => void;
  startOrderProcessing: () => void;
  completeOrder: (orderId: string) => void;

  // Reset
  reset: () => void;
}

/** Hook for managing agent flow state */
export function useAgentFlowState(): AgentFlowContext {
  const [state, dispatch] = useReducer(agentFlowReducer, initialState);

  // ─── Derived Values ─────────────────────────────────────────────────
  const selectedProduct = useMemo(() => {
    if (!state.selectedProductId) return null;
    return state.productsById[state.selectedProductId] ?? null;
  }, [state.selectedProductId, state.productsById]);

  const totals = useMemo((): OrderTotals | null => {
    if (!selectedProduct) return null;

    const subtotal = round2(selectedProduct.price * state.quantity);

    // When we have an address, use city-based shipping.
    // When no address yet (checkout/review modals before address entry),
    // use retailer-aware defaults: Jarir = free, others = Riyadh rate.
    let shipping: number;
    if (state.customer?.address) {
      const isRiyadh = state.customer.address.city?.toLowerCase() === "riyadh";
      shipping = isRiyadh ? SHIPPING_RIYADH : SHIPPING_OTHER;
    } else {
      shipping = selectedProduct.retailer === Retailer.Jarir ? 0 : SHIPPING_RIYADH;
    }

    const vatBase = round2(subtotal + shipping);
    const vat = round2(vatBase * VAT_RATE);
    const total = round2(vatBase + vat);

    return {
      subtotal,
      shipping,
      vat,
      vatRate: VAT_RATE,
      total,
      currency: selectedProduct.currency,
    };
  }, [selectedProduct, state.quantity, state.customer]);

  const canCheckout = useMemo(() => {
    if (!selectedProduct) return false;

    const emailOk = !!state.customer?.email?.trim();
    const addr = state.customer?.address;
    const addressOk =
      !!addr &&
      addr.country === "SA" &&
      !!addr.city?.trim() &&
      !!addr.address_line1?.trim();

    return emailOk && addressOk;
  }, [selectedProduct, state.customer]);

  // ─── Action Dispatchers ─────────────────────────────────────────────
  const setQuery = useCallback((text: string) => {
    dispatch({ type: "SET_QUERY", payload: text });
  }, []);

  const submitQuery = useCallback((messageId: string, timestamp: number) => {
    dispatch({ type: "SUBMIT_QUERY", payload: { messageId, timestamp } });
  }, []);

  const addAgentMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "agent",
      content,
      timestamp: Date.now(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: message });
  }, []);

  const setProducts = useCallback((products: Product[], productDescription: string, correlationId?: string) => {
    dispatch({ type: "SET_PRODUCTS", payload: { products, productDescription, correlationId } });
  }, []);

  const saveScrollOffset = useCallback((offset: number) => {
    dispatch({ type: "SAVE_SCROLL_OFFSET", payload: offset });
  }, []);

  const selectProduct = useCallback((productId: string) => {
    dispatch({ type: "SELECT_PRODUCT", payload: productId });
  }, []);

  const backToResults = useCallback(() => {
    dispatch({ type: "BACK_TO_RESULTS" });
  }, []);

  const openModal = useCallback((modal: ModalKind) => {
    dispatch({ type: "OPEN_MODAL", payload: modal });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const setCustomer = useCallback((customer: CustomerInfo) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer });
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    dispatch({ type: "SET_QUANTITY", payload: quantity });
  }, []);

  const setCheckoutSession = useCallback((sessionId: string) => {
    dispatch({ type: "SET_CHECKOUT_SESSION", payload: sessionId });
  }, []);

  const setPaymentMethod = useCallback((method: "mada" | null) => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
  }, []);

  const startOrderProcessing = useCallback(() => {
    dispatch({ type: "START_ORDER_PROCESSING" });
  }, []);

  const completeOrder = useCallback((orderId: string) => {
    dispatch({ type: "COMPLETE_ORDER", payload: orderId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    selectedProduct,
    totals,
    canCheckout,
    setQuery,
    submitQuery,
    addAgentMessage,
    setProducts,
    saveScrollOffset,
    selectProduct,
    backToResults,
    openModal,
    closeModal,
    setCustomer,
    setQuantity,
    setCheckoutSession,
    setPaymentMethod,
    startOrderProcessing,
    completeOrder,
    reset,
  };
}
