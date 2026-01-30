"use client";

import { GoogleLogo } from "./GoogleLogo";

export type HeaderVariant = "idle" | "active";

interface HeaderProps {
  variant: HeaderVariant;
}

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-700"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-600"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-600"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-purple-600"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

function IdleHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Back arrow - decorative only */}
      <div className="flex h-8 w-8 items-center justify-center">
        <BackArrowIcon />
      </div>

      {/* Google logo - centered */}
      <div className="flex items-center justify-center">
        <GoogleLogo size={24} />
      </div>

      {/* History icon - decorative only */}
      <div className="flex h-8 w-8 items-center justify-center">
        <HistoryIcon />
      </div>
    </div>
  );
}

function ActiveHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Google logo - left */}
      <GoogleLogo size={28} />

      {/* Icons - right */}
      <div className="flex items-center gap-4">
        <HistoryIcon />
        <EditIcon />
        <ProfileIcon />
      </div>
    </div>
  );
}

export function Header({ variant }: HeaderProps) {
  if (variant === "idle") {
    return <IdleHeader />;
  }
  return <ActiveHeader />;
}
