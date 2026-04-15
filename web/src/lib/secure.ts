import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const ENCRYPTION_PREFIX = "enc:v1:";

function getEncryptionKey() {
  const source =
    process.env.SECRET_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "wewrite-dev-fallback-key";

  return createHash("sha256").update(source).digest();
}

export function isEncryptedSecret(secret?: string | null) {
  return Boolean(secret && secret.startsWith(ENCRYPTION_PREFIX));
}

export function encryptSecret(plainText: string) {
  const normalized = plainText.trim();
  if (!normalized) return "";

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString("base64")}.${tag.toString(
    "base64"
  )}.${encrypted.toString("base64")}`;
}

export function decryptSecret(secret?: string | null) {
  if (!secret) return "";
  if (!isEncryptedSecret(secret)) return secret;

  try {
    const payload = secret.slice(ENCRYPTION_PREFIX.length);
    const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) return "";

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivEncoded, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}

export function maskSecret(secret?: string | null) {
  const normalized = decryptSecret(secret).trim();
  if (!normalized) return "";
  if (normalized.length <= 6) return `${normalized.slice(0, 2)}••••`;
  return `${normalized.slice(0, 3)}••••${normalized.slice(-4)}`;
}
