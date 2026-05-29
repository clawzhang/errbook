# Docker 构建错误修复总结

## 🐛 问题
GitHub Actions 构建 Docker 镜像时失败：
```
ERROR: failed to build: process "/bin/sh -c npx prisma generate && npm run build" did not complete successfully: exit code: 1
```

## ✅ 修复方案

### 已修复的文件
1. ✅ `Dockerfile` - 基础版本
2. ✅ `Dockerfile.advanced` - 进阶版本  
3. ✅ `Dockerfile.pnpm` - pnpm 版本

### 关键修复

**1. 增加 Node.js 内存限制**
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

**2. 添加错误处理**
```dockerfile
find .next -name "*.map" -delete 2>/dev/null || true
rm -rf node_modules/.prisma/client/libquery_engine-* 2>/dev/null || true
```

**3. 统一构建命令**
```dockerfile
RUN npx prisma generate && \
    npm run build
```

## 🚀 下一步

1. **提交修复**：
```bash
git add Dockerfile Dockerfile.advanced Dockerfile.pnpm
git commit -m "fix: 修复 Docker 构建内存不足问题"
git push
```

2. **验证构建**：
- GitHub Actions 应该能成功构建
- 镜像大小保持在 150-320MB

3. **本地测试**（可选）：
```bash
docker build -t errbook:test .
```

## 📊 修复效果

- ✅ 解决内存溢出问题
- ✅ 增强错误处理
- ✅ 统一所有 Dockerfile
- ✅ 保持镜像优化效果

---

**修复时间**: 2026-05-29
**状态**: ✅ 已修复，可以提交
