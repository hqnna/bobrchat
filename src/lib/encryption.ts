import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { serverEnv } from "~/lib/env";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = "bobrchat"; // Static salt for consistent key derivation

/**
 * Derive encryption key from the master secret
 */
function getEncryptionKey(): Buffer {
  return scryptSync(serverEnv.ENCRYPTION_SECRET, SALT, KEY_LENGTH);
}

/**
 * Encrypt a sensitive value (e.g., API key)
 * Returns a string format: "iv:encryptedData:authTag"
 *
 * @param plaintext The value to encrypt
 * @return {string} Encrypted value in "iv:encryptedData:authTag" format
 */
export function encryptValue(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: base64(iv):base64(encrypted):base64(authTag)
  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a sensitive value
 *
 * @param encrypted The encrypted value in "iv:encryptedData:authTag" format
 * @return {string} Decrypted plaintext
 * @throws {Error} If decryption fails (invalid key, corrupted data, tampered data)
 */
export function decryptValue(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }

  const [ivHex, encryptedHex, authTagHex] = parts;

  try {
    const iv = Buffer.from(ivHex, "hex");
    const encryptedData = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    if (iv.length !== IV_LENGTH || authTag.length !== TAG_LENGTH) {
      throw new Error("Invalid encryption parameters");
    }

    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
  catch (error) {
    throw new Error(
      `Failed to decrypt value: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
