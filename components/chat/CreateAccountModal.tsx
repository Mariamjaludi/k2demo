"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GoogleLogo } from "./GoogleLogo";
import { Retailer, RETAILER_LOGOS } from "./ProductCard";
import { SAFE_AREA } from "../DeviceFrame";

interface CreateAccountModalProps {
  retailerName: Retailer;
  onClose: () => void;
  onContinue: () => void;
}

const CAPABILITY_ROWS = [
  {
    label: "See your loyalty program info and history",
    detail: "View your points balance, tier status, and past reward redemptions.",
  },
  {
    label: "Manage your orders",
    detail: "Track shipments, view order history, and initiate returns or exchanges.",
  },
  {
    label: "Manage post-purchase activities",
    detail: "Access warranties, schedule services, and manage product registrations.",
  },
];

const MOCK_EMAIL = "elisa.g.beckett@gmail.com";

export function CreateAccountModal({ retailerName, onClose, onContinue }: CreateAccountModalProps) {
  const logoSrc = RETAILER_LOGOS[retailerName];
  const initial = retailerName.charAt(0).toUpperCase();
  const sheetRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Autofocus Continue button on mount
  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  // Trap focus inside the dialog
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-black/40 backdrop-blur-sm"
      style={{ borderRadius: "inherit" }}
      onClick={onClose}
      role="button"
      tabIndex={-1}
      aria-label="Close modal"
    >
      {/* Modal sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-account-title"
        className="relative mt-auto flex max-h-[75%] flex-col rounded-t-2xl bg-white animate-sheet-in"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: SAFE_AREA.bottom }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-zinc-300" />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pt-2">
          <button
            type="button"
            onClick={onClose}
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

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {/* Logos */}
          <div className="flex items-center justify-center gap-3">
            <GoogleLogo size={28} />
            <div className="h-6 w-px bg-zinc-300" />
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={retailerName}
                width={28}
                height={28}
                className="rounded"
                unoptimized
              />
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-white">
                {initial}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 id="create-account-title" className="mt-5 text-center text-lg font-semibold text-zinc-900">
            Create a new {retailerName} account<br />with Google
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-center text-sm text-zinc-500">
            Your new {retailerName} account will use this email
          </p>

          {/* Email row */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-purple-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="text-sm text-zinc-700">{MOCK_EMAIL}</span>
          </div>

          {/* Capabilities section */}
          <div className="mt-6 rounded-lg bg-zinc-50">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">Google will be able to</p>
            </div>
            {CAPABILITY_ROWS.map((row, i) => {
              const isExpanded = expandedRow === i;
              return (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setExpandedRow(isExpanded ? null : i)}
                  aria-expanded={isExpanded}
                  className="flex w-full flex-col border-t border-zinc-200 px-4 py-3 text-left"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm text-zinc-700">{row.label}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  {isExpanded && (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                      {row.detail}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Privacy text */}
          <div className="mt-4 pb-4 text-justify text-xs leading-relaxed text-zinc-500">
            <p>
              To make changes, go to your{" "}
              <span className="text-blue-600">Google Account</span>.
            </p>
            <p>
              Learn how Google helps you{" "}
              <span className="text-blue-600">share data safely</span>.
            </p>
            <p>
              Review Google&apos;s{" "}
              <span className="text-blue-600">Privacy Policy</span> and{" "}
              <span className="text-blue-600">Terms of Service</span> to
              understand how Google will process and protect your data.
            </p>
          </div>
        </div>

        {/* Continue button */}
        <div className="shrink-0 px-6 pb-4 pt-2">
          <button
            ref={continueRef}
            type="button"
            onClick={onContinue}
            className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
