# Docker 镜像进阶优化 - 快速参考

## 🎯 三个优化级别

| 级别 | 镜像大小 | 减少幅度 | 风险 | 使用场景 |
|------|---------|---------|------|----------|
| **当前** | ~320MB | - | - | 开发环境 |
| **级别 1** | ~220MB | 31% ⬇️ | ⭐ 低 | 测试环境 |
| **级别 2** | ~150MB | 53% ⬇️ | ⭐⭐ 中 | 生产环境 |
| **级别 3** | ~100MB | 69% ⬇️ | ⭐⭐⭐ 高 | 极致优化 |

## 🚀 快速开始

### 级别 1：进阶优化（推荐）

```bash
# 构建
docker build -f Dockerfile.advanced -t errbook:advanced .

# 测试
docker run --rm -p 3000:3000 errbook:advanced

# 对比
./scripts/compare-advanced-docker.sh
```

**优化内容**:
- ✅ 删除 source maps
- ✅ 清理文档和测试文件
- ✅ 优化 Prisma Client
- ✅ 删除未使用的引擎

**效果**: 减少 50-100MB

### 级别 2：pnpm 优化

```bash
# 准备
pnpm import  # 生成 pnpm-lock.yaml

# 构建
docker build -f Dockerfile.pnpm -t errbook:pnpm .

# 测试
docker run --rm -p 3000:3000 errbook:pnpm
```

**优化内容**:
- ✅ 使用 pnpm 替代 npm
- ✅ 更小的 node_modules
- ✅ 启用 BuildKit 缓存

**效果**: 减少 100-170MB

### 级别 3：极致优化

```bash
# 使用 docker-slim
docker-slim build errbook:pnpm

# 或使用 distroless
# 需要修改 Dockerfile
```

**优化内容**:
- ✅ 自动删除未使用文件
- ✅ 使用 distroless 镜像
- ✅ 静态编译

**效果**: 额外减少 30-70%

## 📊 优化对比

### 文件大小分解

| 组件 | 当前 | 级别 1 | 级别 2 | 级别 3 |
|------|------|--------|--------|--------|
| 基础镜像 | 50MB | 50MB | 50MB | 30MB |
| node_modules | 200MB | 150MB | 80MB | 60MB |
| 应用代码 | 50MB | 30MB | 20MB | 10MB |
| 其他 | 20MB | 10MB | 5MB | 5MB |
| **总计** | **320MB** | **220MB** | **150MB** | **100MB** |

## ⚠️ 风险提示

### 级别 1（低风险）
- ✅ 可直接使用
- ✅ 不影响功能
- ✅ 不影响调试

### 级别 2（中风险）
- ⚠️ 需要生成 pnpm-lock.yaml
- ⚠️ 需要完整功能测试
- ⚠️ 可能影响依赖解析

### 级别 3（高风险）
- 🔴 无法 shell 调试
- 🔴 需要充分测试
- 🔴 可能遇到兼容性问题

## 🔍 验证清单

- [ ] 应用能正常启动
- [ ] 登录/注册功能正常
- [ ] 错题 CRUD 功能正常
- [ ] 文件上传功能正常
- [ ] AI 功能正常
- [ ] 数据库连接正常
- [ ] 日志输出正常

## 📁 相关文件

- `Dockerfile` - 当前版本
- `Dockerfile.advanced` - 级别 1 优化
- `Dockerfile.pnpm` - 级别 2 优化
- `scripts/compare-advanced-docker.sh` - 对比脚本
- `.claude/docker-advanced-optimization.md` - 完整指南

## 💡 推荐方案

**开发环境**: 使用当前版本（320MB）
- 包含调试工具
- 开发体验好

**测试环境**: 使用级别 1（220MB）
- 平衡大小和功能
- 保留调试能力

**生产环境**: 使用级别 2（150MB）
- 显著减小体积
- 保持稳定性

**极致优化**: 使用级别 3（100MB）
- 最小体积
- 需要充分测试

## 🎯 实施建议

1. **先测试级别 1**
   - 风险低，效果明显
   - 立即可用

2. **充分测试后使用级别 2**
   - 需要生成 pnpm-lock.yaml
   - 完整功能测试

3. **谨慎使用级别 3**
   - 只在必要时使用
   - 需要充分测试和监控

---

**更新**: 2026-05-29 | **版本**: v3.0 进阶优化
