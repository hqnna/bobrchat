// hooks/use-api-key-status.ts
import { useQuery } from "@tanstack/react-query";

import type { ApiKeyProvider } from "~/lib/api-keys/types";

import { useChatUIStore } from "~/features/chat/store";

export function useApiKeyStatus(provider: ApiKeyProvider) {
  const clientKey = useChatUIStore(s =>
    provider === "openrouter" ? s.openrouterKey : s.parallelKey,
  );

  const hasClientKey = !!clientKey;

  const serverQuery = useQuery({
    queryKey: ["api-key-exists", provider],
    queryFn: async () => {
      const res = await fetch(`/api/keys/${provider}/exists`);
      return res.json() as Promise<{ exists: boolean }>;
    },
    enabled: !hasClientKey, // only check server if no client key
    staleTime: 60_000,
  });

  return {
    hasKey: hasClientKey || (serverQuery.data?.exists ?? false),
    source: hasClientKey ? "client" : serverQuery.data?.exists ? "server" : null,
    isLoading: !hasClientKey && serverQuery.isLoading,
    clientKey, // expose for passing to API calls
  };
}
