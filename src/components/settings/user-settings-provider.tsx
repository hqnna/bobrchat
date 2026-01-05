"use client";

import { createContext, use, useCallback, useEffect, useState } from "react";

import type { UserSettingsData } from "~/lib/db/schema/settings";
import type { PreferencesUpdate } from "~/lib/schemas/settings";

import { useSession } from "~/lib/auth-client";
import {
  cleanupEncryptedApiKeys,
  cleanupMissingClientApiKey,
  deleteApiKey as deleteApiKeyAction,
  updateApiKey as updateApiKeyAction,
  updatePreferences,
} from "~/server/actions/settings";

type UserSettingsContextType = {
  settings: UserSettingsData | null;
  loading: boolean;
  error: string | null;
  updateSetting: (updates: PreferencesUpdate) => Promise<void>;
  setApiKey: (
    provider: "openrouter",
    apiKey: string,
    storeServerSide?: boolean,
  ) => Promise<void>;
  removeApiKey: (provider: "openrouter") => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(
  undefined,
);

export function UserSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [state, setState] = useState<{
    settings: UserSettingsData | null;
    loading: boolean;
    error: string | null;
  }>({
    settings: null,
    loading: true,
    error: null,
  });

  // Fetch settings on mount (only if user is authenticated)
  useEffect(() => {
    const fetchSettings = async () => {
      // Skip fetching if user is not authenticated
      if (!session?.user) {
        setState({
          settings: null,
          loading: false,
          error: null,
        });
        return;
      }

      try {
        const response = await fetch("/api/settings");

        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }

        const settings = (await response.json()) as UserSettingsData;

        // Validate localStorage keys exist for client-side storage
        if (settings.apiKeyStorage.openrouter === "client") {
          const hasKey = typeof window !== "undefined" && localStorage.getItem("openrouter_api_key") !== null;
          if (!hasKey) {
            // Key is missing, clean up the orphaned preference
            console.warn("OpenRouter API key missing from localStorage, cleaning up preference");
            try {
              await cleanupMissingClientApiKey("openrouter");
              // Remove from local state
              settings.apiKeyStorage.openrouter = undefined;
            }
            catch (cleanupError) {
              console.error("Failed to cleanup missing API key preference:", cleanupError);
            }
          }
        }

        // Clean up orphaned encrypted keys (keys without matching preferences)
        try {
          await cleanupEncryptedApiKeys();
        }
        catch (cleanupError) {
          console.error("Failed to cleanup orphaned encrypted keys:", cleanupError);
        }

        setState({
          settings,
          loading: false,
          error: null,
        });
      }
      catch (error) {
        console.error("Failed to fetch settings:", error);
        setState(prev => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    fetchSettings();
  }, [session?.user]);

  const updateSetting = useCallback(
    async (updates: PreferencesUpdate): Promise<void> => {
      try {
        // Optimistically update state
        setState(prev => ({
          ...prev,
          settings: prev.settings
            ? { ...prev.settings, ...updates }
            : null,
        }));

        // Call server action
        await updatePreferences(updates);
      }
      catch (error) {
        // Revert on error
        console.error("Failed to update settings:", error);
        // Re-fetch to get latest state
        const response = await fetch("/api/settings");
        const settings = (await response.json()) as UserSettingsData;
        setState({
          settings,
          loading: false,
          error:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [],
  );

  const setApiKey = useCallback(
    async (
      provider: "openrouter",
      apiKey: string,
      storeServerSide: boolean = false,
    ): Promise<void> => {
      try {
        await updateApiKeyAction(provider, apiKey, storeServerSide);

        // Update local storage preference
        setState(prev => ({
          ...prev,
          settings: prev.settings
            ? {
                ...prev.settings,
                apiKeyStorage: {
                  ...prev.settings.apiKeyStorage,
                  [provider]: storeServerSide ? "server" : "client",
                },
              }
            : null,
        }));
      }
      catch (error) {
        console.error("Failed to update API key:", error);
        throw error;
      }
    },
    [],
  );

  const removeApiKey = useCallback(
    async (provider: "openrouter"): Promise<void> => {
      try {
        await deleteApiKeyAction(provider);

        // Update local storage preference
        setState((prev) => {
          if (!prev.settings)
            return prev;

          const newStorage = { ...prev.settings.apiKeyStorage };
          delete newStorage[provider];

          return {
            ...prev,
            settings: {
              ...prev.settings,
              apiKeyStorage: newStorage,
            },
          };
        });
      }
      catch (error) {
        console.error("Failed to delete API key:", error);
        throw error;
      }
    },
    [],
  );

  return (
    <UserSettingsContext
      value={{
        settings: state.settings,
        loading: state.loading,
        error: state.error,
        updateSetting,
        setApiKey,
        removeApiKey,
      }}
    >
      {children}
    </UserSettingsContext>
  );
}

export function useUserSettingsContext() {
  const context = use(UserSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useUserSettingsContext must be used within UserSettingsProvider",
    );
  }
  return context;
}
