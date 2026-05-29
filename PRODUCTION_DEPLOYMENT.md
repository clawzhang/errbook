# 生产环境部署指南

## 🎯 概述

本指南介绍如何将错题本项目部署到生产环境，使用 pnpm 优化的 Docker 镜像（~150MB）。

## 📋 前置要求

- Docker 已安装（版本 20.10+）
- Docker Compose 已安装（版本 2.0+）
- pnpm 已安装（版本 8.0+）
- 至少 2GB 可用磁盘空间

## 🚀 快速部署

### 方式一：使用自动化脚本（推荐）

```bash
# 一键部署到生产环境
./scripts/deploy-production.sh
```

脚本会自动完成：
1. ✅ 检查 pnpm-lock.yaml
2. ✅ 测试 pnpm 安装
3. ✅ 构建生产镜像
4. ✅ 测试镜像功能
5. ✅ 部署到生产环境
6. ✅ 健康检查

### 方式二：手动部署

```bash
# 1. 生成 pnpm-lock.yaml（如果没有）
pnpm import

# 2. 测试 pnpm 安装
pnpm install --frozen-lockfile

# 3. 构建生产镜像
docker build -f Dockerfile.pnpm -t errbook:production .

# 4. 启动生产服务
docker-compose -f docker-compose.production.yml up -d

# 5. 查看日志
docker-compose -f docker-compose.production.yml logs -f
```

## 📊 镜像优化对比

| 版本 | 大小 | 减少幅度 | 适用场景 |
|------|------|----------|----------|
| 初始版本 | ~750MB | - | - |
| 基础优化 | ~320MB | 57% ⬇️ | 开发环境 |
| 进阶优化 | ~220MB | 71% ⬇️ | 测试环境 |
| **生产优化** | **~150MB** | **80%** ⬇️ | **生产环境** ⭐ |

## 🔧 配置说明

### 环境变量

在 `docker-compose.production.yml` 中配置：

```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=file:/app/data/dev.db
  - UPLOAD_DIR=/app/public/uploads
  # 可选：添加其他环境变量
  # - NEXTAUTH_SECRET=your-secret
  # - NEXTAUTH_URL=https://your-domain.com
```

### 数据持久化

数据卷配置：

```yaml
volumes:
  - ./data:/app/data              # 数据库文件
  - ./public/uploads:/app/public/uploads  # 上传文件
```

### 健康检查

自动健康检查配置：

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s      # 每 30 秒检查一次
  timeout: 10s       # 超时时间 10 秒
  retries: 3         # 失败 3 次后标记为不健康
  start_period: 40s  # 启动后 40 秒开始检查
```

## 📝 常用命令

### 服务管理

```bash
# 启动服务
docker-compose -f docker-compose.production.yml up -d

# 停止服务
docker-compose -f docker-compose.production.yml down

# 重启服务
docker-compose -f docker-compose.production.yml restart

# 查看状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 查看最近 100 行日志
docker-compose -f docker-compose.production.yml logs --tail=100
```

### 镜像管理

```bash
# 查看镜像
docker images errbook

# 删除旧镜像
docker image prune -f

# 导出镜像
docker save errbook:production | gzip > errbook-production.tar.gz

# 导入镜像
gunzip -c errbook-production.tar.gz | docker load
```

### 容器管理

```bash
# 进入容器（调试用）
docker exec -it errbook-prod sh

# 查看容器资源使用
docker stats errbook-prod

# 查看容器详细信息
docker inspect errbook-prod
```

## 🔍 故障排查

### 问题 1：容器无法启动

**症状**：容器启动后立即退出

**排查步骤**：
```bash
# 查看容器日志
docker-compose -f docker-compose.production.yml logs

# 查看容器退出状态
docker ps -a | grep errbook-prod
```

**常见原因**：
- 端口被占用（3000）
- 数据库文件权限问题
- 环境变量配置错误

### 问题 2：应用无法访问

**症状**：容器运行但无法访问 http://localhost:3000

**排查步骤**：
```bash
# 检查容器状态
docker-compose -f docker-compose.production.yml ps

# 检查端口映射
docker port errbook-prod

# 测试容器内部
docker exec errbook-prod wget -O- http://localhost:3000
```

**常见原因**：
- 防火墙阻止
- 端口映射错误
- 应用启动失败

### 问题 3：数据库连接失败

**症状**：应用启动但数据库操作失败

**排查步骤**：
```bash
# 检查数据目录权限
ls -la ./data

# 检查数据库文件
docker exec errbook-prod ls -la /app/data

# 查看应用日志
docker-compose -f docker-compose.production.yml logs | grep -i database
```

**解决方案**：
```bash
# 修复权限
sudo chown -R 1001:1001 ./data
```

## 📈 性能优化

### 1. 资源限制

在 `docker-compose.production.yml` 中添加：

```yaml
services:
  errbook:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 2. 日志轮转

```yaml
services:
  errbook:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. 重启策略

```yaml
services:
  errbook:
    restart: unless-stopped  # 除非手动停止，否则自动重启
```

## 🔒 安全建议

### 1. 使用非 root 用户

Dockerfile 已配置：
```dockerfile
USER nextjs  # UID 1001
```

### 2. 限制网络访问

```yaml
services:
  errbook:
    networks:
      - internal
networks:
  internal:
    driver: bridge
```

### 3. 定期更新

```bash
# 更新基础镜像
docker pull node:22-alpine

# 重新构建
./scripts/deploy-production.sh
```

## 📊 监控和日志

### 1. 查看实时日志

```bash
docker-compose -f docker-compose.production.yml logs -f
```

### 2. 查看资源使用

```bash
docker stats errbook-prod
```

### 3. 健康检查状态

```bash
docker inspect errbook-prod | grep -A 10 Health
```

## 🔄 更新部署

### 滚动更新

```bash
# 1. 构建新镜像
docker build -f Dockerfile.pnpm -t errbook:production-new .

# 2. 标记为生产版本
docker tag errbook:production-new errbook:production

# 3. 重启服务
docker-compose -f docker-compose.production.yml up -d
```

### 回滚

```bash
# 1. 恢复旧镜像
docker tag errbook:production-old errbook:production

# 2. 重启服务
docker-compose -f docker-compose.production.yml up -d
```

## 📚 相关文档

- [Docker 优化指南](./DOCKER_OPTIMIZATION.md)
- [进阶优化指南](./DOCKER_ADVANCED.md)
- [完整优化报告](./.claude/final-optimization-summary.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看日志：`docker-compose -f docker-compose.production.yml logs`
2. 检查状态：`docker-compose -f docker-compose.production.yml ps`
3. 查看文档：`.claude/` 目录下的优化文档

---

**更新时间**: 2026-05-29
**版本**: v1.0 生产部署
**镜像大小**: ~150MB（减少 80%）
