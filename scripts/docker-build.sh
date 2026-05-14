#!/usr/bin/env sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-errbook:latest}"

echo "开始构建 Docker 镜像：${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .
echo "镜像构建完成：${IMAGE_NAME}"
