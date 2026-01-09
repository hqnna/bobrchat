"use server";

import type { Model, ModelsListResponse } from "@openrouter/sdk/models";

import { OpenRouter } from "@openrouter/sdk";
import { headers } from "next/headers";

import type { ApiKeyProvider, EncryptedApiKeysData, UserSettingsData } from "~/lib/db/schema/settings";
import type { FavoriteModelsInput, PreferencesUpdate, ProfileUpdate } from "~/lib/schemas/settings";

import { auth } from "~/features/auth/lib/auth";
import {
  apiKeyUpdateSchema,
  favoriteModelsUpdateSchema,
  preferencesUpdateSchema,
  profileUpdateSchema,
} from "~/lib/schemas/settings";
import {
  deleteApiKey as deleteApiKeyQuery,
  getServerApiKey,
  getUserSettings,
  getUserSettingsWithMetadata,
  removeApiKeyPreference,
  removeEncryptedKey,
  updateApiKey as updateApiKeyQuery,
  updateUserSettingsPartial,
} from "~/server/db/queries/settings";

/**
 * Update user preferences (theme, custom instructions, default thread name, landing page content)
 * Requires authentication and ownership verification
 *
 * @param updates Partial preferences to update (type-safe via PreferencesUpdate)
 * @return {Promise<void>}
 * @throws {Error} If not authenticated or validation fails
 */
export async function updatePreferences(updates: PreferencesUpdate): Promise<void> {
  // Validate input with Zod
  const validated = preferencesUpdateSchema.parse(updates);

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Update settings in database
  await updateUserSettingsPartial(session.user.id, validated);
}

/**
 * Update API key for a provider with optional server-side encryption storage
 * Requires authentication and ownership verification
 *
 * @param provider API provider name (e.g., 'openrouter', 'parallel')
 * @param apiKey The API key to store
 * @param storeServerSide Whether to encrypt and store on server (default: false)
 * @return {Promise<void>}
 * @throws {Error} If not authenticated or validation fails
 */
export async function updateApiKey(
  provider: ApiKeyProvider,
  apiKey: string,
  storeServerSide: boolean = false,
): Promise<void> {
  // Validate inputs with Zod
  const validated = apiKeyUpdateSchema.parse({
    apiKey,
    storeServerSide,
  });

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Update API key in database
  await updateApiKeyQuery(
    session.user.id,
    provider,
    validated.apiKey,
    validated.storeServerSide,
  );
}

/**
 * Delete an API key for a provider
 * Requires authentication and ownership verification
 *
 * @param provider API provider name (e.g., 'openrouter', 'parallel')
 * @return {Promise<void>}
 * @throws {Error} If not authenticated
 */
export async function deleteApiKey(provider: ApiKeyProvider): Promise<void> {
  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Delete API key from database
  await deleteApiKeyQuery(session.user.id, provider);
}

/**
 * Update user profile (name, email)
 * Requires authentication and ownership verification
 *
 * @param updates Partial profile to update (type-safe via ProfileUpdate)
 * @return {Promise<void>}
 * @throws {Error} If not authenticated or validation fails
 */
export async function updateProfile(updates: ProfileUpdate): Promise<void> {
  // Validate input with Zod
  const _validated = profileUpdateSchema.parse(updates);

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // TODO: Implement profile update in database
  throw new Error("Profile updates are not yet implemented");
}

/**
 * Sync user settings and clean up orphaned data
 * Cleanup is performed lazily (roughly 1 in 10 calls) to reduce DB overhead
 * Requires authentication
 *
 * @return {Promise<UserSettingsData | null>} Fresh user settings after cleanup, or null if not authenticated
 */
export async function syncUserSettings(): Promise<UserSettingsData | null> {
  const totalStart = Date.now();

  const sessionStart = Date.now();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  console.warn(`[PERF] syncUserSettings.getSession: ${Date.now() - sessionStart}ms`);

  if (!session?.user) {
    return null;
  }

  // Lazy cleanup: only run ~10% of the time to reduce DB overhead
  // Orphaned keys are rare and not critical to clean up immediately
  if (Math.random() < 0.1) {
    const cleanupStart = Date.now();
    await cleanupEncryptedApiKeysForUser(session.user.id);
    console.warn(`[PERF] syncUserSettings.cleanupEncryptedApiKeys: ${Date.now() - cleanupStart}ms`);
  }

  // Return fresh settings
  const getSettingsStart = Date.now();
  const settings = await getUserSettings(session.user.id);
  console.warn(`[PERF] syncUserSettings.getUserSettings: ${Date.now() - getSettingsStart}ms`);

  console.warn(`[PERF] syncUserSettings.total: ${Date.now() - totalStart}ms`);
  return settings;
}

