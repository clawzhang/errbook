# 错题集项目优化分析报告

生成时间：2026-05-28

## 📊 项目概况

- **技术栈**：Next.js 16 + React 19 + TypeScript + Prisma 7 + SQLite
- **代码规模**：约 29,000 行代码
- **功能**：错题录入、AI识别分析、知识点管理、复习调度、测试组卷、统计分析
- **部署方式**：Docker + Docker Compose

## 🔴 严重问题（需立即处理）

### 1. 构建产物异常庞大
**问题**：`.next` 目录达到 2.2GB，远超正常大小（通常应在 50-200MB）

**影响**：
- Docker 镜像体积巨大，部署缓慢
- 服务器磁盘空间浪费
- 构建时间过长

**原因分析**：
- 可能包含了开发模式的调试信息
- 可能未正确配置 source map
- 可能包含了不必要的依赖

**优化方案**：
```typescript
// next.config.ts 优化配置
const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false, // 生产环境禁用 source map
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // 移除 console
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'], // 优化包导入
  },
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
};
```

**预期效果**：构建产物减少到 100-300MB

---

### 2. 完全缺少测试
**问题**：项目中没有任何测试文件（0 个 .test.ts/.spec.ts 文件）

**影响**：
- 代码质量无法保障
- 重构风险极高
- 回归问题难以发现
- AI 功能无法验证准确性

**优化方案**：
1. 引入测试框架（推荐 Vitest + Testing Library）
2. 优先为核心功能编写测试：
   - SM2 复习算法（`src/lib/sm2.ts`）
   - AI 调用逻辑（`src/lib/ai.ts`）
   - 年级自动晋级（`src/lib/grade.ts`）
   - API 路由关键逻辑

**示例测试结构**：
```
src/
  __tests__/
    lib/
      sm2.test.ts
      ai.test.ts
      grade.test.ts
    api/
      errors.test.ts
```

**预期效果**：测试覆盖率达到 60%+ 核心逻辑

---

### 3. AI API 密钥明文存储
**问题**：用户的 AI API Key 直接存储在数据库中（`User.aiApiKey`）

**安全风险**：
- 数据库泄露直接暴露所有用户的 API 密钥
- 数据库备份文件包含敏感信息
- 管理员可直接查看用户密钥

