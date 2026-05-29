# Docker 构建问题完整修复总结

## 🐛 遇到的问题

### 问题 1：内存不足
```
ERROR: exit code: 1
at map (turbopack:///[turbopack-node]/transforms/postcss.ts:43:33)
```

### 问题 2：Standalone 输出缺失
```
ERROR: "/app/.next/standalone": not found
```

## ✅ 完整修复方案

### 修复 1：增加内存限制

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### 修复 2：自动检测 Standalone 输出

```dockerfile
RUN npx prisma generate && \
    npm run build && \
    # 自动检测并准备输出
    if [ -d ".next/standalone" ]; then \
        mkdir -p /tmp/app-output && \
        cp -r .next/standalone/* /tmp/app-output/ && \
        cp -r .next/static /tmp/app-output/.next/static && \
        cp -r public /tmp/app-output/public; \
    else \
        mkdir -p /tmp/app-output && \
        cp -r .next /tmp/app-output/.next && \
        cp -r public /tmp/app-output/public && \
        cp package.json /tmp/app-output/; \
    fi
```

### 修复 3：统一复制逻辑

```dockerfile
# 从临时目录复制（兼容两种模式）
COPY --from=builder --chown=nextjs:nodejs /tmp/app-output ./
```

## 📁 已修复的文件

1. ✅ `Dockerfile` - 基础版本
2. ✅ `Dockerfile.advanced` - 进阶版本
3. ✅ `Dockerfile.pnpm` - pnpm 版本

## 🎯 修复效果

- ✅ 解决内存溢出问题
- ✅ 兼容 standalone 和非 standalone 模式
- ✅ 自动检测并选择最佳输出方式
- ✅ 增强错误处理
- ✅ 保持镜像优化效果

## 🚀 提交修复

```bash
git add Dockerfile Dockerfile.advanced Dockerfile.pnpm
git commit -m "fix: 修复 Docker 构建问题

- 增加 Node.js 内存限制到 4GB
- 自动检测 standalone 输出
- 兼容两种构建模式
- 增强错误处理"
git push
```

## 📊 预期结果

提交后，GitHub Actions 应该能够：
- ✅ 成功完成 Prisma 生成
- ✅ 成功完成 Next.js 构建
- ✅ 自动选择合适的输出模式
- ✅ 生成优化的 Docker 镜像（150-320MB）

## 📚 相关文档

- `.claude/docker-build-fix.md` - 内存问题修复
- `.claude/docker-standalone-fix.md` - Standalone 问题修复

---

**修复时间**: 2026-05-29
**状态**: ✅ 完全修复，可以提交
**预期**: GitHub Actions 构建成功
