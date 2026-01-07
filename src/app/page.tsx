"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ChatView } from "~/components/chat/chat-view";
import { useUserSettingsContext } from "~/components/settings/user-settings-provider";
import { useChatInputFeatures } from "~/hooks/use-chat-input-features";
import { createNewThread } from "~/server/actions/chat";

export default function HomePage(): React.ReactNode {
  const router = useRouter();
  const { settings, loading } = useUserSettingsContext();
  const [input, setInput] = useState<string>("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const { features } = useChatInputFeatures(
    { key: "search", defaultValue: false, persist: true },
  );

  const handleSendMessage = async (messageParts: any) => {
    try {
      setIsCreatingThread(true);
      const threadId = await createNewThread(settings?.defaultThreadName);

      // Store the pending message to be sent by ChatThread
      sessionStorage.setItem("pending_message", JSON.stringify(messageParts));

      // Navigate to the thread
      router.push(`/chat/${threadId}`);
    }
    catch (error) {
      setIsCreatingThread(false);
      const message = error instanceof Error ? error.message : "Failed to create thread. Please try again.";
      toast.error(message);
    }
  };

  return (
    <ChatView
      messages={[]}
      input={input}
      setInput={setInput}
      sendMessage={handleSendMessage}
      isLoading={isCreatingThread}
      searchEnabled={features.search.value}
      onSearchChange={(enabled) => {
        features.search.setValue(enabled);
      }}
      landingPageContent={loading ? undefined : settings?.landingPageContent ?? "suggestions"}
      showLandingPage={!input.trim()}
    />
  );
}
