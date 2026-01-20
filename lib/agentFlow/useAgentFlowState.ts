"use client";

import { useReducer, useCallback, useMemo } from "react";
import type {
  AgentFlowState,
  AgentFlowAction,
  ModalKind,
  Product,
  ChatMessage,
  CustomerInfo,
  OrderTotals,
} from "./types";

const VAT_RATE = 0.15;
const SHIPPING_RIYADH = 10;
const SHIPPING_OTHER = 20;

/** Round to 2 decimal places (cents) */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Initial state for the agent flow */
const initialState: AgentFlowState = {
  currentScreen: "chat_idle",
  modalState: null,
  queryText: "",
  lastSubmittedQuery: "",
  messages: [],
  results: [],
  resultsScrollOffset: 0,
  productsById: {},
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
        id: `msg-${Date.now()}`,
        role: "user",
        content: trimmedQuery,
        timestamp: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, userMessage],
        queryText: "",
        lastSubmittedQuery: trimmedQuery,
        currentScreen: "chat_loading",
        // Clear prior results state to avoid UI ghosts
        results: [],
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

    case "SET_LOADING":
      return { ...state, currentScreen: "chat_loading" };

    // ─── Results Actions ──────────────────────────────────────────────
    case "SET_RESULTS": {
      // Merge new products into cache
      const newProductsById = { ...state.productsById };
      for (const product of action.payload) {
        newProductsById[product.id] = product;
      }
      return {
        ...state,
        results: action.payload,
        productsById: newProductsById,
        resultsScrollOffset: 0,
        selectedProductId: null,
        currentScreen: "results_list",
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
      // Navigate back to results list, preserve selection and scroll position, close any modal
      return {
        ...state,
        currentScreen: "results_list",
        modalState: null,
      };

    case "OPEN_MODAL":
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
  submitQuery: () => void;
  addAgentMessage: (content: string) => void;

  // Results actions
  setResults: (products: Product[]) => void;
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
    const isRiyadh = state.customer?.address?.city?.toLowerCase() === "riyadh";
    const shipping = state.customer?.address ? (isRiyadh ? SHIPPING_RIYADH : SHIPPING_OTHER) : 0;
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
  }, [selectedProduct, state.quantity, state.customer?.address]);

  const canCheckout = useMemo(() => {
    if (!selectedProduct || !selectedProduct.availability.in_stock) return false;

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

  const submitQuery = useCallback(() => {
    dispatch({ type: "SUBMIT_QUERY" });
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

  const setResults = useCallback((products: Product[]) => {
    dispatch({ type: "SET_RESULTS", payload: products });
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
    setResults,
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
