"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Retailer, RETAILER_LOGOS } from "@/components/product";
import { SAFE_AREA } from "@/components/DeviceFrame";

interface BaseModalProps {
  retailer?: Retailer;
  onClose: () => void;
  ariaLabelledBy: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function RetailerHeader({ retailer }: { retailer: Retailer }) {
  const logoSrc = RETAILER_LOGOS[retailer];
  const initial = retailer.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={retailer}
          width={22}
          height={22}
          className="rounded"
          unoptimized
        />
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-white">
          {initial}
        </span>
      )}
      <span className="text-sm font-semibold text-zinc-900">{retailer}</span>
    </div>
  );
}

export function BaseModal({
  retailer,
  onClose,
  ariaLabelledBy,
  children,
  footer,
}: BaseModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, 250);
  }, [closing, onClose]);

  // Save and restore focus; clear close timer on unmount
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      returnFocusRef.current?.focus();
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Focus trap + Escape
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!sheet.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col backdrop-blur-sm transition-colors duration-250 ${closing ? "pointer-events-none bg-black/0" : "bg-black/40"}`}
      style={{ borderRadius: "inherit" }}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={`relative mt-auto flex max-h-[90%] flex-col rounded-t-2xl bg-white ${closing ? "animate-sheet-out" : "animate-sheet-in"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: SAFE_AREA.bottom }}
      >

        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        <div className={`flex items-center px-5 pt-2 pb-1 ${retailer ? "justify-between" : "justify-end"}`}>
          {retailer && <RetailerHeader retailer={retailer} />}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center text-zinc-500"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {retailer && <div className="mx-5 border-t border-zinc-200" />}

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none px-5 pt-3">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 pb-3 pt-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
