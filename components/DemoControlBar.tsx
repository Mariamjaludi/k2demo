"use client";

import { emitLog, clearLogs } from "@/lib/demoLogs/logBus";

export function DemoControlBar() {
  const emitAgentEvent = () => {
    emitLog({
      category: "agent",
      event: "agent.search.start",
      message: "Searching for school supplies...",
      payload: { query: "school supplies", filters: { in_stock: true } },
    });
  };

  const emitMerchantPair = () => {
    const sessionId = `sess-${Date.now()}`;

    emitLog({
      category: "merchant",
      event: "merchant.products.request",
      message: "GET /api/products?q=backpack",
      session_id: sessionId,
      payload: { method: "GET", url: "/api/products", query: { q: "backpack" } },
    });

    setTimeout(() => {
      emitLog({
        category: "merchant",
        event: "merchant.products.response",
        message: "Found 3 products",
        session_id: sessionId,
        payload: {
          status: 200,
          count: 3,
          items: [
            { id: "jarir_school_backpack_basic", title: "Basic School Backpack", price: 79 },
          ],
        },
      });
    }, 300);
  };

  const emitK2Reasoning = () => {
    emitLog({
      category: "k2",
      event: "k2.negotiate.delivery",
      message: "K2: Optimizing delivery promise for Riyadh",
      level: "info",
      payload: {
        reasoning: "Customer in Riyadh qualifies for next-day delivery",
        original_promise: "2-3 days",
        optimized_promise: "Deliver tomorrow",
        margin_impact: "none",
        levers_used: ["delivery_speed"],
      },
    });
  };

  const emitCheckoutEvent = () => {
    emitLog({
      category: "checkout",
      event: "checkout.session.created",
      message: "Checkout session created",
      session_id: `sess-${Date.now()}`,
      payload: {
        items: 2,
        subtotal: 104,
        currency: "SAR",
      },
    });
  };

  const emitPaymentEvent = () => {
    emitLog({
      category: "payment",
      event: "payment.mada.initiated",
      message: "Payment initiated via mada",
      level: "info",
      payload: {
        method: "mada",
        amount: 119.6,
        currency: "SAR",
      },
    });
  };

  const handleClear = () => {
    clearLogs();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2">
      <span className="text-xs text-zinc-500 mr-2">Demo Controls:</span>
      <button
        onClick={emitAgentEvent}
        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
      >
        Agent Event
      </button>
      <button
        onClick={emitMerchantPair}
        className="rounded bg-cyan-600 px-2 py-1 text-xs text-white hover:bg-cyan-500"
      >
        Merchant Req/Res
      </button>
      <button
        onClick={emitK2Reasoning}
        className="rounded bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-500"
      >
        K2 Reasoning
      </button>
      <button
        onClick={emitCheckoutEvent}
        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-500"
      >
        Checkout
      </button>
      <button
        onClick={emitPaymentEvent}
        className="rounded bg-pink-600 px-2 py-1 text-xs text-white hover:bg-pink-500"
      >
        Payment
      </button>
      <div className="flex-1" />
      <button
        onClick={handleClear}
        className="rounded bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-500"
      >
        Clear Logs
      </button>
    </div>
  );
}
