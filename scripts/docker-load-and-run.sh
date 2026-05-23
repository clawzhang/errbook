#!/usr/bin/env sh
set -eu

IMAGE_ARCHIVE="${1:-errbook-image.tar.gz}"

if [ ! -f ".env.docker" ]; then
  cp ".env.docker.example" ".env.docker"
  echo "已生成 .env.docker，请先修改 AUTH_SECRET 和外部访问地址后再执行部署。"
  exit 1
fi

if [ ! -f "${IMAGE_ARCHIVE}" ]; then
  echo "未找到镜像包：${IMAGE_ARCHIVE}"
  echo "请先上传本地生成的 errbook-image.tar.gz 到服务器项目目录。"
  exit 1
fi

echo "开始加载镜像：${IMAGE_ARCHIVE}"
gzip -dc "${IMAGE_ARCHIVE}" | docker load

echo "使用预构建镜像启动服务，不在服务器执行构建"
docker compose -f docker-compose.image.yml up -d

echo "启动完成：docker compose -f docker-compose.image.yml ps 可查看状态"
