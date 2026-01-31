"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GoogleLogo } from "@/components/chat";
import { Retailer, RETAILER_LOGOS } from "@/components/product";
import { BaseModal } from "./BaseModal";
import { CtaButton } from "./CtaButton";

interface CreateAccountModalProps {
  retailerName: Retailer;
  customerEmail: string;
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

export function CreateAccountModal({ retailerName, customerEmail, onClose, onContinue }: CreateAccountModalProps) {
  const logoSrc = RETAILER_LOGOS[retailerName];
  const initial = retailerName.charAt(0).toUpperCase();
  const continueRef = useRef<HTMLButtonElement>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <BaseModal
      onClose={onClose}
      ariaLabelledBy="create-account-title"
      footer={
        <CtaButton ref={continueRef} label="Continue" onClick={onContinue} />
      }
    >
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
        <span className="text-sm text-zinc-700">{customerEmail}</span>
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
          Google&apos;s{" "}
          <span className="text-blue-600">Privacy Policy</span> and{" "}
          <span className="text-blue-600">Terms of Service</span> to
          understand how Google will process and protect your data.
        </p>
      </div>
    </BaseModal>
  );
}
