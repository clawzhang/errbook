#!/usr/bin/env sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-errbook:latest}"
OUTPUT_FILE="${OUTPUT_FILE:-errbook-image.tar.gz}"

echo "开始构建镜像：${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .

echo "开始导出镜像：${OUTPUT_FILE}"
docker save "${IMAGE_NAME}" | gzip > "${OUTPUT_FILE}"

echo "镜像包已生成：${OUTPUT_FILE}"
