import { headers } from "next/headers";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { auth } from "~/lib/auth";
import { saveMessage } from "~/server/db/queries/chat";
import { validateThreadOwnership } from "~/server/db/utils/thread-validation";

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

  const { threadId, message }: { threadId?: string; message?: ChatUIMessage } = await req.json();

  if (!threadId || !message) {
    return new Response(JSON.stringify({ error: "Missing threadId or message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await validateThreadOwnership(threadId, session);
  }
  catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = msg === "Thread not found" ? 404 : 403;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  await saveMessage(threadId, session.user.id, message);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
