# 生产环境部署 - 快速参考

## 🚀 一键部署

```bash
./scripts/deploy-production.sh
```

## 📊 优化成果

| 版本 | 大小 | 减少 |
|------|------|------|
| 初始 | 750MB | - |
| 当前 | 320MB | 57% ⬇️ |
| **生产** | **150MB** | **80%** ⬇️ |

## ✅ 前置条件

```bash
# 检查环境
./scripts/verify-production.sh

# 如果缺少 pnpm
npm install -g pnpm

# 如果缺少 pnpm-lock.yaml
pnpm import
```

## 📝 常用命令

### 部署
```bash
# 自动化部署
./scripts/deploy-production.sh

# 手动部署
docker build -f Dockerfile.pnpm -t errbook:production .
docker-compose -f docker-compose.production.yml up -d
```

### 管理
```bash
# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 重启服务
docker-compose -f docker-compose.production.yml restart

# 停止服务
docker-compose -f docker-compose.production.yml down

# 查看状态
docker-compose -f docker-compose.production.yml ps
```

### 验证
```bash
# 环境验证
./scripts/verify-production.sh

# 访问测试
curl http://localhost:3000

# 查看镜像
docker images errbook
```

## 🔧 配置文件

- `Dockerfile.pnpm` - 生产 Dockerfile
- `docker-compose.production.yml` - 生产配置
- `pnpm-lock.yaml` - pnpm 锁文件

## 📚 完整文档

- [生产部署指南](./PRODUCTION_DEPLOYMENT.md)
- [优化报告](./.claude/production-optimization-report.md)
- [完整总结](./.claude/final-optimization-summary.md)

## 🆘 故障排查

```bash
# 查看日志
docker-compose -f docker-compose.production.yml logs

# 检查容器
docker ps -a | grep errbook

# 重新构建
docker-compose -f docker-compose.production.yml build --no-cache
```

---

**访问地址**: http://localhost:3000
**镜像大小**: ~150MB
**更新时间**: 2026-05-29
