import crypto from "crypto";
import { config } from "../config";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = config.encryptionKey;
  // Exact 64-char hex string = 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // Base64 that decodes to exactly 32 bytes
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) {
    return b64;
  }
  // Fallback: derive a 32-byte key via SHA-256 hash
  return crypto.createHash("sha256").update(raw).digest();
}

const key = getKey();

export function encryptText(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptText(cipherText: string): string {
  const [ivPart, tagPart, encryptedPart] = cipherText.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Malformed encrypted payload");
  }

  const iv = Buffer.from(ivPart, "base64");
  const authTag = Buffer.from(tagPart, "base64");
  const encrypted = Buffer.from(encryptedPart, "base64");

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskCode(code: string): string {
  const segments = code.split("-");
  if (segments.length >= 2) {
    return `${segments[0]}-****-****-${segments[segments.length - 1]}`;
  }
  return "****-****";
}

/**
 * Deterministic HMAC-SHA256 of a trade code, used purely for duplicate
 * detection. Same plaintext always yields the same digest, so we can index
 * and query it — unlike `encryptText` which uses a random IV each call.
 *
 * Never reveal this digest to clients; treat it like the plaintext.
 */
export function hashCode(plainText: string): string {
  return crypto.createHmac("sha256", key).update(plainText, "utf8").digest("hex");
}
