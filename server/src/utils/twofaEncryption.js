import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import env from "../config/env.js";
import ApiError from "./ApiError.js";

const unavailable = () =>
  new ApiError(
    503,
    "2FA credential encryption is unavailable",
    "TWOFA_ENCRYPTION_UNAVAILABLE",
  );

function configuration(override) {
  const encoded = override?.key ?? env.TWOFA_ENCRYPTION_KEY;
  const version = override?.version ?? env.TWOFA_ENCRYPTION_KEY_VERSION;
  if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw unavailable();
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    key.fill(0);
    throw unavailable();
  }
  return { key, version: Number(version) };
}

const additionalData = (context, field, version) =>
  Buffer.from(`twofa:v1:${context}:${field}:${version}`, "utf8");

export function encryptTwofaValue(value, context, field, override) {
  const { key, version } = configuration(override);
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv, {
      authTagLength: 16,
    });
    cipher.setAAD(additionalData(context, field, version));
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return { ciphertext, iv, tag: cipher.getAuthTag(), version };
  } finally {
    key.fill(0);
  }
}

export function decryptTwofaValue(bundle, context, field, override) {
  const { key, version } = configuration(override);
  try {
    if (Number(bundle.version) !== version) throw unavailable();
    const decipher = createDecipheriv("aes-256-gcm", key, bundle.iv, {
      authTagLength: 16,
    });
    decipher.setAAD(additionalData(context, field, version));
    decipher.setAuthTag(bundle.tag);
    return Buffer.concat([
      decipher.update(bundle.ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      "Unable to decrypt the stored credential",
      "TWOFA_DECRYPTION_FAILED",
    );
  } finally {
    key.fill(0);
  }
}
