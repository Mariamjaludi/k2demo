"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { RETAILER_LOGOS, type Product, ProductSummaryCard } from "@/components/product";
import { SegmentedRingSpinner } from "./SegmentedRingSpinner";
import { SAFE_AREA } from "@/components/DeviceFrame";
import { pollForCompletion } from "@/lib/checkoutClient";

interface OrderProcessingScreenProps {
  product: Product;
  onComplete: (orderId: string) => void;
  /** When set, polls the merchant API for completion instead of using a local timer */
  checkoutSessionId?: string | null;
}

const STEPS = [
  (retailer: string) => `Connecting to ${retailer}`,
  () => "Checking payment info",
  () => "Finalizing order",
];

const STEP_DURATION = 2000;

function WaveText({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={`${text}-${i}`}
          className="animate-thinking-wave inline-block"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function OrderProcessingScreen({ product, onComplete, checkoutSessionId }: OrderProcessingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Step animation (same for both Jarir and non-Jarir)
  useEffect(() => {
    if (stepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => setStepIndex((i) => i + 1), STEP_DURATION);
      return () => clearTimeout(timer);
    }
  }, [stepIndex]);

  // Completion: poll merchant API for Jarir, use local timer for others
  useEffect(() => {
    if (stepIndex < STEPS.length - 1) return;

    if (checkoutSessionId) {
      // Jarir: poll GET /api/checkout-sessions/{id} until status is "completed"
      if (pollingRef.current) return;
      pollingRef.current = true;

      const abortController = new AbortController();
      pollForCompletion(checkoutSessionId, abortController.signal).then((result) => {
        // Don't call onComplete if we were aborted (e.g. unmount)
        if (abortController.signal.aborted) return;

        if (result) {
          onCompleteRef.current(result.orderId);
        } else {
          // Fallback: if polling times out, use a local order ID
          const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
          onCompleteRef.current(orderId);
        }
      });

      return () => {
        abortController.abort();
        pollingRef.current = false;
      };
    }

    // Non-Jarir: use the existing local timer
    if (finalTimerRef.current != null) return;
    finalTimerRef.current = setTimeout(() => {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      onCompleteRef.current(orderId);
    }, STEP_DURATION);

    return () => {
      if (finalTimerRef.current != null) {
        clearTimeout(finalTimerRef.current);
        finalTimerRef.current = null;
      }
    };
  }, [stepIndex, checkoutSessionId]);

  const logoSrc = RETAILER_LOGOS[product.retailer];
  const statusText = STEPS[stepIndex](product.retailer);

  return (
    <div className="flex h-full flex-col bg-white px-5" style={{ paddingBottom: SAFE_AREA.bottom }}>
      {/* Retailer header */}
      <div className="flex items-center gap-2 pt-4">
        {logoSrc && (
          <Image
            src={logoSrc}
            alt={product.retailer}
            width={22}
            height={22}
            className="rounded"
            unoptimized
          />
        )}
        <span className="text-sm font-semibold text-zinc-900">{product.retailer}</span>
      </div>

      {/* Title row with spinner */}
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-light text-zinc-900">Completing your order</h1>
        <SegmentedRingSpinner size={28} />
      </div>

      {/* Animated status text */}
      <div className="mt-3 h-6">
        <div
          key={stepIndex}
          className="animate-fade-in text-sm text-zinc-500"
        >
          <WaveText text={statusText} />
        </div>
      </div>

      {/* Product summary card */}
      <div className="mt-5">
        <ProductSummaryCard product={product} compact />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom info banner */}
      <div className="mb-4 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-blue-500"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
        <span className="text-xs text-zinc-600">
          Stay on this page until your order is complete
        </span>
      </div>
    </div>
  );
}
