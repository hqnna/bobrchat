/* eslint-disable react/no-array-index-key */
"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ChatUIMessage } from "~/app/api/chat/route";
import type { FileUIPart, ReasoningUIPart, SearchToolUIPart } from "~/features/chat/types";

import { Button } from "~/components/ui/button";
import {
  isFilePart,
  isReasoningPart,
  isSearchToolPart,
  isTextPart,
  isToolError,
} from "~/features/chat/types";
import { cn } from "~/lib/utils";

import { MessageAttachments } from "./messages/file-preview";
import { MemoizedMarkdown } from "./messages/markdown";
import { ReasoningContent } from "./ui/reasoning-content";
import { SearchingSources } from "./ui/searching-sources";

function SharedCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy message content");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      title="Copy message content"
      className="h-6 w-6 p-0"
    >
      {copied
        ? <CheckIcon className="h-3.5 w-3.5" />
        : <CopyIcon className="h-3.5 w-3.5" />}
    </Button>
  );
}

function extractTextAndAttachments(message: ChatUIMessage): {
  textContent: string;
  attachments: Array<{ url: string; filename?: string; mediaType?: string }>;
} {
  const textParts: string[] = [];
  const attachments: Array<{ url: string; filename?: string; mediaType?: string }> = [];

  for (const part of message.parts) {
    if (isTextPart(part)) {
      textParts.push(part.text);
    }
    else if (isFilePart(part)) {
      const filePart = part as FileUIPart;
      if (filePart.url || filePart.filename) {
        attachments.push({
          url: filePart.url || "",
          filename: filePart.filename,
          mediaType: filePart.mediaType,
        });
      }
    }
  }

  return {
    textContent: textParts.join(""),
    attachments,
  };
}

type SharedChatMessagesProps = {
  messages: ChatUIMessage[];
  showAttachments: boolean;
};

export function SharedChatMessages({ messages, showAttachments }: SharedChatMessagesProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 py-8">
      {messages.map((message) => {
        if (message.role === "user") {
          const { textContent, attachments } = extractTextAndAttachments(message);

          return (
            <div
              key={message.id}
              className="flex w-full flex-col items-end gap-2"
            >
              <div className={`
                relative w-full max-w-[80%]
                md:max-w-[70%]
              `}
              >
                <div className="flex flex-col items-end">
                  <div className="group flex w-full flex-col items-end gap-2">
                    {textContent && (
                      <div
                        className={`
                          bg-primary text-primary-foreground prose prose-sm
                          rounded-2xl rounded-br-sm px-4 py-2.5
                        `}
                      >
                        <p className="wrap-break-word whitespace-pre-wrap">{textContent}</p>
                        {attachments.length > 0 && (
                          <MessageAttachments
                            attachments={attachments}
                            showContent={showAttachments}
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={cn(
                        `
                          text-muted-foreground flex items-center gap-2 text-xs
                          transition-opacity duration-200
                        `,
                        `
                          opacity-0
                          group-hover:opacity-100
                        `,
                      )}
                    >
                      <SharedCopyButton content={textContent} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const assistantTextContent = message.parts
          .filter(part => isTextPart(part))
          .map(part => part.text)
          .join("");
        const modelName = message.metadata?.model;

        return (
          <div key={message.id} className="group markdown text-base">
            {message.parts.map((part, index) => {
              if (isReasoningPart(part)) {
                const reasoningPart = part as ReasoningUIPart;

                const cleanedText = (reasoningPart.text || "")
                  .replace(/\n\s*\[REDACTED\]/g, "")
                  .replace(/\[REDACTED\]/g, "")
                  .replace(/\\n/g, "\n")
                  .replace(/\n\s*\n/g, "\n")
                  .trim();
                if (!cleanedText) {
                  return null;
                }

                return (
                  <ReasoningContent
                    key={`part-${index}`}
                    content={cleanedText}
                    isThinking={false}
                  />
                );
              }

              if (isTextPart(part)) {
                return (
                  <MemoizedMarkdown
                    key={`part-${index}`}
                    id={`${message.id}-${index}`}
                    content={part.text}
                  />
                );
              }

              // SDK v6: tool parts use `tool-${toolName}` pattern
              if (isSearchToolPart(part)) {
                const searchPart = part as SearchToolUIPart;
                let sources: Array<{ id: string; sourceType: string; url: string; title: string }> = [];
                let searchError: string | undefined;

                // Handle error state
                if (isToolError(searchPart.state)) {
                  searchError = searchPart.errorText || "Search failed";
                }
                // Handle output error in result
                else if (searchPart.output?.error) {
                  searchError = searchPart.output.message || "Search failed";
                }
                // Handle successful results
                else if (searchPart.output?.results && Array.isArray(searchPart.output.results)) {
                  sources = searchPart.output.results.map(r => ({
                    id: r.url || Math.random().toString(),
                    sourceType: "url",
                    url: r.url,
                    title: r.title,
                  }));
                }

                return (
                  <SearchingSources
                    key={`part-${index}`}
                    sources={sources}
                    isSearching={false}
                    error={searchError}
                  />
                );
              }

              return null;
            })}
            <div
              className={cn(
                `
                  text-muted-foreground mt-2 flex items-center gap-2 text-xs
                  transition-opacity duration-200
                `,
                `
                  opacity-0
                  group-hover:opacity-100
                `,
              )}
            >
              <SharedCopyButton content={assistantTextContent} />
              {modelName && <span className="font-medium">{modelName}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
