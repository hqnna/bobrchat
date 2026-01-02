import { eq } from "drizzle-orm";

import type { EncryptedApiKeysData, UserSettingsData } from "~/lib/db/schema/settings";

import { db } from "~/lib/db";
import { userSettings } from "~/lib/db/schema/settings";
import { decryptValue, encryptValue } from "~/lib/encryption";

/**
 * Get user settings by user ID (does not include actual API keys)
 *
 * @param userId ID of the user
 * @return {Promise<UserSettingsData>} User settings or default settings if not found
 */
export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  const result = await db
    .select({ settings: userSettings.settings })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!result.length) {
    // Return default settings if user settings don't exist yet
    return {
      theme: "dark",
      defaultThreadName: "New Chat",
      apiKeyStorage: {},
    };
  }

  return result[0].settings as UserSettingsData;
}

/**
 * Get user settings with metadata (does not include actual API keys)
 *
 * @param userId ID of the user
 * @return {Promise<any>} User settings record or null if not found
 */
export async function getUserSettingsWithMetadata(userId: string) {
  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create default settings for a new user
 *
 * @param userId ID of the user
 * @return {Promise<UserSettingsData>} Created user settings
 */
export async function createDefaultUserSettings(userId: string): Promise<UserSettingsData> {
  const defaultSettings: UserSettingsData = {
    theme: "dark",
    defaultThreadName: "New Chat",
    apiKeyStorage: {},
  };

  await db.insert(userSettings).values({
    userId,
    settings: defaultSettings,
    encryptedApiKeys: {},
  });

  return defaultSettings;
}

/**
 * Update user settings (full replacement of settings only, not API keys)
 *
 * @param userId ID of the user
 * @param newSettings New settings object
 * @return {Promise<UserSettingsData>} Updated settings
 */
export async function updateUserSettings(
  userId: string,
  newSettings: UserSettingsData,
): Promise<UserSettingsData> {
  const result = await db
    .update(userSettings)
    .set({
      settings: newSettings,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId))
    .returning({ settings: userSettings.settings });

  if (!result.length) {
    // If user settings don't exist, create them
    return createDefaultUserSettings(userId);
  }

  return result[0].settings as UserSettingsData;
}

/**
 * Update a specific setting field (partial update, settings only)
 *
 * @param userId ID of the user
 * @param updates Partial settings to merge
 * @return {Promise<UserSettingsData>} Updated settings
 */
export async function updateUserSettingsPartial(
  userId: string,
  updates: Partial<UserSettingsData>,
): Promise<UserSettingsData> {
  // Get current settings first
  const currentSettings = await getUserSettings(userId);

  // Merge with updates
  const merged: UserSettingsData = {
    ...currentSettings,
    ...updates,
    // Ensure apiKeyStorage is merged, not replaced
    apiKeyStorage: {
      ...currentSettings.apiKeyStorage,
      ...(updates.apiKeyStorage || {}),
    },
  };

  return updateUserSettings(userId, merged);
}

/**
 * Get the actual decrypted API key for a provider (server-side keys only)
 *
 * @param userId ID of the user
 * @param provider API provider name (e.g., 'openrouter')
 * @return {Promise<string | undefined>} The decrypted API key or undefined if not set
 * @throws {Error} If decryption fails (corrupted data or wrong key)
 */
export async function getServerApiKey(
  userId: string,
  provider: "openrouter",
): Promise<string | undefined> {
  const result = await db
    .select({ encryptedApiKeys: userSettings.encryptedApiKeys })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!result.length) {
    return undefined;
  }

  const encrypted = (result[0].encryptedApiKeys as EncryptedApiKeysData)[provider];
  if (!encrypted) {
    return undefined;
  }

  try {
    return decryptValue(encrypted);
  }
  catch (error) {
    console.error(`Failed to decrypt ${provider} API key for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update an API key for a provider, optionally storing it server-side encrypted
 *
 * @param userId ID of the user
 * @param provider API provider name (e.g., 'openrouter')
 * @param apiKey The plain API key value
 * @param storeServerSide Whether to store it encrypted on the server (default: false)
 * @return {Promise<void>}
 */
export async function updateApiKey(
  userId: string,
  provider: "openrouter",
  apiKey: string,
  storeServerSide: boolean = false,
): Promise<void> {
  const currentSettings = await getUserSettings(userId);

  const settingsResult = await db
    .select({ encryptedApiKeys: userSettings.encryptedApiKeys })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const currentEncrypted = (settingsResult[0]?.encryptedApiKeys || {}) as EncryptedApiKeysData;

  // Update storage preference
  const updatedApiKeyStorage = {
    ...currentSettings.apiKeyStorage,
    [provider]: storeServerSide ? "server" : "client",
  };

  // Update encrypted keys if storing server-side
  let updatedEncrypted = currentEncrypted;
  if (storeServerSide) {
    updatedEncrypted = {
      ...currentEncrypted,
      [provider]: encryptValue(apiKey),
    };
  }
  else {
    // Remove from server storage if switching to client
    const cleanedEncrypted: EncryptedApiKeysData = {};
    Object.entries(currentEncrypted).forEach(([key, value]) => {
      if (key !== provider && value !== undefined) {
        cleanedEncrypted[key as "openrouter"] = value;
      }
    });
    updatedEncrypted = cleanedEncrypted;
  }

  await db
    .update(userSettings)
    .set({
      settings: {
        ...currentSettings,
        apiKeyStorage: updatedApiKeyStorage,
      },
      encryptedApiKeys: updatedEncrypted,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}

/**
 * Delete an API key for a provider (removes from both client and server storage)
 *
 * @param userId ID of the user
 * @param provider API provider name (e.g., 'openrouter')
 * @return {Promise<void>}
 */
export async function deleteApiKey(userId: string, provider: "openrouter"): Promise<void> {
  const currentSettings = await getUserSettings(userId);

  const settingsResult = await db
    .select({ encryptedApiKeys: userSettings.encryptedApiKeys })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const currentEncrypted = (settingsResult[0]?.encryptedApiKeys || {}) as EncryptedApiKeysData;

  // Remove from storage preferences
  const cleanedApiKeyStorage: Record<string, "client" | "server"> = {};
  Object.entries(currentSettings.apiKeyStorage).forEach(([key, value]) => {
    if (key !== provider && value !== undefined) {
      cleanedApiKeyStorage[key] = value;
    }
  });

  // Remove from encrypted keys
  const cleanedEncrypted: EncryptedApiKeysData = {};
  Object.entries(currentEncrypted).forEach(([key, value]) => {
    if (key !== provider && value !== undefined) {
      cleanedEncrypted[key as "openrouter"] = value;
    }
  });

  await db
    .update(userSettings)
    .set({
      settings: {
        ...currentSettings,
        apiKeyStorage: cleanedApiKeyStorage,
      },
      encryptedApiKeys: cleanedEncrypted,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));
}
