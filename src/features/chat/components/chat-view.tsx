"use client";

import type { UseChatHelpers } from "@ai-sdk/react";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { ChatUIMessage } from "~/app/api/chat/route";
import type { LandingPageContentType } from "~/features/settings/types";

import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useChatScroll } from "~/features/chat/hooks/use-chat-scroll";
import { cn } from "~/lib/utils";

import type { PendingFile } from "./messages/file-preview";
import type { EditedMessagePayload } from "./messages/inline-message-editor";

import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { LandingPageContent } from "./landing/landing-page-content";

export function ChatView({
  messages,
  input,
  setInput,
  sendMessage,
  isLoading,
  onStop,
  threadId,
  searchEnabled,
  onSearchChangeAction,
  reasoningLevel,
  onReasoningChangeAction,
  landingPageContent,
  showLandingPage,
  onRegenerate,
  isRegenerating,
  onEditMessage,
  isEditSubmitting,
}: {
  messages: ChatUIMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: UseChatHelpers<ChatUIMessage>["sendMessage"];
  isLoading?: boolean;
  onStop?: () => void;
  threadId?: string;
  searchEnabled?: boolean;
  onSearchChangeAction?: (enabled: boolean) => void;
  reasoningLevel?: string;
  onReasoningChangeAction?: (level: string) => void;
  landingPageContent?: LandingPageContentType;
  showLandingPage?: boolean;
  onRegenerate?: (messageId: string) => void;
  isRegenerating?: boolean;
  onEditMessage?: (messageId: string, payload: EditedMessagePayload) => Promise<void>;
  isEditSubmitting?: boolean;
}) {
  const { scrollRef, messagesEndRef, isInitialScrollComplete } = useChatScroll(messages, { threadId });

  const [showBetaBanner, setShowBetaBanner] = useState(false);

  useEffect(() => {
    const hide = window.localStorage.getItem("bobrchat-hide-beta-banner") === "true";
    setShowBetaBanner(!hide);
  }, []);

  const handleSendMessage = useCallback((content: string, files?: PendingFile[]) => {
    const fileUIParts = files?.map(f => ({
      type: "file" as const,
      id: f.id,
      url: f.url,
      storagePath: f.storagePath,
      mediaType: f.mediaType,
      filename: f.filename,
    }));

    sendMessage({
      text: content,
      files: fileUIParts,
    });
  }, [sendMessage]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, [setInput]);

  const showLandingPageContent = messages.length === 0 && showLandingPage && landingPageContent !== undefined && landingPageContent !== "blank";

  return (
    <div className="flex h-full max-h-screen flex-col">
      <div className={cn(!showBetaBanner && "invisible h-0", `
        bg-primary text-primary-foreground relative w-full p-2 text-center
        text-sm font-medium
      `)}
      >
        <span>
          BobrChat is currently in beta. Please report any issues or feedback via
          {" "}
          <Link
            href="https://github.com/matthew-hre/bobrchat-issues/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              hover:text-primary-foreground/80
              underline
            `}
          >
            GitHub Issues
          </Link>
          . Thanks for testing!
        </span>
        <Button
          className="absolute top-1.5 right-4 size-6"
          variant="ghost"
          size="sm"
          onClick={() => {
            window.localStorage.setItem("bobrchat-hide-beta-banner", "true");
            setShowBetaBanner(false);
          }}
        >
          <XIcon size={16} />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1" ref={scrollRef}>
        {messages.length === 0 && (
          <div
            className={cn(
              `
                flex justify-center p-4 pt-[33vh] transition-all duration-300
                ease-in-out
              `,
              showLandingPageContent
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <div className="h-max w-full max-w-lg">
              <LandingPageContent
                type={landingPageContent!}
                isVisible={!!showLandingPageContent}
                onSuggestionClickAction={handleSuggestionClick}
              />
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className={cn(
          "origin-bottom transition-all duration-300 ease-out",
          isInitialScrollComplete && !showLandingPageContent
            ? "translate-y-0 scale-100 opacity-100"
            : `translate-y-2 scale-99 opacity-0`,
        )}
        >
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            searchEnabled={searchEnabled}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            onEditMessage={onEditMessage}
            isEditSubmitting={isEditSubmitting}
          />
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      <div className="shrink-0">
        <ChatInput
          value={input}
          onValueChange={setInput}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={onStop}
          searchEnabled={searchEnabled}
          onSearchChangeAction={onSearchChangeAction}
          reasoningLevel={reasoningLevel}
          onReasoningChangeAction={onReasoningChangeAction}
        />
      </div>
    </div>
  );
}
