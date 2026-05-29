#!/bin/bash
set -e

# 生产环境部署脚本

echo "🚀 错题本项目 - 生产环境部署"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置
IMAGE_NAME="errbook"
TAG="production"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo -e "${BLUE}📋 部署信息${NC}"
echo "镜像名称: ${FULL_IMAGE_NAME}"
echo "优化级别: pnpm 优化（生产级别）"
echo "预计大小: ~150MB"
echo ""

# 步骤 1: 检查 pnpm-lock.yaml
echo -e "${BLUE}[1/6] 检查 pnpm-lock.yaml...${NC}"
if [ ! -f "pnpm-lock.yaml" ]; then
    echo -e "${RED}❌ 未找到 pnpm-lock.yaml${NC}"
    echo -e "${YELLOW}正在生成...${NC}"
    pnpm import
    echo -e "${GREEN}✅ pnpm-lock.yaml 已生成${NC}"
else
    echo -e "${GREEN}✅ pnpm-lock.yaml 已存在${NC}"
fi
echo ""

# 步骤 2: 测试 pnpm 安装
echo -e "${BLUE}[2/6] 测试 pnpm 安装...${NC}"
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
    echo -e "${GREEN}✅ pnpm 安装测试通过${NC}"
else
    echo -e "${RED}❌ pnpm 安装失败${NC}"
    exit 1
fi
echo ""

# 步骤 3: 构建生产镜像
echo -e "${BLUE}[3/6] 构建生产镜像...${NC}"
echo "使用 Dockerfile.pnpm 构建..."
docker build -f Dockerfile.pnpm -t "${FULL_IMAGE_NAME}" . 2>&1 | tail -10

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi
echo ""

# 步骤 4: 显示镜像信息
echo -e "${BLUE}[4/6] 镜像信息${NC}"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# 步骤 5: 测试镜像
echo -e "${BLUE}[5/6] 测试镜像...${NC}"
echo "启动测试容器..."
docker run -d --name errbook-test -p 3001:3000 "${FULL_IMAGE_NAME}"

echo "等待应用启动..."
sleep 5

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 镜像功能测试通过${NC}"
else
    echo -e "${RED}❌ 镜像功能测试失败${NC}"
    docker logs errbook-test
    docker stop errbook-test > /dev/null 2>&1
    docker rm errbook-test > /dev/null 2>&1
    exit 1
fi

echo "清理测试容器..."
docker stop errbook-test > /dev/null 2>&1
docker rm errbook-test > /dev/null 2>&1
echo ""

# 步骤 6: 部署到生产环境
echo -e "${BLUE}[6/6] 部署到生产环境${NC}"
echo -e "${YELLOW}使用 docker-compose 启动生产服务...${NC}"

# 停止旧容器
if docker ps -a | grep -q errbook-prod; then
    echo "停止旧容器..."
    docker-compose -f docker-compose.production.yml down
fi

# 启动新容器
echo "启动新容器..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "等待服务就绪..."
sleep 5

# 健康检查
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 生产服务启动成功${NC}"
else
    echo -e "${RED}❌ 生产服务启动失败${NC}"
    docker-compose -f docker-compose.production.yml logs
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "========================================"
echo ""
echo "服务信息:"
echo "  - 访问地址: http://localhost:3000"
echo "  - 容器名称: errbook-prod"
echo "  - 镜像版本: ${FULL_IMAGE_NAME}"
echo ""
echo "常用命令:"
echo "  - 查看日志: docker-compose -f docker-compose.production.yml logs -f"
echo "  - 停止服务: docker-compose -f docker-compose.production.yml down"
echo "  - 重启服务: docker-compose -f docker-compose.production.yml restart"
echo "  - 查看状态: docker-compose -f docker-compose.production.yml ps"
echo ""
echo "镜像信息:"
docker images "${IMAGE_NAME}:${TAG}" --format "  大小: {{.Size}}"
echo ""
