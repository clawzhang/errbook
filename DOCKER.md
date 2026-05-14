# Docker 部署说明

## 1. 准备环境变量

复制示例文件：

```bash
cp .env.docker.example .env.docker
```

修改 `.env.docker`：

- `APP_PORT`：宿主机暴露端口，默认 `3000`
- `AUTH_SECRET`：生产环境必须改成足够长的随机字符串
- `AUTH_URL` / `NEXTAUTH_URL`：改成实际访问地址，例如 `https://errbook.example.com`

## 2. 构建镜像

```bash
./scripts/docker-build.sh
```

也可以指定镜像名：

```bash
IMAGE_NAME=registry.example.com/errbook:1.0.0 ./scripts/docker-build.sh
```

## 3. Compose 部署

```bash
./scripts/docker-deploy.sh
```

脚本会执行：

```bash
docker compose up -d --build
```

容器启动时会自动执行：

```bash
npx prisma migrate deploy
```

用于创建或升级 SQLite 数据库结构。

## 弱服务器免构建部署

如果服务器内存或 CPU 较弱，`docker compose build` 执行到
`RUN npm run build` 时可能会卡死、断开 SSH，甚至被系统 OOM 杀掉。
这种情况推荐在本机或 CI 构建镜像，再把镜像包上传服务器运行。

### 1. 本机生成镜像包

```bash
./scripts/docker-export-image.sh
```

默认生成：

```text
errbook-image.tar.gz
```

也可以指定镜像名和输出文件：

```bash
IMAGE_NAME=errbook:1.0.0 OUTPUT_FILE=errbook-1.0.0.tar.gz ./scripts/docker-export-image.sh
```

如果使用自定义镜像名，服务器 `.env.docker` 中也要设置：

```env
ERRBOOK_IMAGE=errbook:1.0.0
```

### 2. 上传服务器

把项目 zip 包和镜像包上传到服务器。解压项目后，将镜像包放在项目根目录。

### 3. 服务器加载镜像并启动

```bash
./scripts/docker-load-and-run.sh errbook-image.tar.gz
```

这个脚本只会执行：

- `docker load`
- `docker compose -f docker-compose.image.yml up -d`

不会在服务器执行 `npm run build`。

## 4. 常用运维命令

查看状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f errbook
```

停止服务：

```bash
docker compose down
```

重新部署：

```bash
docker compose up -d --build
```

免构建部署重新启动：

```bash
docker compose -f docker-compose.image.yml up -d
```

## 5. 数据持久化

Compose 使用两个 Docker volume：

- `errbook-data`：保存 SQLite 数据库，容器内路径 `/app/data`
- `errbook-uploads`：保存上传题图，容器内路径 `/app/public/uploads`

默认数据库地址：

```env
DATABASE_URL=file:/app/data/dev.db
```

默认上传目录：

```env
UPLOAD_DIR=/app/public/uploads
```
