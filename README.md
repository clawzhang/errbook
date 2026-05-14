# 错题记录

一个基于 Next.js 的错题本系统，用于录入错题、拍照识别、AI 分析、知识点归类、复习调度、测试组卷和学习统计。

## 功能概览

- 错题录入：支持手动录入和图片上传。
- AI 识别：可从题图中识别题目、学科、知识点和解析草稿。
- AI 分析：对错题生成错误原因、知识点梳理、解题思路和学习建议。
- 知识点管理：录入时可新增、编辑知识点；按知识点查看关联错题。
- 复习计划：基于掌握度和复习间隔安排待复习题目。
- 测试组卷：从错题中生成测试，并支持打印或保存 PDF。
- 统计分析：查看学科分布、掌握度分布、薄弱知识点和复习趋势。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- SQLite
- NextAuth
- Tailwind CSS 4
- shadcn/ui

## 本地开发

安装依赖：

```bash
npm install
```

准备环境变量：

```bash
cp .env.example .env
```

如果项目没有 `.env.example`，至少需要在 `.env` 中配置：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

执行数据库迁移：

```bash
npx prisma migrate deploy
```

启动开发服务：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

## 常用命令

```bash
# 开发
npm run dev

# 静态检查
npm run lint

# 生产构建
npm run build

# 启动生产服务
npm run start
```

## AI 配置

登录系统后进入：

```text
设置 -> AI 配置
```

需要填写兼容 OpenAI 接口的：

- Base URL
- API Key
- 模型名称

配置后可使用：

- 拍照识别题目
- AI 错题分析
- AI 错题总结

## Docker 部署

项目已内置 Docker 构建和 Docker Compose 部署配置。

### 1. 准备环境变量

```bash
cp .env.docker.example .env.docker
```

修改 `.env.docker`：

```env
APP_PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

生产环境请将 `AUTH_URL` 和 `NEXTAUTH_URL` 改成实际域名。

### 2. 构建镜像

```bash
./scripts/docker-build.sh
```

也可以指定镜像名：

```bash
IMAGE_NAME=registry.example.com/errbook:1.0.0 ./scripts/docker-build.sh
```

### 3. 启动服务

```bash
./scripts/docker-deploy.sh
```

脚本会执行：

```bash
docker compose up -d --build
```

容器启动时会自动执行数据库迁移：

```bash
npx prisma migrate deploy
```

### 4. 查看状态和日志

```bash
docker compose ps
docker compose logs -f errbook
```

### 5. 停止服务

```bash
docker compose down
```

## 弱服务器部署建议

如果服务器性能较弱，`docker compose build` 可能会在 `RUN npm run build`
阶段占满内存或 CPU，导致 SSH 断开。推荐改用“本机构建镜像，服务器只加载运行”的方式。

在本机或性能较好的机器生成镜像包：

```bash
./scripts/docker-export-image.sh
```

默认生成：

```text
errbook-image.tar.gz
```

将项目 zip 包和 `errbook-image.tar.gz` 上传服务器。服务器解压项目后，把镜像包放到项目根目录，然后执行：

```bash
./scripts/docker-load-and-run.sh errbook-image.tar.gz
```

该方式使用 [docker-compose.image.yml](./docker-compose.image.yml)，不会在服务器执行 `npm run build`。

## Docker 数据持久化

`docker-compose.yml` 使用两个 Docker volume：

- `errbook-data`：保存 SQLite 数据库，容器内路径 `/app/data`
- `errbook-uploads`：保存上传题图，容器内路径 `/app/public/uploads`

容器内默认环境变量：

```env
DATABASE_URL=file:/app/data/dev.db
UPLOAD_DIR=/app/public/uploads
```

## 项目结构

```text
src/app                 Next.js App Router 页面和 API
src/components          页面组件和通用 UI
src/lib                 认证、AI、Prisma、复习算法等基础逻辑
prisma                  Prisma schema 和迁移文件
public/uploads          本地开发环境上传图片目录
scripts                 Docker 构建和部署脚本
```

## 部署文件

- `Dockerfile`：生产镜像构建文件
- `docker-compose.yml`：Compose 部署配置
- `docker-compose.image.yml`：使用预构建镜像部署，不在服务器构建
- `.dockerignore`：Docker 构建忽略规则
- `.env.docker.example`：Docker 环境变量模板
- `DOCKER.md`：Docker 部署说明
- `scripts/docker-build.sh`：镜像构建脚本
- `scripts/docker-deploy.sh`：Compose 部署脚本
- `scripts/docker-export-image.sh`：本机构建并导出镜像包
- `scripts/docker-load-and-run.sh`：服务器加载镜像包并启动
- `scripts/docker-entrypoint.sh`：容器启动脚本

## 质量检查

提交或部署前建议执行：

```bash
npm run lint
npm run build
```

当前构建可能会出现 Next.js 关于 `middleware` 文件约定 deprecated 的提示。该提示不影响构建结果，后续可按 Next.js 新约定迁移到 `proxy`。
