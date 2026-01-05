"use server";

import { headers } from "next/headers";

import { auth } from "~/lib/auth";
import { preferencesSchema } from "~/lib/schemas/settings";
import {
  deleteApiKey as deleteApiKeyQuery,
  updateApiKey as updateApiKeyQuery,
  updateUserSettingsPartial,
} from "~/server/db/queries/settings";

/**
 * Update user preferences (theme, custom instructions, default thread name, landing page content)
 * Requires authentication and ownership verification
 *
 * @param updates Partial preferences to update
 * @return {Promise<void>}
 * @throws {Error} If not authenticated or validation fails
 */
export async function updatePreferences(
  updates: Partial<{
    theme: "light" | "dark" | "system";
    customInstructions: string;
    defaultThreadName: string;
    landingPageContent: "suggestions" | "greeting" | "blank";
  }>,
): Promise<void> {
  // Validate input
  const validated = preferencesSchema.partial().parse(updates);

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
  // Validate inputs
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("API key cannot be empty");
  }

  // Get authenticated session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Update API key in database
  await updateApiKeyQuery(session.user.id, provider, apiKey, storeServerSide);
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
