# 开发流程说明

## 快速开始

### 1. 启动前端项目

```bash
# 管理后台（端口 9527）
cd d:\geme\admin-web
pnpm install
pnpm dev

# 代理管理后台（端口 9528）
cd d:\geme\proxy-web
pnpm install
pnpm dev
```

### 2. 启动后端服务

```bash
cd d:\geme\server
docker-compose up -d
```

## Go 插件开发流程

### 修改代码后重新编译部署

```bash
cd d:\geme\server
.\build-and-deploy.bat
```

**完整流程：**
1. 修改 Go 代码
2. 运行 `build-and-deploy.bat`
3. 等待编译完成（约 10-15 秒）
4. 刷新浏览器测试

### build-and-deploy.bat 脚本说明

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1 | 更新依赖 | `go mod tidy` | 确保依赖最新 |
| 2 | 编译插件 | `go build -buildmode=plugin` | 生成 .so 文件 |
| 3 | 复制到容器 | `docker cp` | 部署到 Nakama 容器 |
| 4 | 重启容器 | `docker restart` | 加载新插件 |

### 手动编译部署

```bash
# 1. 编译
docker run --rm -v "${PWD}:/app" -w /app heroiclabs/nakama-pluginbuilder:latest build -buildmode=plugin -trimpath -o warforge.so ./cmd/main.go

# 2. 复制
docker cp warforge.so warforge-nakama:/nakama/data/modules/warforge.so

# 3. 重启
docker restart warforge-nakama
```

## 常见问题

### Q: 插件更新后前端没反应？

A: 确保：
1. 插件已成功编译（warforge.so 文件存在）
2. 已复制到容器并重启
3. 刷新浏览器页面

### Q: 编译失败怎么办？

A: 检查：
1. `go.mod` 中的 Go 版本是 `1.26.1`
2. 运行 `go mod tidy` 更新依赖
3. 检查代码语法错误

### Q: 如何查看 Nakama 日志？

```bash
docker logs -f warforge-nakama
```

## 项目结构

```
d:\geme\
├── admin-web\          # 游戏管理后台（端口 9527）
│   ├── src\
│   ├── package.json
│   └── vite.config.ts
├── proxy-web\          # 代理管理后台（端口 9528）
│   ├── src\
│   ├── package.json
│   └── vite.config.ts
└── server\             # Nakama 服务器
    ├── cmd\
    │   └── main.go     # 插件入口
    ├── modules\        # 业务模块
    │   ├── admin\      # 管理后台模块
    │   ├── rpc\        # 游戏 RPC 模块
    │   ├── match\      # 匹配模块
    │   ├── hooks\      # 钩子模块
    │   ├── bot\        # 机器人模块
    │   └── adapter\    # 适配器模块
    ├── migrations\     # 数据库迁移
    ├── go.mod
    ├── go.sum
    ├── docker-compose.yml
    └── build-and-deploy.bat
```

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| admin-web | 9527 | 游戏管理后台 |
| proxy-web | 9528 | 代理管理后台 |
| Nakama | 7350 | 游戏服务器 |
| Nakama Console | 7351 | Nakama 管理控制台 |
| CockroachDB | 26257 | 数据库 |
| Redis | 6379 | 缓存 |