**优化方案**：
```typescript
// 使用加密存储
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32字节密钥
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**迁移步骤**：
1. 添加 `ENCRYPTION_KEY` 环境变量
2. 创建数据库迁移脚本加密现有密钥
3. 更新 `getUserAIConfig` 函数解密密钥

---

## 🟡 重要问题（建议尽快处理）

### 4. 缺少 API 速率限制
**问题**：AI 相关 API（OCR、分析、总结）没有速率限制

**风险**：
- 用户可能滥用 AI 功能
- AI 服务费用失控
- 恶意攻击导致服务不可用

**优化方案**：
```typescript
// src/lib/rate-limit.ts
import { prisma } from './prisma';

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  
  const count = await prisma.rateLimitLog.count({
    where: {
      userId,
      action,
      createdAt: { gte: windowStart },
    },
  });
  
  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  await prisma.rateLimitLog.create({
    data: { userId, action },
  });
  
  return { allowed: true, remaining: limit - count - 1 };
}
```

**建议限制**：
- OCR 识别：每小时 20 次
- AI 分析：每小时 30 次
- AI 总结：每小时 10 次

---

### 5. 数据库查询未优化
**问题**：多处 N+1 查询问题，缺少分页优化

**示例问题**：
```typescript
// src/app/api/errors/route.ts:54-62
// 每次查询都会执行两次数据库操作
const [items, total] = await Promise.all([
  prisma.error.findMany({ ... }),
  prisma.error.count({ where }),
]);
```

**优化方案**：
1. 使用 Prisma 的 `include` 预加载关联数据
2. 添加数据库索引（已有部分索引，但可以优化）
3. 对大数据量查询使用游标分页

```typescript
// 优化后的查询
const errors = await prisma.error.findMany({
  where,
  include: {
    knowledgePoint: {
      select: { id: true, name: true, subject: true }
    },
    reviews: {
      select: { quality: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1, // 只取最近一次复习记录
    },
  },
  orderBy: { [sort]: order === 'asc' ? 'asc' : 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

---

### 6. 图片上传缺少验证和优化
**问题**：
- 没有文件大小限制
- 没有文件类型验证
- 没有图片压缩
- 上传路径可能存在安全问题

**优化方案**：
```typescript
// src/lib/upload.ts
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function processUploadedImage(file: File): Promise<string> {
  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过 10MB');
  }
  
  // 验证文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('只支持 JPG、PNG、WebP 格式');
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 压缩图片
  const compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  
  // 生成安全的文件名
  const filename = `${randomUUID()}.jpg`;
  const uploadDir = process.env.UPLOAD_DIR || 'public/uploads';
  const filepath = path.join(uploadDir, filename);
  
  await fs.writeFile(filepath, compressed);
  
  return `/uploads/${filename}`;
}
```

**需要添加的依赖**：
```bash
npm install sharp
```

---

### 7. 错误处理不完善
**问题**：多处 catch 块只返回通用错误信息，不利于调试

**示例**：
```typescript
// src/app/api/errors/route.ts:125-127
} catch {
  return NextResponse.json({ error: "创建失败" }, { status: 500 });
}
```

**优化方案**：
```typescript
// src/lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: '输入验证失败', details: error.flatten() },
      { status: 400 }
    );
  }
  
  // 生产环境隐藏详细错误
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : error instanceof Error ? error.message : '未知错误';
  
  return NextResponse.json({ error: message }, { status: 500 });
}
```

---

## 🟢 改进建议（可逐步优化）

### 8. TypeScript 类型安全
**问题**：21 个文件使用 `any` 类型，降低了类型安全性

**优化方案**：
1. 启用更严格的 TypeScript 配置
2. 逐步替换 `any` 为具体类型
3. 使用 `unknown` 替代 `any`（需要类型守卫）

```json
// tsconfig.json 增强配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

---

### 9. 依赖更新
**问题**：多个依赖包有可用更新

**建议更新**：
```bash
# 安全更新（小版本）
npm update @base-ui/react date-fns lucide-react shadcn

# 需要测试的更新（大版本）
# TypeScript 5 -> 6：需要检查兼容性
# ESLint 9 -> 10：需要检查配置变更
```

**注意**：
- `@auth/core` 显示 Latest 0.34.3 < Current 0.41.2，这是正常的（beta 版本）
- `next-auth` 使用 beta 版本，需要关注稳定性

---

### 10. 性能优化
**建议**：

#### 10.1 添加缓存策略
```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedKnowledgePoints = unstable_cache(
  async (subject: string) => {
    return await prisma.knowledgePoint.findMany({
      where: { subject },
      orderBy: { sortOrder: 'asc' },
    });
  },
  ['knowledge-points'],
  { revalidate: 3600, tags: ['knowledge-points'] }
);
```

#### 10.2 图片优化
```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src={questionImage}
  alt="题目图片"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

#### 10.3 代码分割
```typescript
// 动态导入大型组件
const ChartComponent = dynamic(() => import('@/components/charts/ErrorChart'), {
  loading: () => <div>加载中...</div>,
  ssr: false,
});
```

---

### 11. 数据库优化

#### 11.1 添加复合索引
```prisma
// prisma/schema.prisma
model Error {
  // ...
  
  @@index([userId, subject, masteryLevel]) // 复合查询优化
  @@index([userId, knowledgePointId, masteryLevel]) // 知识点筛选优化
  @@index([userId, nextReviewDate, masteryLevel]) // 复习列表优化
}
```

#### 11.2 考虑迁移到 PostgreSQL
**理由**：
- SQLite 不支持并发写入
- 多用户场景下可能出现锁竞争
- PostgreSQL 提供更好的全文搜索、JSON 查询等功能

**迁移成本**：中等（Prisma 支持多数据库，主要是部署配置变更）

---

### 12. 监控和日志

#### 12.1 添加结构化日志
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

// 使用示例
logger.info({ userId, action: 'create_error' }, '用户创建错题');
logger.error({ error, userId }, 'AI 调用失败');
```

#### 12.2 添加性能监控
```typescript
// src/lib/metrics.ts
export async function trackApiPerformance(
  endpoint: string,
  fn: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  try {
    const response = await fn();
    const duration = Date.now() - start;
    
    logger.info({
      endpoint,
      duration,
      status: response.status,
    }, 'API 请求完成');
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error({ endpoint, duration, error }, 'API 请求失败');
    throw error;
  }
}
```

---

### 13. Docker 优化

#### 13.1 多阶段构建优化
```dockerfile
# 当前 Dockerfile 已经使用多阶段构建，但可以进一步优化

# 添加依赖缓存层
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# 使用 distroless 镜像减小体积
FROM gcr.io/distroless/nodejs22-debian12 AS runner
COPY --from=builder /app /app
WORKDIR /app
CMD ["server.js"]
```

#### 13.2 docker-compose.yml 优化
```yaml
services:
  errbook:
    # 添加健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # 添加资源限制
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    
    # 添加日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

### 14. 中间件迁移
**问题**：README 提到 middleware 文件约定 deprecated

**优化方案**：
根据 Next.js 16 的新约定，将 `src/middleware.ts` 迁移到新的 proxy 模式（具体需要查阅 Next.js 16 文档）

---

### 15. 环境变量管理
**问题**：`next.config.ts` 中硬编码环境变量

**优化方案**：
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  // 移除 env 配置，使用 Next.js 内置的环境变量支持
  // AUTH_SECRET 应该通过 NEXT_PUBLIC_ 前缀或服务端访问
};
```

创建 `.env.example`：
```env
# 数据库
DATABASE_URL=file:./dev.db

# 认证
AUTH_SECRET=your-secret-here
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# 管理员
ADMIN_EMAIL=admin@example.com

# 上传
UPLOAD_DIR=public/uploads

# 加密（新增）
ENCRYPTION_KEY=your-32-byte-hex-key-here

# 日志（新增）
LOG_LEVEL=info
```

---

## 📈 优化优先级建议

### 立即处理（本周内）
1. ✅ 修复构建产物过大问题（影响部署）
2. ✅ 添加 API 速率限制（防止滥用）
3. ✅ 加密存储 API 密钥（安全风险）

### 短期优化（2-4周）
4. ✅ 添加核心功能测试（质量保障）
5. ✅ 优化图片上传和处理（用户体验）
6. ✅ 改进错误处理和日志（可维护性）
7. ✅ 数据库查询优化（性能）

### 中期改进（1-2月）
8. ✅ 提升 TypeScript 类型安全
9. ✅ 添加性能监控和缓存
10. ✅ Docker 配置优化
11. ✅ 依赖更新和迁移

### 长期规划（3月+）
12. ✅ 考虑迁移到 PostgreSQL
13. ✅ 添加 CI/CD 流程
14. ✅ 性能压测和优化
15. ✅ 国际化支持（如需要）

---

## 🎯 预期收益

实施以上优化后，预期可以获得：

- **构建速度**：提升 50-70%（构建产物从 2.2GB 降至 200MB 以内）
- **部署速度**：提升 60-80%（Docker 镜像体积大幅减小）
- **运行性能**：提升 30-50%（缓存、查询优化、图片优化）
- **安全性**：显著提升（API 密钥加密、速率限制、输入验证）
- **可维护性**：显著提升（测试覆盖、错误处理、日志监控）
- **用户体验**：提升 20-30%（图片加载、响应速度）

---

## 📝 总结

该项目整体架构合理，技术选型现代化，但在以下方面需要重点改进：

1. **构建配置**：需要优化以减小产物体积
2. **测试覆盖**：完全缺失，需要尽快补充
3. **安全性**：API 密钥存储、速率限制需要加强
4. **性能优化**：数据库查询、图片处理、缓存策略需要优化
5. **可维护性**：错误处理、日志、监控需要完善

建议按照优先级逐步实施优化，优先处理影响安全和部署的问题，然后逐步提升代码质量和性能。
