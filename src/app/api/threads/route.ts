import { headers } from "next/headers";

import { auth } from "~/lib/auth";
import { getThreadsByUserId } from "~/server/db/queries/chat";

export async function GET() {
  const totalStart = Date.now();

  const sessionStart = Date.now();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.warn(`[PERF] /api/threads.getSession: ${Date.now() - sessionStart}ms`);

  if (!session?.user) {
    return Response.json([]);
  }

  const dbStart = Date.now();
  const threads = await getThreadsByUserId(session.user.id);
  console.warn(`[PERF] /api/threads.getThreadsByUserId: ${Date.now() - dbStart}ms`);

  console.warn(`[PERF] /api/threads.total: ${Date.now() - totalStart}ms`);
  return Response.json(threads);
}
