import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * 获取加密密钥
 * 密钥必须是 32 字节（64 个十六进制字符）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY 环境变量未设置。请生成一个 32 字节的十六进制密钥。"
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY 必须是 64 个十六进制字符（32 字节）。当前长度：" +
        key.length
    );
  }

  try {
    return Buffer.from(key, "hex");
  } catch {
    throw new Error("ENCRYPTION_KEY 格式无效，必须是有效的十六进制字符串。");
  }
}

/**
 * 加密 API 密钥
 * @param apiKey 明文 API 密钥
 * @returns 加密后的字符串，格式：iv:authTag:encrypted
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error("API 密钥不能为空");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // 格式：iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * 解密 API 密钥
 * @param encryptedData 加密的字符串，格式：iv:authTag:encrypted
 * @returns 明文 API 密钥
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("加密数据不能为空");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("加密数据格式无效");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      "解密失败：" + (error instanceof Error ? error.message : "未知错误")
    );
  }
}

/**
 * 生成一个新的加密密钥（用于初始化）
 * @returns 32 字节的十六进制密钥
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 检查字符串是否已加密
 * @param data 待检查的字符串
 * @returns 是否为加密格式
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}
