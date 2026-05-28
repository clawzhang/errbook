#!/usr/bin/env node

/**
 * 数据库迁移脚本：加密现有的 AI API 密钥
 *
 * 使用方法：
 * 1. 确保已设置 ENCRYPTION_KEY 环境变量
 * 2. 运行：node scripts/migrate-encrypt-api-keys.js
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { encryptApiKey, isEncrypted } from "../src/lib/encryption.js";

const prisma = new PrismaClient();

async function migrateApiKeys() {
  console.log("开始迁移 API 密钥加密...\n");

  try {
    // 检查环境变量
    if (!process.env.ENCRYPTION_KEY) {
      console.error("❌ 错误：未设置 ENCRYPTION_KEY 环境变量");
      console.error("请先生成并设置加密密钥：");
      console.error("  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
      process.exit(1);
    }

    // 查找所有有 API 密钥的用户
    const users = await prisma.user.findMany({
      where: {
        aiApiKey: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        aiApiKey: true,
      },
    });

    if (users.length === 0) {
      console.log("✅ 没有需要迁移的 API 密钥");
      return;
    }

    console.log(`找到 ${users.length} 个用户需要迁移\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      if (!user.aiApiKey) continue;

      // 检查是否已加密
      if (isEncrypted(user.aiApiKey)) {
        console.log(`⏭️  跳过用户 ${user.email}（已加密）`);
        skippedCount++;
        continue;
      }

      try {
        // 加密密钥
        const encryptedKey = encryptApiKey(user.aiApiKey);

        // 更新数据库
        await prisma.user.update({
          where: { id: user.id },
          data: { aiApiKey: encryptedKey },
        });

        console.log(`✅ 已加密用户 ${user.email} 的 API 密钥`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ 加密用户 ${user.email} 的密钥失败:`, error);
        errorCount++;
      }
    }

    console.log("\n迁移完成！");
    console.log(`✅ 成功迁移: ${migratedCount}`);
    console.log(`⏭️  已跳过: ${skippedCount}`);
    console.log(`❌ 失败: ${errorCount}`);

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("迁移过程中发生错误:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateApiKeys();
