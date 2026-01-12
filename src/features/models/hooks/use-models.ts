"use client";

import type { Model } from "@openrouter/sdk/models";

import { useQuery } from "@tanstack/react-query";

import { useApiKeyStatus } from "~/features/settings/hooks/use-api-status";
import { useUserSettings } from "~/features/settings/hooks/use-user-settings";
import { getClientKey } from "~/lib/api-keys/client";

import { fetchOpenRouterModels } from "../actions";

export const MODELS_KEY = ["models"] as const;

export function useModels(options: { enabled?: boolean } = {}) {
  const { hasKey, source } = useApiKeyStatus("openrouter");

  return useQuery({
    queryKey: MODELS_KEY,
    queryFn: async () => {
      const clientKey = source === "client"
        ? getClientKey("openrouter") ?? undefined
        : undefined;
      return fetchOpenRouterModels(clientKey);
    },
    enabled: hasKey && options.enabled,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useFavoriteModels(): Model[] {
  const { data: allModels } = useModels();
  const { data: settings } = useUserSettings();

  if (!allModels || !settings?.favoriteModels) {
    return [];
  }

  return settings.favoriteModels
    .map((modelId: string) => allModels.find((m: Model) => m.id === modelId))
    .filter((m: Model | undefined): m is Model => m !== undefined);
}