/**
 * Clean up missing client-side API key (when localStorage key is not found)
 * Removes the provider from apiKeyStorage preferences in database
 * Requires authentication
 *
 * @param provider API provider name (e.g., 'openrouter')
 * @return {Promise<void>}
 * @throws {Error} If not authenticated
 */
export async function cleanupMissingClientApiKey(provider: ApiKeyProvider): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  await removeApiKeyPreference(session.user.id, provider);
}

/**
 * Internal helper to clean up orphaned encrypted API keys for a specific user
 * Does not check authentication - caller must verify
 *
 * @param userId ID of the user
 * @return {Promise<void>}
 */
async function cleanupEncryptedApiKeysForUser(userId: string): Promise<void> {
  // Fetch user settings with metadata to check encrypted keys
  const userRecord = await getUserSettingsWithMetadata(userId);
  if (!userRecord) {
    return;
  }

  const settings = userRecord.settings as UserSettingsData;
  const encryptedApiKeys = (userRecord.encryptedApiKeys || {}) as EncryptedApiKeysData;

  // Find and remove encrypted keys that don't have a matching "server" storage preference
  const cleanupPromises: Promise<void>[] = [];
  for (const provider of Object.keys(encryptedApiKeys) as ApiKeyProvider[]) {
    if (settings.apiKeyStorage[provider] !== "server") {
      // This encrypted key doesn't have a matching server preference, remove it
      cleanupPromises.push(removeEncryptedKey(userId, provider));
    }
  }

  if (cleanupPromises.length > 0) {
    await Promise.all(cleanupPromises);
  }
}

/**
 * Clean up orphaned encrypted API keys (keys without matching storage preferences)
 * Queries user settings and removes any encrypted keys that don't have a matching
 * "server" storage preference in apiKeyStorage
 * Requires authentication
 *
 * @return {Promise<void>}
 * @throws {Error} If not authenticated
 */
export async function cleanupEncryptedApiKeys(): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  await cleanupEncryptedApiKeysForUser(session.user.id);
}

/**
 * Fetch all available models from OpenRouter catalogue
 * Requires authentication and a valid OpenRouter API key
 *
 * @param apiKey Optional API key (uses server-stored key if not provided)
 * @return {Promise<Model[]>} Array of available models with metadata
 * @throws {Error} If not authenticated or no API key available
 */
export async function fetchOpenRouterModels(apiKey?: string) {
  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Use provided key or fetch from server storage
  let keyToUse = apiKey;
  if (!keyToUse) {
    keyToUse = await getServerApiKey(session.user.id, "openrouter");
  }

  if (!keyToUse) {
    throw new Error("No OpenRouter API key configured");
  }

  try {
    const openRouter = new OpenRouter({
      apiKey: keyToUse,
    });

    const result: ModelsListResponse = await openRouter.models.list({});

    if (!result || !Array.isArray(result.data)) {
      throw new Error("Invalid response from OpenRouter API");
    }

    let models = result.data;

    // Remove models with image generation
    models = models.filter((model: Model) => {
      return !(model.architecture?.outputModalities?.includes("image"));
    });

    return models;
  }
  catch (error) {
    console.error("Failed to fetch models from OpenRouter:", error);
    throw new Error("Failed to fetch models from OpenRouter API");
  }
}

/**
 * Update user's favorite models list (max 10)
 * Requires authentication
 *
 * @param updates Partial update with favoriteModels array
 * @return {Promise<UserSettingsData>} Updated user settings
 * @throws {Error} If not authenticated or validation fails
 */
export async function updateFavoriteModels(updates: FavoriteModelsInput): Promise<UserSettingsData> {
  // Validate input with Zod
  const validated = favoriteModelsUpdateSchema.parse(updates);

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Update settings in database
  return updateUserSettingsPartial(session.user.id, validated);
}
