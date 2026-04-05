import crypto from "crypto";
import { config } from "../config";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = config.encryptionKey;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return Buffer.from(raw, "base64");
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
