import type { UIMessage } from "ai";

import { headers } from "next/headers";

import { auth } from "~/lib/auth";
import { streamChatResponse } from "~/server/ai/service";
import { saveMessage } from "~/server/db/queries/chat";

export type MessageMetadata = {
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  model: string;
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
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

  const { messages, threadId, browserApiKey }: { messages: ChatUIMessage[]; threadId?: string; browserApiKey?: string }
    = await req.json();
  const modelId = "mistralai/ministral-8b";

  const { stream, createMetadata } = await streamChatResponse(messages, modelId, session.user.id, browserApiKey);

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
