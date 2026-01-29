"use client";

import { useState } from "react";
import { IdleChatInput } from "./IdleChatInput";
import { SimulatedKeyboard } from "./SimulatedKeyboard";
import { ChatMessagesList } from "./ChatMessage";
import { SAFE_AREA } from "../DeviceFrame";
import type { ChatMessage } from "@/lib/agentFlow/types";

interface ChatIdleScreenProps {
  queryText: string;
  onQueryChange: (text: string) => void;
  onSubmit: () => void;
  messages?: ChatMessage[];
}

export function ChatIdleScreen({
  queryText,
  onQueryChange,
  onSubmit,
  messages = [],
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
      className="flex min-h-0 flex-1 flex-col bg-white"
      style={{
        paddingBottom: keyboardVisible ? 0 : SAFE_AREA.bottom,
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatMessagesList messages={messages} />
      </div>

      <IdleChatInput
        value={queryText}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onFocus={handleFocus}
        placeholder="Message"
      />

      <SimulatedKeyboard visible={keyboardVisible} />
    </div>
  );
}
