# syntax=docker/dockerfile:1.7

# ============================================
# 阶段 1: 基础镜像（Alpine Linux，最小体积）
# ============================================
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# 只安装运行时必需的依赖
RUN apk add --no-cache libc6-compat openssl

# ============================================
# 阶段 2: 依赖安装（分离生产和开发依赖）
# ============================================
FROM base AS deps

COPY package.json package-lock.json ./

# 只安装生产依赖，清理缓存
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ============================================
# 阶段 3: 构建依赖（包含开发依赖）
# ============================================
FROM base AS build-deps

# 安装构建工具
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci && \
    npm cache clean --force

# ============================================
# 阶段 4: 构建应用
# ============================================
FROM base AS builder

# 安装构建工具
RUN apk add --no-cache python3 make g++

# 复制所有依赖
COPY --from=build-deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

ENV DATABASE_URL=file:/app/data/dev.db \
    NODE_OPTIONS="--max-old-space-size=4096"

# 生成 Prisma Client 并构建
RUN npx prisma generate && \
    npm run build && \
    # 删除 source maps
    find .next -name "*.map" -delete 2>/dev/null || true

# 准备输出目录
RUN mkdir -p /tmp/app-output && \
    if [ -d ".next/standalone" ]; then \
        echo "✅ Using standalone output"; \
        cp -r .next/standalone/* /tmp/app-output/ && \
        mkdir -p /tmp/app-output/.next && \
        cp -r .next/static /tmp/app-output/.next/static && \
        cp -r public /tmp/app-output/public; \
    else \
        echo "⚠️  Using full .next output"; \
        cp -r .next /tmp/app-output/.next && \
        cp -r public /tmp/app-output/public && \
        cp package.json /tmp/app-output/package.json; \
    fi

# ============================================
# 阶段 5: 生产运行镜像（最小化）
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/dev.db \
    UPLOAD_DIR=/app/public/uploads

# 安装运行时依赖和 dumb-init
RUN apk add --no-cache openssl dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app

# 只复制生产依赖（从 deps 阶段）
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# 复制构建产物（从临时目录）
COPY --from=builder --chown=nextjs:nodejs /tmp/app-output ./

# 复制 Prisma 相关文件
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 复制启动脚本
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# 使用 dumb-init 优雅处理信号
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./scripts/docker-entrypoint.sh"]
