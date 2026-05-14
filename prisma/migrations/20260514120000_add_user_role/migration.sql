-- 为管理员用户管理增加角色字段。SQLite 使用 TEXT 保存枚举值。
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
