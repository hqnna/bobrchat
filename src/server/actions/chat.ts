"use server";

import { headers } from "next/headers";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { auth } from "~/lib/auth";
import { serverEnv } from "~/lib/env";
import { deleteFile } from "~/lib/storage";
import { generateThreadTitle } from "~/server/ai/naming";
import { deleteUserAttachmentsByIds, listThreadAttachments, resolveUserAttachmentsByStoragePaths } from "~/server/db/queries/attachments";
import { createThread, deleteThreadById, getMessagesByThreadId, renameThreadById, saveMessage } from "~/server/db/queries/chat";
import { getServerApiKey, hasApiKey } from "~/server/db/queries/settings";
import { validateThreadOwnership } from "~/server/db/utils/thread-validation";

function extractStoragePathsFromThreadMessages(messages: ChatUIMessage[]): string[] {
  const storagePaths: string[] = [];
  const prefix = `${serverEnv.R2_PUBLIC_URL}/`;

  for (const message of messages) {
    const parts = (message as unknown as { parts?: unknown }).parts;
    if (!Array.isArray(parts))
      continue;

    for (const part of parts) {
      if (!part || typeof part !== "object")
        continue;

      const maybe = part as { type?: unknown; storagePath?: unknown; url?: unknown };
      if (maybe.type !== "file")
        continue;

      if (typeof maybe.storagePath === "string" && maybe.storagePath.length > 0) {
        storagePaths.push(maybe.storagePath);
        continue;
      }

      if (typeof maybe.url === "string" && maybe.url.startsWith(prefix)) {
        storagePaths.push(maybe.url.slice(prefix.length));
      }
    }
  }

  return Array.from(new Set(storagePaths));
}

/**
 * Creates a new chat thread for the authenticated user.
 * Requires user to have an API key configured.
 *
 * @param defaultName Optional default thread name (pass from client to avoid DB query)
 * @returns {Promise<string>} The ID of the newly created thread.
 * @throws {Error} If user is not authenticated or doesn't have an API key configured.
 */
export async function createNewThread(defaultName?: string): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user)
    throw new Error("Not authenticated");

  // Check if user has an API key configured
  const hasKey = await hasApiKey(session.user.id, "openrouter");
  if (!hasKey) {
    throw new Error("API key not configured. Please set up your OpenRouter API key in settings before creating a thread.");
  }

  const threadName = defaultName || "New Chat";
  const threadId = await createThread(session.user.id, threadName);
  return threadId;
}

/**
 * Saves a user message to the specified thread.
 *
 * @param threadId ID of the thread
 * @param message Message to save
 * @return {Promise<void>}
 */
export async function saveUserMessage(threadId: string, message: ChatUIMessage): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await validateThreadOwnership(threadId, session);
  await saveMessage(threadId, session!.user!.id, message);
}

/**
 * Deletes a thread for the authenticated user.
 * Verifies ownership before deletion.
 *
 * @param threadId ID of the thread to delete
 * @return {Promise<void>}
 */
export async function deleteThread(threadId: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await validateThreadOwnership(threadId, session);

  const userId = session!.user!.id;
  const threadMessages = await getMessagesByThreadId(threadId);

  const fromLinked = await listThreadAttachments({ userId, threadId });
  const fromMessageUrls = await resolveUserAttachmentsByStoragePaths({
    userId,
    storagePaths: extractStoragePathsFromThreadMessages(threadMessages),
  });

  const ids = Array.from(new Set([...fromLinked.ids, ...fromMessageUrls.ids]));
  const storagePaths = Array.from(new Set([...fromLinked.storagePaths, ...fromMessageUrls.storagePaths]));

  if (storagePaths.length > 0) {
    await Promise.all(storagePaths.map(p => deleteFile(p)));
  }

  if (ids.length > 0) {
    await deleteUserAttachmentsByIds({ userId, ids });
  }

  await deleteThreadById(threadId);
}

/**
 * Renames a thread for the authenticated user.
 * Verifies ownership before renaming.
 *
 * @param threadId ID of the thread to rename
 * @param newTitle New title for the thread
 * @return {Promise<void>}
 */
export async function renameThread(threadId: string, newTitle: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await validateThreadOwnership(threadId, session);
  await renameThreadById(threadId, newTitle);
}

/**
 * Regenerates the title of a thread using AI.
 * Requires either a server-stored API key or a browser-provided key.
 *
 * @param threadId ID of the thread to rename
 * @param browserApiKey Optional API key provided by the client (for browser-only storage)
 * @return {Promise<string>} The new title
 */
export async function regenerateThreadName(threadId: string, browserApiKey?: string): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await validateThreadOwnership(threadId, session);
  if (!session?.user)
    throw new Error("Not authenticated");

  // Resolve API key: browser-provided key takes precedence over server-stored key.
  // This matches the behavior in the chat endpoint.
  const serverApiKey = await getServerApiKey(session.user.id, "openrouter");
  const resolvedApiKey = browserApiKey ?? serverApiKey;

  if (!resolvedApiKey) {
    throw new Error("No API key configured. Provide a browser key or store one on the server.");
  }

  const messages = await getMessagesByThreadId(threadId);
  const textMessages = messages.filter(m => m.role === "user");

  if (textMessages.length === 0) {
    throw new Error("No user messages found to generate title from");
  }

  const firstUserMessage = textMessages[0];
  const userContent = firstUserMessage.parts
    ? firstUserMessage.parts
        .filter(p => p.type === "text")
        .map(p => (p as { text: string }).text)
        .join("")
    : "";

  const newTitle = await generateThreadTitle(userContent, resolvedApiKey);
  await renameThreadById(threadId, newTitle);

  return newTitle;
}
