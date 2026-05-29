#!/usr/bin/env sh
set -eu

mkdir -p /app/data /app/public/uploads

echo "执行数据库迁移"
npx prisma migrate deploy

echo "启动 errbook"
if [ -f "./server.js" ]; then
  exec node server.js
fi

if [ -x "./node_modules/.bin/next" ]; then
  exec ./node_modules/.bin/next start
fi

echo "未找到可用的 Next.js 启动入口：缺少 server.js 和 node_modules/.bin/next"
echo "当前 /app 目录内容："
ls -la /app
exit 1
