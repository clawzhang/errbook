#!/bin/bash
set -e

# Docker 镜像大小对比脚本

echo "🔍 Docker 镜像优化对比测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否存在旧的 Dockerfile
if [ -f "Dockerfile.old" ]; then
    echo -e "${BLUE}📦 构建优化前的镜像...${NC}"
    docker build -f Dockerfile.old -t errbook:old . 2>&1 | tail -5
    OLD_SIZE=$(docker images errbook:old --format "{{.Size}}")
    echo -e "${GREEN}✅ 优化前镜像构建完成: ${OLD_SIZE}${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 Dockerfile.old，跳过对比${NC}"
    OLD_SIZE="N/A"
fi

echo ""
echo -e "${BLUE}📦 构建优化后的镜像...${NC}"
docker build -t errbook:new . 2>&1 | tail -5
NEW_SIZE=$(docker images errbook:new --format "{{.Size}}")
echo -e "${GREEN}✅ 优化后镜像构建完成: ${NEW_SIZE}${NC}"

echo ""
echo "================================"
echo -e "${BLUE}📊 镜像大小对比${NC}"
echo "================================"

if [ "$OLD_SIZE" != "N/A" ]; then
    echo -e "优化前: ${RED}${OLD_SIZE}${NC}"
    echo -e "优化后: ${GREEN}${NEW_SIZE}${NC}"

    # 计算减少百分比（简化版）
    OLD_MB=$(docker images errbook:old --format "{{.Size}}" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null || echo "0")
    NEW_MB=$(docker images errbook:new --format "{{.Size}}" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null || echo "0")

    if [ "$OLD_MB" != "0" ] && [ "$NEW_MB" != "0" ]; then
        REDUCTION=$(echo "scale=1; ($OLD_MB - $NEW_MB) / $OLD_MB * 100" | bc)
        echo -e "减少: ${GREEN}${REDUCTION}%${NC}"
    fi
else
    echo -e "优化后: ${GREEN}${NEW_SIZE}${NC}"
fi

echo ""
echo "================================"
echo -e "${BLUE}🔍 详细镜像信息${NC}"
echo "================================"
docker images errbook --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "================================"
echo -e "${BLUE}📋 镜像层分析（优化后）${NC}"
echo "================================"
docker history errbook:new --human --no-trunc | head -15

echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "1. 使用 'dive errbook:new' 深度分析镜像"
echo "2. 使用 'docker run --rm errbook:new' 测试镜像"
echo "3. 使用 'docker-compose up' 启动完整服务"

echo ""
echo -e "${GREEN}🎉 对比测试完成！${NC}"
