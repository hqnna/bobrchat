import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/features/auth/lib/auth";
import { getMessagesByThreadId, getThreadById } from "~/features/chat/queries";

import ChatThread from "./chat-thread";

type ChatServerProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ChatServer({ params, searchParams }: ChatServerProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    redirect("/");
  }

  // Verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/");
  }

  // Fetch thread and messages in parallel
  const [thread, initialMessages] = await Promise.all([
    getThreadById(id),
    getMessagesByThreadId(id),
  ]);

  // Verify thread exists and user owns it
  if (!thread || thread.userId !== session.user.id) {
    redirect("/");
  }

  let initialPendingMessage: any | null = null;
  const rawInitial = Array.isArray(sp.initial) ? sp.initial[0] : sp.initial;

  if (rawInitial) {
    try {
      initialPendingMessage = JSON.parse(decodeURIComponent(rawInitial));
    }
    catch {
      // ignore malformed data; just don't auto-send
      initialPendingMessage = null;
    }
  }

  return <ChatThread params={Promise.resolve({ id })} initialMessages={initialMessages} initialPendingMessage={initialPendingMessage} />;
}
