/* eslint-disable react/no-array-index-key */
"use client";

import { memo, useMemo, useState } from "react";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { useChatUIStore } from "~/features/chat/store";

import type { EditedMessagePayload } from "./messages/inline-message-editor";

import { EditableUserMessage } from "./messages/editable-user-message";
import { MemoizedMarkdown } from "./messages/markdown";
import { LoadingSpinner } from "./ui/loading-spinner";
import { MessageMetrics } from "./ui/message-metrics";
import { ReasoningContent } from "./ui/reasoning-content";
import { SearchingSources } from "./ui/searching-sources";

export const ChatMessages = memo(({
  messages,
  isLoading,
  onRegenerate,
  isRegenerating,
  onEditMessage,
  isEditSubmitting,
}: {
  messages: ChatUIMessage[];
  isLoading?: boolean;
  onRegenerate?: (messageId: string) => void;
  isRegenerating?: boolean;
  onEditMessage?: (messageId: string, payload: EditedMessagePayload) => Promise<void>;
  isEditSubmitting?: boolean;
}) => {
  const stoppedAssistantMessageInfoById = useChatUIStore(state => state.stoppedAssistantMessageInfoById);
  const searchEnabled = useChatUIStore(state => state.searchEnabled);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const canEditMessages = !isLoading && !isRegenerating && !isEditSubmitting;

  // Filter out duplicate incomplete assistant messages
  // When a response is stopped, there may be two messages with the same tool calls or reasoning -
  // one incomplete (not marked stopped) and one properly marked as stopped
  const filteredMessages = useMemo(() => {
    const stats = {
      totalMessages: messages.length,
      stoppedMessages: 0,
      duplicatesRemoved: 0,
      signatureExtractions: 0,
      partsIterated: 0,
    };

    // Single-pass signature extraction helper
    // Extracts tool, reasoning, and text signatures in one iteration over parts
    const extractSignatures = (parts: ChatUIMessage["parts"]) => {
      const toolIds: string[] = [];
      const reasoningTexts: string[] = [];
      const textParts: string[] = [];

      for (const part of parts) {
        stats.partsIterated++;
        const p = part as any;
        if ((part.type === "tool-invocation" || part.type === "tool-search") && p.toolCallId) {
          toolIds.push(p.toolCallId);
        }
        else if (part.type === "reasoning") {
          reasoningTexts.push(p.text || "");
        }
        else if (part.type === "text") {
          textParts.push(part.text);
        }
      }

      // Truncate text-based signatures to limit memory usage
      const reasoningText = reasoningTexts.join("").slice(0, 200);
      const textContent = textParts.join("").slice(0, 200);

      return {
        tool: toolIds.length > 0 ? `tool:${toolIds.sort().join("|")}` : null,
        reasoning: reasoningText ? `reasoning:${reasoningText}` : null,
        text: textContent ? `text:${textContent}` : null,
      };
    };

    // First pass: collect stopped message signatures and track candidate duplicates
    const stoppedSignatures = new Set<string>();
    const candidateDuplicates: Array<{ index: number }> = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.role !== "assistant")
        continue;

      if (message.stoppedByUser === true) {
        stats.stoppedMessages++;
        stats.signatureExtractions++;
        const sigs = extractSignatures(message.parts);
        if (sigs.tool)
          stoppedSignatures.add(sigs.tool);
        if (sigs.reasoning)
          stoppedSignatures.add(sigs.reasoning);
        if (sigs.text)
          stoppedSignatures.add(sigs.text);
      }
      else {
        candidateDuplicates.push({ index: i });
      }
    }

    // Early exit: no stopped messages means no duplicates possible
    if (stoppedSignatures.size === 0) {
      return messages;
    }

    // Extract signatures for candidate duplicates and build exclusion set
    const excludeIndices = new Set<number>();
    for (const candidate of candidateDuplicates) {
      stats.signatureExtractions++;
      const sigs = extractSignatures(messages[candidate.index].parts);

      const isDuplicate
        = (sigs.tool && stoppedSignatures.has(sigs.tool))
          || (sigs.reasoning && stoppedSignatures.has(sigs.reasoning))
          || (sigs.text && stoppedSignatures.has(sigs.text));

      if (isDuplicate) {
        stats.duplicatesRemoved++;
        excludeIndices.add(candidate.index);
      }
    }

    const result = messages.filter((_, i) => !excludeIndices.has(i));

    return result;
  }, [messages]);

  const handleStartEdit = (messageId: string) => {
    if (canEditMessages) {
      setEditingMessageId(messageId);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  const handleSubmitEdit = async (messageId: string, payload: EditedMessagePayload) => {
    if (onEditMessage) {
      await onEditMessage(messageId, payload);
      setEditingMessageId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 py-8">
      {filteredMessages.map((message, messageIndex) => {
        const textContent = message.parts
          .filter(part => part.type === "text")
          .map(part => part.text)
          .join("");

        if (message.role === "user") {
          const nextMessage = filteredMessages[messageIndex + 1];
          const previousModelId = nextMessage?.role === "assistant"
            ? (nextMessage.metadata?.model || nextMessage.stoppedModelId || stoppedAssistantMessageInfoById[nextMessage.id]?.modelId || null)
            : null;

          return (
            <EditableUserMessage
              key={message.id}
              message={message}
              previousModelId={previousModelId}
              isEditing={editingMessageId === message.id}
              onStartEdit={() => handleStartEdit(message.id)}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={payload => handleSubmitEdit(message.id, payload)}
              canEdit={canEditMessages && !!onEditMessage}
              isSubmitting={isEditSubmitting}
            />
          );
        }

        const isLastMessage = messageIndex === filteredMessages.length - 1;

        const stoppedInfo = stoppedAssistantMessageInfoById[message.id];
        const persistedStopped = message.stoppedByUser === true;
        const stoppedModelId = message.stoppedModelId as string | null | undefined;
        const isStopped = persistedStopped || !!stoppedInfo;

        return (
          <div key={message.id} className="group markdown text-base">
            {message.parts.map((part, index) => {
              if (part.type === "reasoning") {
                const reasoningPart = part as {
                  type: "reasoning";
                  text: string;
                  state?: string;
                };

                // Strip [REDACTED] (including leading newlines before it) and skip if empty
                const cleanedText = (reasoningPart.text || "")
                  .replace(/\n\s*\[REDACTED\]/g, "") // Remove newlines before [REDACTED]
                  .replace(/\[REDACTED\]/g, "") // Remove any remaining [REDACTED]
                  .replace(/\\n/g, "\n") // Unescape literal \n to actual newlines
                  .replace(/\n\s*\n/g, "\n") // Collapse multiple newlines to single
                  .trim();
                if (!cleanedText) {
                  return null;
                }

                const isComplete = reasoningPart.state === "done";
                const isThinking = !isComplete;
                // Only show active thinking if we're currently loading
                // Otherwise, incomplete reasoning should show as stopped
                const isActivelyThinking = isThinking && isLoading && isLastMessage;
                // Only mark as stopped if the message was stopped AND reasoning wasn't complete
                const reasoningStopped = isStopped && !isComplete;

                return (
                  <ReasoningContent
                    key={`part-${index}`}
                    id={`${message.id}-reasoning-${index}`}
                    content={cleanedText}
                    isThinking={isActivelyThinking}
                    stopped={reasoningStopped}
                  />
                );
              }

              if (part.type === "text") {
                return (
                  <MemoizedMarkdown
                    key={`part-${index}`}
                    id={`${message.id}-${index}`}
                    content={part.text}
                  />
                );
              }

              const isSearchTool = part.type === "tool-search"
                || (part.type === "tool-invocation" && (part as any).toolName === "search");

              if (isSearchTool) {
                let sources: any[] = [];
                let isSearching = false;
                let searchError: string | undefined;

                const sp = part as any;

                // Handle "tool-search" (likely from DB persistence or custom format)
                if (sp.type === "tool-search") {
                  if (sp.output?.error) {
                    searchError = sp.output.message || "Search failed";
                  }
                  else if (sp.output?.results && Array.isArray(sp.output.results)) {
                    sources = sp.output.results.map((r: any) => ({
                      id: r.url || Math.random().toString(),
                      sourceType: "url",
                      url: r.url,
                      title: r.title,
                    }));
                  }
                  // Only show as actively searching if we're currently loading
                  // Otherwise, incomplete searches should show as stopped
                  isSearching = !!isLoading && isLastMessage && !sp.output && sp.state !== "done" && sp.state !== "output-available";
                }
                // Handle "tool-invocation" (standard AI SDK during stream)
                else if (sp.type === "tool-invocation") {
                  if (sp.state === "result") {
                    const result = sp.result;
                    if (result?.error) {
                      searchError = result.message || "Search failed";
                    }
                    else {
                      const results = result?.results || (Array.isArray(result) ? result : []);
                      sources = results.map((r: any) => ({
                        id: r.url || Math.random().toString(),
                        sourceType: "url",
                        url: r.url,
                        title: r.title,
                      }));
                    }
                  }
                  else {
                    // Only show as actively searching if we're currently loading
                    isSearching = !!isLoading && isLastMessage;
                  }
                }

                // Check if the search tool call actually completed
                const searchComplete = sp.type === "tool-search"
                  ? (sp.state === "done" || sp.state === "output-available" || !!sp.output)
                  : (sp.state === "result");

                // Only mark as stopped if the message was stopped AND search wasn't complete
                const searchStopped = isStopped && !searchComplete;

                return (
                  <SearchingSources
                    key={`part-${index}`}
                    id={`${message.id}-search-${index}`}
                    sources={sources}
                    isSearching={isSearching}
                    error={searchError}
                    stopped={searchStopped}
                  />
                );
              }

              return null;
            })}

            {/* Fallback for initial searching state before any parts or tool calls exist */}
            {isLoading && isLastMessage && searchEnabled && message.parts.length === 0 && (
              <SearchingSources id={`${message.id}-search-fallback`} sources={[]} isSearching={true} />
            )}

            {(message.metadata || isStopped) && (
              <MessageMetrics
                metrics={{
                  id: message.id,
                  model: message.metadata?.model || stoppedModelId || stoppedInfo?.modelId || (isStopped ? "unknown" : null),
                  tokensPerSecond: message.metadata ? message.metadata.tokensPerSecond.toFixed(2) : null,
                  totalTokens: message.metadata ? message.metadata.inputTokens + message.metadata.outputTokens : null,
                  inputTokens: message.metadata ? message.metadata.inputTokens : null,
                  outputTokens: message.metadata ? message.metadata.outputTokens : null,
                  ttft: message.metadata ? message.metadata.timeToFirstTokenMs : null,
                  costUsd: message.metadata
                    ? message.metadata.costUSD
                    : null,
                  content: textContent,
                  sourceCount: message.metadata?.sources ? message.metadata.sources.length : null,
                }}
                onRetry={() => onRegenerate?.(message.id)}
                isRetrying={isRegenerating}
                variant={isStopped ? "minimal" : "full"}
                stopped={isStopped}
              />
            )}
          </div>
        );
      })}
      {isLoading && <LoadingSpinner />}
    </div>
  );
});
