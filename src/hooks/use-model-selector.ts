import type { Model } from "@openrouter/sdk/models";

import { useEffect, useState } from "react";

import { useUserSettingsContext } from "~/components/settings/user-settings-provider";
import { fetchOpenRouterModels } from "~/server/actions/settings";

type UseModelSelectorReturn = {
  models: Model[];
  selectedModelId: string | null;
  setSelectedModelId: (modelId: string) => void;
  isLoading: boolean;
};

const SELECTED_MODEL_KEY = "selected_model_id";

export function useModelSelector(): UseModelSelectorReturn {
  const { settings } = useUserSettingsContext();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all models from OpenRouter
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        let apiKey: string | undefined;
        if (settings?.apiKeyStorage?.openrouter === "client") {
          apiKey = localStorage.getItem("openrouter_api_key") ?? undefined;
        }
        const models = await fetchOpenRouterModels(apiKey);
        setAllModels(models);
      }
      catch (error) {
        console.error("Failed to fetch models:", error);
        setAllModels([]);
      }
      finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have an API key configured (client or server)
    const hasApiKeyConfigured = settings?.apiKeyStorage?.openrouter === "client"
      || settings?.apiKeyStorage?.openrouter === "server";

    if (allModels.length === 0 && hasApiKeyConfigured) {
      fetchModels();
    }
  }, [settings?.apiKeyStorage?.openrouter]);

  // Initialize selectedModelId from localStorage or first favorite
  useEffect(() => {
    if (typeof window === "undefined")
      return;

    const savedModelId = localStorage.getItem(SELECTED_MODEL_KEY);
    if (settings?.favoriteModels && settings.favoriteModels.length > 0) {
      const modelToSelect = savedModelId && settings.favoriteModels.includes(savedModelId)
        ? savedModelId
        : settings.favoriteModels[0];
      setSelectedModelId(modelToSelect);
    }
  }, [settings?.favoriteModels]);

  const handleSetSelectedModelId = (modelId: string) => {
    setSelectedModelId(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_MODEL_KEY, modelId);
    }
  };

  // Filter models to only show favorites and enrich with full metadata
  const enrichedModels = settings?.favoriteModels
    ? settings.favoriteModels
      .map(modelId => allModels.find(m => m.id === modelId))
      .filter((m): m is Model => m !== undefined)
    : [];

  return {
    models: enrichedModels,
    selectedModelId,
    setSelectedModelId: handleSetSelectedModelId,
    isLoading,
  };
}
