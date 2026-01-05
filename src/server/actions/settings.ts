"use server";

import { headers } from "next/headers";

import type { PreferencesUpdate, ProfileUpdate } from "~/lib/schemas/settings";

import { auth } from "~/lib/auth";
import {
  apiKeyUpdateSchema,
  preferencesUpdateSchema,
  profileUpdateSchema,
} from "~/lib/schemas/settings";
import {
  deleteApiKey as deleteApiKeyQuery,
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
 * @param provider API provider name (e.g., 'openrouter')
 * @param apiKey The API key to store
 * @param storeServerSide Whether to encrypt and store on server (default: false)
 * @return {Promise<void>}
 * @throws {Error} If not authenticated or validation fails
 */
export async function updateApiKey(
  provider: "openrouter",
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
 * @param provider API provider name (e.g., 'openrouter')
 * @return {Promise<void>}
 * @throws {Error} If not authenticated
 */
export async function deleteApiKey(provider: "openrouter"): Promise<void> {
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
