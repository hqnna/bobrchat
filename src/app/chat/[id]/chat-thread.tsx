"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { use, useEffect } from "react";
import { toast } from "sonner";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { ChatView } from "~/components/chat/chat-view";
import { THREADS_KEY } from "~/lib/queries/use-threads";
import { useChatUIStore } from "~/lib/stores/chat-ui-store";

type ChatThreadProps = {
  params: Promise<{ id: string }>;
  initialMessages: ChatUIMessage[];
  hasApiKey: boolean;
};

function ChatThread({ params, initialMessages, hasApiKey }: ChatThreadProps): React.ReactNode {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const {
    input,
    setInput,
    clearInput,
    searchEnabled,
    setSearchEnabled,
    loadApiKeysFromStorage,
    consumePendingMessage,
    setStreamingThreadId,
  } = useChatUIStore();

  // Load API keys from localStorage on mount
  useEffect(() => {
    loadApiKeysFromStorage();
  }, [loadApiKeysFromStorage]);

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    id,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages: allMessages }) => {
        // Access Zustand state directly - always current, no refs needed
        const state = useChatUIStore.getState();
        const body = {
          messages: allMessages,
          threadId: id,
          searchEnabled: state.searchEnabled,
          ...(state.browserApiKey && { browserApiKey: state.browserApiKey }),
          ...(state.parallelApiKey && { parallelBrowserApiKey: state.parallelApiKey }),
          ...(state.selectedModelId && { modelId: state.selectedModelId }),
        };
        return { body };
      },
    }),
    messages: initialMessages,
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
    onFinish: () => {
      // Refresh the threads list to reflect any automatic renaming
      // We invalidate on every message finish to be safe, but it's most critical for the first one
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });

  useEffect(() => {
    const isStreaming = status === "submitted" || status === "streaming";
    setStreamingThreadId(isStreaming ? id : null);

    return () => {
      // Avoid leaving a stale indicator around if the user navigates away mid-stream.
      if (useChatUIStore.getState().streamingThreadId === id) {
        setStreamingThreadId(null);
      }
    };
  }, [id, setStreamingThreadId, status]);

  // Handle pending message from homepage
  useEffect(() => {
    const pending = consumePendingMessage();
    if (pending) {
      sendMessage(pending);
      clearInput();
    }
  }, [consumePendingMessage, sendMessage, clearInput]);

  return (
    <ChatView
      messages={messages}
      input={input}
      setInput={setInput}
      sendMessage={sendMessage}
      isLoading={status === "submitted" || status === "streaming"}
      searchEnabled={searchEnabled}
      onSearchChange={setSearchEnabled}
      hasApiKey={hasApiKey}
    />
  );
}

export default ChatThread;
