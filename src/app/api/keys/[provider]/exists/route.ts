import { headers } from "next/headers";

import type { ApiKeyProvider } from "~/lib/api-keys";

import { auth } from "~/features/auth/lib/auth";
import { hasEncryptedKey } from "~/lib/api-keys/server";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const provider = (await params).provider;
  const hasKey = await hasEncryptedKey(session.user.id, provider as ApiKeyProvider);

  return new Response(JSON.stringify({ exists: hasKey }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
