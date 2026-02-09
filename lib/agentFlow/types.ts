import type { Product } from "@/components/product/ProductCard";

/** Screen states for the mobile agent flow */
export type Screen =
  | "chat"
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
  /** When present, this agent message carries product results */
  products?: Product[];
  productDescription?: string;
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

/** Demo customer used throughout the checkout flow */
export const DEMO_CUSTOMER: CustomerInfo = {
  email: "sarah.g.faysal@gmail.com",
  name: "Sarah Faysal",
  address: {
    country: "SA",
    city: "Riyadh",
    district: "Al Olaya",
    address_line1: "2836 Al Olaya District",
    postcode: "12211",
  },
};

/** Demo payment card last 4 digits */
export const DEMO_CARD_LAST4 = "1234";

/** Complete agent flow state */
export interface AgentFlowState {
  // Navigation
  currentScreen: Screen;
  modalState: ModalKind | null;

  // Chat
  queryText: string;
  messages: ChatMessage[];

  // Results
  resultsScrollOffset: number;
  /** Cache of all products seen (including competitors), keyed by id */
  productsById: Record<string, Product>;
  /** Maps product ID → K2 correlation_id from the fetch that returned it */
  correlationIdByProductId: Record<string, string>;

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
  | { type: "SUBMIT_QUERY"; payload: { messageId: string; timestamp: number } }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }

  // Results actions
  | { type: "SET_PRODUCTS"; payload: { products: Product[]; productDescription: string; correlationId?: string } }
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
