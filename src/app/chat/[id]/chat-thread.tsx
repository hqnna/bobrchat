"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { use, useEffect, useRef, useState } from "react";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { ChatView } from "~/components/chat/chat-view";
import { useChatInputFeatures } from "~/hooks/use-chat-input-features";
import { createUserMessage } from "~/lib/utils/messages";
import { saveUserMessage } from "~/server/actions/chat";

type ChatThreadProps = {
  params: Promise<{ id: string }>;
  initialMessages: ChatUIMessage[];
};

function ChatThread({ params, initialMessages }: ChatThreadProps): React.ReactNode {
  const [input, setInput] = useState<string>("");
  const [browserApiKey, setBrowserApiKey] = useState<string | null>(null);
  const { id } = use(params);

  const { features, getLatestValues } = useChatInputFeatures(
    { key: "search", defaultValue: false, persist: true },
  );

  useEffect(() => {
    const key = localStorage.getItem("openrouter_api_key");
    if (key) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setBrowserApiKey(key);
    }
  }, []);

  // Keep ref for browserApiKey for closure
  const browserApiKeyRef = useRef(browserApiKey);
  useEffect(() => {
    browserApiKeyRef.current = browserApiKey;
  }, [browserApiKey]);

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: allMessages }) => {
        const latestValues = getLatestValues();
        const body = {
          messages: allMessages,
          threadId: id,
          searchEnabled: latestValues.search,
          ...(browserApiKeyRef.current && { browserApiKey: browserApiKeyRef.current }),
        };
        return { body };
      },
    }),
    messages: initialMessages,
  });

  const handleSendMessage = async (messageParts: any) => {
    const userMessage = createUserMessage(messageParts);

    // Save the user message first
    await saveUserMessage(id, userMessage);
    // Then send it
    sendMessage(messageParts);
  };

  return (
    <ChatView
      messages={messages}
      input={input}
      setInput={setInput}
      sendMessage={handleSendMessage}
      isLoading={status === "submitted" || status === "streaming"}
      searchEnabled={features.search.value}
      onSearchChange={(enabled) => {
        features.search.setValue(enabled);
      }}
    />
  );
}

export default ChatThread;
