#!/usr/bin/env sh
set -eu

if [ ! -f ".env.docker" ]; then
  cp ".env.docker.example" ".env.docker"
  echo "已生成 .env.docker，请先修改 AUTH_SECRET 和外部访问地址后再执行部署。"
  exit 1
fi

echo "开始构建并启动 errbook 服务"
docker compose up -d --build
echo "部署完成：docker compose ps 可查看服务状态"
