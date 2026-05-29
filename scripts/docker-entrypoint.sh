#!/usr/bin/env sh
set -eu

mkdir -p /app/data /app/public/uploads

echo "执行数据库迁移"
npx prisma migrate deploy

echo "启动 errbook"
exec node server.js
