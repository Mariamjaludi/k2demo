"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Retailer, type Product, ProductSummaryCard } from "@/components/product";
import { DEMO_CARD_LAST4, type OrderTotals, type CustomerInfo } from "@/lib/agentFlow/types";
import { BaseModal } from "./BaseModal";
import { CtaButton } from "./CtaButton";
import { PaySummary } from "./PaySummary";

interface ReviewOrderModalProps {
  product: Product;
  totals: OrderTotals;
  customer: CustomerInfo;
  onClose: () => void;
  onPay: () => void;
}

function InfoRow({
  icon,
  label,
  title,
  subtitle,
  tag,
  iconRound = true,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  tag?: string;
  iconRound?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-zinc-100 px-3 py-2.5" aria-label={label}>
      <div className="flex w-11 shrink-0 items-center justify-center">
        {iconRound ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
            {icon}
          </div>
        ) : (
          icon
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-900">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-zinc-500">{subtitle}</p>
          {tag && (
            <span className="whitespace-nowrap rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              {tag}
            </span>
          )}
        </div>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-zinc-400"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function ReviewOrderModal({
  product,
  totals,
  customer,
  onClose,
  onPay,
}: ReviewOrderModalProps) {
  const displayName = customer.name ?? customer.email;
  const address = customer.address;
  const addressLine = address
    ? `${address.address_line1}, ${address.city} ${address.postcode ?? ""}, Saudi Arabia`.trim()
    : "";
  const payRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    payRef.current?.focus();
  }, []);

  const shippingLabel = totals.shipping === 0 ? "Free Shipping" : "Standard Shipping";
  const shippingSubtitle = totals.shipping === 0 ? "Priority overnight" : "2–3 business days";
  const memberTag = product.retailer === Retailer.Jarir ? `${product.retailer} member benefit` : undefined;

  return (
    <BaseModal
      retailer={product.retailer}
      onClose={onClose}
      ariaLabelledBy="review-order-title"
      footer={
        <>
          <CtaButton
            ref={payRef}
            label="Pay with"
            onClick={onPay}
            color="dark"
            image={{ src: "/madaLogo.svg", alt: "mada", width: 60, height: 20 }}
          />
          <p className="terms-of-service mt-2 text-[8px] leading-normal text-zinc-400">
            By continuing, you&apos;re placing an order with {product.retailer} (or a marketplace
            seller) and agree to their{" "}
            <span className="text-zinc-500 underline">terms</span> and{" "}
            <span className="text-zinc-500 underline">return policy</span>.
            Google shares necessary Mada info with {product.retailer} to process orders
            and prevent fraud. {product.retailer} or marketplace seller may use your order data
            for analytics, personalization, and ads per their{" "}
            <span className="text-zinc-500 underline">privacy policy</span>.
            Google is not responsible for final payment calculation or processing, order
            fulfillment, returns, or customer support. The Payments Privacy Notice applies.{" "}
            <span className="text-zinc-500 underline">Learn more</span>
          </p>
        </>
      }
    >
      <h2 id="review-order-title" className="text-lg font-medium text-zinc-900">
        Review your order
      </h2>

      <div className="mt-3">
        <ProductSummaryCard product={product} compact />
      </div>

      <div className="mt-2">
        <InfoRow
          icon={
            <Image
              src="/SaabBankCard.png"
              alt="SAB card"
              width={44}
              height={28}
              className="h-7 w-11 rounded object-cover"
              unoptimized
            />
          }
          iconRound={false}
          label="Payment method"
          title="Saudi Awwal Bank (SAB)"
          subtitle={`Visa ··${DEMO_CARD_LAST4}`}
        />
      </div>

      <div className="mt-2">
        <InfoRow
          icon={<LocationIcon />}
          label="Shipping address"
          title={displayName}
          subtitle={addressLine}
        />
      </div>

      <div className="mt-2">
        <InfoRow
          icon={<TruckIcon />}
          label="Shipping method"
          title={shippingLabel}
          subtitle={shippingSubtitle}
          tag={memberTag}
        />
      </div>

      <div className="mt-3 pb-2">
        <PaySummary
          retailerName={product.retailer}
          subtotal={totals.subtotal}
          shipping={totals.shipping}
          vat={totals.vat}
          total={totals.total}
          currency={totals.currency}
        />
      </div>
    </BaseModal>
  );
}
