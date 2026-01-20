/** Screen states for the mobile agent flow */
export type Screen =
  | "chat_idle"
  | "chat_loading"
  | "results_list"
  | "product_detail"
  | "order_processing"
  | "order_complete";

/** Modal kinds that can overlay screens */
export type ModalKind = "create_account" | "checkout" | "review_order";

/** Chat message in the conversation */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

/** Product from search results */
export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  currency: "SAR";
  availability: {
    in_stock: boolean;
    stock_level: number;
  };
  delivery: {
    default_promise: string;
  };
  image_url?: string;
}

/** Order totals */
export interface OrderTotals {
  subtotal: number;
  shipping: number;
  vat: number;
  vatRate: number;
  total: number;
  currency: "SAR";
}

/** Customer info for checkout (KSA only) */
export interface CustomerInfo {
  email: string;
  name?: string;
  phone?: string;
  address?: {
    country: "SA";
    city: string;
    district?: string;
    address_line1: string;
    address_line2?: string;
    postcode?: string;
  };
}

/** Complete agent flow state */
export interface AgentFlowState {
  // Navigation
  currentScreen: Screen;
  modalState: ModalKind | null;

  // Chat
  queryText: string;
  lastSubmittedQuery: string;
  messages: ChatMessage[];

  // Results
  results: Product[];
  resultsScrollOffset: number;
  /** Cache of all products seen (including competitors), keyed by id */
  productsById: Record<string, Product>;

  // Selection
  selectedProductId: string | null;
  quantity: number;

  // Customer & Order
  customer: CustomerInfo | null;

  // Checkout session
  checkoutSessionId: string | null;
  paymentMethod: "mada" | null;

  // Order completion
  orderId: string | null;
}

/** Actions for state transitions */
export type AgentFlowAction =
  // Chat actions
  | { type: "SET_QUERY"; payload: string }
  | { type: "SUBMIT_QUERY" }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING" }

  // Results actions
  | { type: "SET_RESULTS"; payload: Product[] }
  | { type: "SAVE_SCROLL_OFFSET"; payload: number }

  // Navigation actions
  | { type: "SELECT_PRODUCT"; payload: string }
  | { type: "BACK_TO_RESULTS" }
  | { type: "OPEN_MODAL"; payload: ModalKind }
  | { type: "CLOSE_MODAL" }

  // Checkout actions
  | { type: "SET_CUSTOMER"; payload: CustomerInfo }
  | { type: "SET_QUANTITY"; payload: number }
  | { type: "SET_CHECKOUT_SESSION"; payload: string }
  | { type: "SET_PAYMENT_METHOD"; payload: "mada" | null }
  | { type: "START_ORDER_PROCESSING" }
  | { type: "COMPLETE_ORDER"; payload: string }

  // Reset
  | { type: "RESET" };
