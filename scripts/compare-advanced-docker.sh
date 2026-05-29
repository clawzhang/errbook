#!/bin/bash
set -e

# Docker 镜像进阶优化对比脚本

echo "🚀 Docker 镜像进阶优化对比测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 构建所有版本
echo -e "${BLUE}📦 构建所有优化版本...${NC}"
echo ""

# 1. 当前版本
echo -e "${YELLOW}[1/3] 构建当前版本...${NC}"
docker build -t errbook:current . 2>&1 | tail -3
CURRENT_SIZE=$(docker images errbook:current --format "{{.Size}}")
echo -e "${GREEN}✅ 当前版本: ${CURRENT_SIZE}${NC}"
echo ""

# 2. 进阶优化版本
echo -e "${YELLOW}[2/3] 构建进阶优化版本...${NC}"
docker build -f Dockerfile.advanced -t errbook:advanced . 2>&1 | tail -3
ADVANCED_SIZE=$(docker images errbook:advanced --format "{{.Size}}")
echo -e "${GREEN}✅ 进阶版本: ${ADVANCED_SIZE}${NC}"
echo ""

# 3. pnpm 版本（如果存在 pnpm-lock.yaml）
if [ -f "pnpm-lock.yaml" ]; then
    echo -e "${YELLOW}[3/3] 构建 pnpm 优化版本...${NC}"
    docker build -f Dockerfile.pnpm -t errbook:pnpm . 2>&1 | tail -3
    PNPM_SIZE=$(docker images errbook:pnpm --format "{{.Size}}")
    echo -e "${GREEN}✅ pnpm 版本: ${PNPM_SIZE}${NC}"
else
    echo -e "${YELLOW}[3/3] 跳过 pnpm 版本（未找到 pnpm-lock.yaml）${NC}"
    echo -e "${BLUE}💡 提示: 运行 'pnpm import' 生成 pnpm-lock.yaml${NC}"
    PNPM_SIZE="N/A"
fi

echo ""
echo "========================================"
echo -e "${BLUE}📊 镜像大小对比${NC}"
echo "========================================"
echo ""

# 显示对比表格
printf "%-20s %-15s %-15s\n" "版本" "大小" "说明"
printf "%-20s %-15s %-15s\n" "----" "----" "----"
printf "%-20s %-15s %-15s\n" "当前版本" "$CURRENT_SIZE" "基础优化"
printf "%-20s %-15s %-15s\n" "进阶版本" "$ADVANCED_SIZE" "清理文件"
if [ "$PNPM_SIZE" != "N/A" ]; then
    printf "%-20s %-15s %-15s\n" "pnpm 版本" "$PNPM_SIZE" "使用 pnpm"
fi

echo ""
echo "========================================"
echo -e "${BLUE}🔍 详细镜像信息${NC}"
echo "========================================"
docker images errbook --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "========================================"
echo -e "${BLUE}📋 镜像层分析（进阶版本）${NC}"
echo "========================================"
docker history errbook:advanced --human | head -15

echo ""
echo "========================================"
echo -e "${BLUE}🧪 功能测试${NC}"
echo "========================================"

# 测试进阶版本
echo -e "${YELLOW}测试进阶版本...${NC}"
docker run -d --name test-advanced -p 3001:3000 errbook:advanced
sleep 3

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 进阶版本功能正常${NC}"
else
    echo -e "${RED}❌ 进阶版本功能异常${NC}"
fi

docker stop test-advanced > /dev/null 2>&1
docker rm test-advanced > /dev/null 2>&1

echo ""
echo "========================================"
echo -e "${BLUE}💾 磁盘空间节省${NC}"
echo "========================================"

# 计算节省的空间（简化版）
echo "当前版本 → 进阶版本："
echo "  预计节省: 50-100MB"
echo ""
if [ "$PNPM_SIZE" != "N/A" ]; then
    echo "当前版本 → pnpm 版本："
    echo "  预计节省: 100-170MB"
    echo ""
fi

echo "========================================"
echo -e "${YELLOW}💡 优化建议${NC}"
echo "========================================"
echo ""
echo "1. 立即可用: 进阶版本（Dockerfile.advanced）"
echo "   - 删除 source maps"
echo "   - 清理文档和测试文件"
echo "   - 优化 Prisma Client"
echo "   - 预计减少: 50-100MB"
echo ""
echo "2. 需要测试: pnpm 版本（Dockerfile.pnpm）"
echo "   - 使用 pnpm 替代 npm"
echo "   - 更小的 node_modules"
echo "   - 预计减少: 100-170MB"
echo "   - 需要先运行: pnpm import"
echo ""
echo "3. 进一步优化:"
echo "   - 使用 docker-slim: docker-slim build errbook:advanced"
echo "   - 使用 distroless 镜像"
echo "   - 预计额外减少: 30-70%"
echo ""

echo "========================================"
echo -e "${GREEN}🎉 对比测试完成！${NC}"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 选择合适的优化级别"
echo "2. 运行完整功能测试"
echo "3. 部署到测试环境验证"
echo ""
