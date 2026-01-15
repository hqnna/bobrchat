import type { UIMessage } from "ai";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";

import { auth } from "~/features/auth/lib/auth";
import { isThreadOwnedByUser, renameThreadById, saveMessage } from "~/features/chat/queries";
import { formatProviderError } from "~/features/chat/server/error";
import { generateThreadTitle } from "~/features/chat/server/naming";
import { streamChatResponse } from "~/features/chat/server/service";
import { getUserSettings } from "~/features/settings/queries";
import { resolveKey } from "~/lib/api-keys/server";

export type SourceInfo = {
  id: string;
  sourceType: string;
  url?: string;
  title?: string;
};

export type CostBreakdown = {
  model: number;
  search: number;
  ocr: number;
  total: number;
};

export type MessageMetadata = {
  inputTokens: number;
  outputTokens: number;
  costUSD: CostBreakdown;
  model: string;
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
  sources?: SourceInfo[];
};

export type ChatUIMessage = UIMessage<MessageMetadata> & {
  stoppedByUser?: boolean;
  stoppedModelId?: string | null;
  searchEnabled?: boolean | null;
  reasoningLevel?: string | null;
};

export async function POST(req: Request) {
  return Sentry.startSpan(
    { op: "http.server", name: "POST /api/chat" },
    async (span) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { messages, threadId, openrouterClientKey, parallelClientKey, searchEnabled, reasoningLevel, modelId, modelSupportsFiles, supportsNativePdf, isRegeneration }: { messages: ChatUIMessage[]; threadId?: string; openrouterClientKey?: string; parallelClientKey?: string; searchEnabled?: boolean; reasoningLevel?: string; modelId?: string; modelSupportsFiles?: boolean; supportsNativePdf?: boolean; isRegeneration?: boolean }
        = await req.json();

      const baseModelId = modelId || "google/gemini-3-flash-preview";

      span.setAttribute("chat.model", baseModelId);
      span.setAttribute("chat.messageCount", messages.length);
      span.setAttribute("chat.searchEnabled", searchEnabled ?? false);
      span.setAttribute("chat.reasoningLevel", reasoningLevel ?? "none");
      span.setAttribute("chat.isRegeneration", isRegeneration ?? false);

      if (threadId) {
        const isOwned = await isThreadOwnedByUser(threadId, session.user.id);
        if (!isOwned) {
          return new Response(JSON.stringify({ error: "Thread not found or unauthorized" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        const lastMessage = messages[messages.length - 1];

        if (lastMessage?.role === "user" && !isRegeneration) {
          await saveMessage(threadId, session.user.id, lastMessage, { searchEnabled, reasoningLevel });
        }
      }

      const [openrouterKey, parallelKey] = await Promise.all([
        resolveKey(session.user.id, "openrouter", openrouterClientKey),
        searchEnabled ? resolveKey(session.user.id, "parallel", parallelClientKey) : Promise.resolve(undefined),
      ]);

      if (!openrouterKey) {
        return new Response(JSON.stringify({ error: "No API key configured. Provide a browser key or store one on the server." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (searchEnabled && !parallelKey) {
        return new Response(JSON.stringify({ error: "Web search is enabled but no Parallel API key configured. Provide a browser key or store one on the server." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const settings = await getUserSettings(session.user.id);

      const { stream, createMetadata } = await streamChatResponse(
        messages,
        baseModelId,
        session.user.id,
        openrouterKey,
        searchEnabled,
        parallelKey,
        undefined,
        modelSupportsFiles,
        {
          useOcrForPdfs: settings.useOcrForPdfs,
          supportsNativePdf: supportsNativePdf ?? false,
        },
        reasoningLevel,
      );

      if (threadId && messages.length === 1 && messages[0].role === "user") {
        const firstMessage = messages[0];
        const userMessage = firstMessage.parts
          ? firstMessage.parts
              .filter(p => p.type === "text")
              .map(p => (p as { text: string }).text)
              .join("")
          : "";

        if (settings.autoThreadNaming) {
          (async () => {
            try {
              const title = await generateThreadTitle(userMessage, openrouterKey);
              await renameThreadById(threadId, session.user.id, title);
            }
            catch (error) {
              Sentry.captureException(error, { tags: { operation: "auto-rename" } });
            }
          })();
        }
      }

      const response = stream.toUIMessageStreamResponse({
        originalMessages: messages,
        messageMetadata: ({ part }) => {
          const metadata = createMetadata(part);
          return metadata;
        },
        onFinish: async ({ responseMessage }) => {
          if (threadId) {
            await saveMessage(threadId, session.user.id, responseMessage);
          }
        },
        sendSources: true,
        onError: (error) => {
          Sentry.captureException(error, { tags: { operation: "chat-stream" } });
          return formatProviderError(error);
        },
      });

      return response;
    },
  );
}
