"use client";

import { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatComposer } from "./ChatComposer";
import { SimulatedKeyboard } from "./SimulatedKeyboard";
import { SAFE_AREA } from "../DeviceFrame";

interface ChatIdleScreenProps {
  queryText: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
}

export function ChatIdleScreen({
  queryText,
  onQueryChange,
  onSubmit,
}: ChatIdleScreenProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const handleFocus = () => {
    setKeyboardVisible(true);
  };

  const handleSubmit = () => {
    setKeyboardVisible(false);
    onSubmit();
  };

  return (
    <div
      className="flex h-full flex-col bg-white"
      style={{ paddingTop: SAFE_AREA.topInset }}
    >
      {/* Header */}
      <ChatHeader />

      {/* Message area - empty for idle state */}
      <div className="flex-1 overflow-y-auto">
        {/* Messages would render here */}
      </div>

      {/* Composer */}
      <ChatComposer
        value={queryText}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onFocus={handleFocus}
        placeholder="Message"
      />

      {/* Simulated keyboard */}
      <SimulatedKeyboard visible={keyboardVisible} />
    </div>
  );
}
