"use client";

import { forwardRef } from "react";
import Image from "next/image";

const COLOR_CLASSES: Record<string, { base: string; hover: string }> = {
  blue: { base: "bg-blue-600", hover: "hover:bg-blue-700" },
  dark: { base: "bg-zinc-900", hover: "hover:bg-zinc-800" },
};

interface CtaButtonProps {
  label: string;
  onClick: () => void;
  /** Color preset — "blue" (default) or "dark" */
  color?: keyof typeof COLOR_CLASSES;
  /** Optional image rendered after the label */
  image?: { src: string; alt: string; width: number; height: number };
}

export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(
  function CtaButton({ label, onClick, color = "blue", image }, ref) {
    const { base, hover } = COLOR_CLASSES[color] ?? COLOR_CLASSES.blue;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white ${base} ${hover}`}
      >
        <span>{label}</span>
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="h-5 w-auto"
            unoptimized
          />
        )}
      </button>
    );
  }
);
