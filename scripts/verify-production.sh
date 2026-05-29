#!/bin/bash
set -e

# 生产环境快速验证脚本

echo "🔍 生产环境快速验证"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 验证计数
PASSED=0
FAILED=0

# 验证函数
verify() {
    local test_name=$1
    local command=$2

    echo -n "检查 ${test_name}... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}📋 环境检查${NC}"
echo ""

# 1. 检查 pnpm
verify "pnpm 已安装" "which pnpm"

# 2. 检查 Docker
verify "Docker 已安装" "which docker"

# 3. 检查 Docker Compose
verify "Docker Compose 已安装" "docker compose version"

# 4. 检查 pnpm-lock.yaml
verify "pnpm-lock.yaml 存在" "test -f pnpm-lock.yaml"

echo ""
echo -e "${BLUE}📦 依赖检查${NC}"
echo ""

# 5. 检查 node_modules
if [ -d "node_modules" ]; then
    verify "node_modules 存在" "test -d node_modules"

    # 检查关键依赖
    verify "next 已安装" "test -d node_modules/next"
    verify "react 已安装" "test -d node_modules/react"
    verify "prisma 已安装" "test -d node_modules/prisma"
else
    echo -e "${YELLOW}⚠️  node_modules 不存在，需要运行 pnpm install${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Docker 检查${NC}"
echo ""

# 6. 检查 Dockerfile
verify "Dockerfile.pnpm 存在" "test -f Dockerfile.pnpm"

# 7. 检查 docker-compose
verify "docker-compose.production.yml 存在" "test -f docker-compose.production.yml"

# 8. 检查 Docker 镜像
if docker images | grep -q "errbook.*production"; then
    verify "生产镜像已构建" "docker images | grep -q 'errbook.*production'"

    # 显示镜像信息
    echo ""
    echo -e "${BLUE}镜像信息:${NC}"
    docker images errbook:production --format "  名称: {{.Repository}}:{{.Tag}}\n  大小: {{.Size}}\n  创建: {{.CreatedAt}}"
else
    echo -e "${YELLOW}⚠️  生产镜像未构建，需要运行构建脚本${NC}"
fi

echo ""
echo -e "${BLUE}🚀 服务检查${NC}"
echo ""

# 9. 检查容器是否运行
if docker ps | grep -q "errbook-prod"; then
    verify "生产容器运行中" "docker ps | grep -q 'errbook-prod'"

    # 10. 检查服务可访问
    verify "服务可访问" "curl -f http://localhost:3000 > /dev/null 2>&1"

    # 显示容器信息
    echo ""
    echo -e "${BLUE}容器信息:${NC}"
    docker ps --filter "name=errbook-prod" --format "  名称: {{.Names}}\n  状态: {{.Status}}\n  端口: {{.Ports}}"
else
    echo -e "${YELLOW}⚠️  生产容器未运行${NC}"
fi

echo ""
echo "========================================"
echo -e "${BLUE}📊 验证结果${NC}"
echo "========================================"
echo ""
echo -e "通过: ${GREEN}${PASSED}${NC}"
echo -e "失败: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！生产环境就绪。${NC}"
    echo ""
    echo "下一步:"
    echo "  1. 如果镜像未构建: ./scripts/deploy-production.sh"
    echo "  2. 如果容器未运行: docker-compose -f docker-compose.production.yml up -d"
    echo "  3. 访问应用: http://localhost:3000"
    exit 0
else
    echo -e "${YELLOW}⚠️  部分检查失败，请查看上述错误。${NC}"
    echo ""
    echo "常见问题:"
    echo "  - pnpm 未安装: npm install -g pnpm"
    echo "  - node_modules 缺失: pnpm install"
    echo "  - 镜像未构建: ./scripts/deploy-production.sh"
    echo "  - 容器未运行: docker-compose -f docker-compose.production.yml up -d"
    exit 1
fi
