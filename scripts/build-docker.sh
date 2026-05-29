#!/bin/bash
set -e

# Docker 镜像构建和优化脚本

echo "🚀 开始构建 Docker 镜像..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="errbook"
TAG="${1:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo -e "${BLUE}📦 镜像名称: ${FULL_IMAGE_NAME}${NC}"

# 清理旧的构建缓存（可选）
if [ "$2" == "--no-cache" ]; then
    echo -e "${YELLOW}🧹 清理构建缓存...${NC}"
    docker builder prune -f
fi

# 构建镜像
echo -e "${BLUE}🔨 构建镜像...${NC}"
docker build \
    --tag "${FULL_IMAGE_NAME}" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    ${2:+--no-cache} \
    .

# 显示镜像大小
echo -e "${GREEN}✅ 构建完成！${NC}"
echo ""
echo -e "${BLUE}📊 镜像信息:${NC}"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# 分析镜像层
echo ""
echo -e "${BLUE}🔍 镜像层分析:${NC}"
docker history "${FULL_IMAGE_NAME}" --human --no-trunc | head -20

# 提供优化建议
echo ""
echo -e "${YELLOW}💡 优化建议:${NC}"
echo "1. 使用 'docker run --rm ${FULL_IMAGE_NAME}' 测试镜像"
echo "2. 使用 'dive ${FULL_IMAGE_NAME}' 深度分析镜像层"
echo "3. 使用 'docker-compose up' 启动完整服务"
echo ""
echo -e "${GREEN}🎉 镜像构建成功！${NC}"
