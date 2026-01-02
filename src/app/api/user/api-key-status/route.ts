import { headers } from "next/headers";

import { auth } from "~/lib/auth";
import { hasApiKey } from "~/server/db/queries/settings";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKeyConfigured = await hasApiKey(session.user.id, "openrouter");

  return new Response(
    JSON.stringify({ hasApiKey: apiKeyConfigured }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
