"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChatView } from "~/features/chat/components/chat-view";
import { useSession } from "~/features/auth/lib/auth-client";
import { useUserSettings } from "~/features/settings/hooks/use-user-settings";
import { useCreateThread } from "~/features/chat/hooks/use-threads";
import { useChatUIStore } from "~/features/chat/store";

export default function HomePage(): React.ReactNode {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: settings, isLoading } = useUserSettings({
    enabled: !!session,
  });
  const { input, setInput, searchEnabled, setSearchEnabled, setPendingMessage } = useChatUIStore();
  const createThread = useCreateThread();

  // TODO: Properly type this
  const handleSendMessage = async (messageParts: any) => {
    try {
      const threadId = await createThread.mutateAsync(settings?.defaultThreadName);
      setPendingMessage(messageParts);
      router.push(`/chat/${threadId}`);
    }
    catch (error) {
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
      isLoading={createThread.isPending}
      searchEnabled={searchEnabled}
      onSearchChange={setSearchEnabled}
      landingPageContent={isLoading ? undefined : settings?.landingPageContent ?? "suggestions"}
      showLandingPage={!input.trim()}
    />
  );
}
