import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  isEncrypted,
  generateEncryptionKey,
} from "@/lib/encryption";

describe("API 密钥加密", () => {
  beforeAll(() => {
    // 设置测试用的加密密钥
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  });

  describe("encryptApiKey", () => {
    it("应该成功加密 API 密钥", () => {
      const apiKey = "sk-test1234567890";
      const encrypted = encryptApiKey(apiKey);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(apiKey);
      expect(typeof encrypted).toBe("string");
    });

    it("加密结果应该包含三个部分（iv:authTag:encrypted）", () => {
      const apiKey = "sk-test1234567890";
      const encrypted = encryptApiKey(apiKey);
      const parts = encrypted.split(":");

      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/i); // IV
      expect(parts[1]).toMatch(/^[0-9a-f]+$/i); // Auth Tag
      expect(parts[2]).toMatch(/^[0-9a-f]+$/i); // Encrypted
    });

    it("相同的明文每次加密结果应该不同（随机 IV）", () => {
      const apiKey = "sk-test1234567890";
      const encrypted1 = encryptApiKey(apiKey);
      const encrypted2 = encryptApiKey(apiKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("应该拒绝空字符串", () => {
      expect(() => encryptApiKey("")).toThrow("API 密钥不能为空");
    });

    it("应该能加密长密钥", () => {
      const longKey = "sk-" + "a".repeat(100);
      const encrypted = encryptApiKey(longKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(longKey.length);
    });

    it("应该能加密包含特殊字符的密钥", () => {
      const specialKey = "sk-test!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const encrypted = encryptApiKey(specialKey);

      expect(encrypted).toBeDefined();
    });
  });

  describe("decryptApiKey", () => {
    it("应该成功解密加密的密钥", () => {
      const original = "sk-test1234567890";
      const encrypted = encryptApiKey(original);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(original);
    });

    it("应该拒绝空字符串", () => {
      expect(() => decryptApiKey("")).toThrow("加密数据不能为空");
    });

    it("应该拒绝格式错误的数据", () => {
      expect(() => decryptApiKey("invalid")).toThrow("加密数据格式无效");
      expect(() => decryptApiKey("a:b")).toThrow("加密数据格式无效");
      expect(() => decryptApiKey("a:b:c:d")).toThrow("加密数据格式无效");
    });

    it("应该拒绝被篡改的数据", () => {
      const original = "sk-test1234567890";
      const encrypted = encryptApiKey(original);
      const parts = encrypted.split(":");

      // 篡改密文
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}ff`;

      expect(() => decryptApiKey(tampered)).toThrow("解密失败");
    });

    it("应该能解密长密钥", () => {
      const longKey = "sk-" + "a".repeat(100);
      const encrypted = encryptApiKey(longKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(longKey);
    });

    it("应该能解密包含特殊字符的密钥", () => {
      const specialKey = "sk-test!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const encrypted = encryptApiKey(specialKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(specialKey);
    });
  });

  describe("isEncrypted", () => {
    it("应该识别加密格式", () => {
      const apiKey = "sk-test1234567890";
      const encrypted = encryptApiKey(apiKey);

      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("应该识别明文格式", () => {
      expect(isEncrypted("sk-test1234567890")).toBe(false);
      expect(isEncrypted("plain-text-key")).toBe(false);
    });

    it("应该处理空字符串", () => {
      expect(isEncrypted("")).toBe(false);
    });

    it("应该拒绝格式错误的数据", () => {
      expect(isEncrypted("a:b")).toBe(false);
      expect(isEncrypted("a:b:c:d")).toBe(false);
      expect(isEncrypted("not:hex:data")).toBe(false);
    });
  });

  describe("generateEncryptionKey", () => {
    it("应该生成 64 个十六进制字符", () => {
      const key = generateEncryptionKey();

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]+$/i);
    });

    it("每次生成的密钥应该不同", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe("端到端测试", () => {
    it("应该能处理多次加密解密循环", () => {
      const original = "sk-test1234567890";

      for (let i = 0; i < 10; i++) {
        const encrypted = encryptApiKey(original);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(original);
      }
    });

    it("应该能处理不同长度的密钥", () => {
      const keys = [
        "sk-short",
        "sk-medium-length-key-12345",
        "sk-" + "x".repeat(200),
      ];

      for (const key of keys) {
        const encrypted = encryptApiKey(key);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(key);
      }
    });

    it("应该能处理 Unicode 字符", () => {
      const unicodeKey = "sk-测试-🔑-key";
      const encrypted = encryptApiKey(unicodeKey);
      const decrypted = decryptApiKey(encrypted);

      expect(decrypted).toBe(unicodeKey);
    });
  });

  describe("错误处理", () => {
    it("缺少 ENCRYPTION_KEY 应该抛出错误", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => encryptApiKey("test")).toThrow(
        "ENCRYPTION_KEY 环境变量未设置"
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it("ENCRYPTION_KEY 长度错误应该抛出错误", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "too-short";

      expect(() => encryptApiKey("test")).toThrow(
        "ENCRYPTION_KEY 必须是 64 个十六进制字符"
      );

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it("ENCRYPTION_KEY 格式错误应该抛出错误", () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "g".repeat(64); // 非十六进制字符

      expect(() => encryptApiKey("test")).toThrow();

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });
});
