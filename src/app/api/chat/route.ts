import type { UIMessage } from "ai";

import { headers } from "next/headers";

import { auth } from "~/lib/auth";
import { streamChatResponse } from "~/server/ai/service";
import { getThreadById, saveMessage } from "~/server/db/queries/chat";
import { getServerApiKey } from "~/server/db/queries/settings";

export type SourceInfo = {
  id: string;
  sourceType: string;
  url?: string;
  title?: string;
};

export type MessageMetadata = {
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  model: string;
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
  sources?: SourceInfo[];
};

export type ChatUIMessage = UIMessage<MessageMetadata>;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, threadId, browserApiKey, searchEnabled }: { messages: ChatUIMessage[]; threadId?: string; browserApiKey?: string; searchEnabled?: boolean }
    = await req.json();

  if (threadId) {
    const thread = await getThreadById(threadId);
    if (!thread) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (thread.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const serverApiKey = await getServerApiKey(session.user.id, "openrouter");
  const resolvedApiKey = browserApiKey ?? serverApiKey;

  if (!resolvedApiKey) {
    return new Response(JSON.stringify({ error: "No API key configured. Provide a browser key or store one on the server." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const baseModelId = "google/gemini-3-flash-preview";
  const modelId = searchEnabled ? `${baseModelId}:online` : baseModelId;

  const { stream, createMetadata } = await streamChatResponse(messages, modelId, session.user.id, resolvedApiKey, searchEnabled);

  return stream.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => createMetadata(part),
    onFinish: async ({ responseMessage }) => {
      if (threadId) {
        await saveMessage(threadId, responseMessage);
      }
    },
  });
}
