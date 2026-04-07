# 开发流程说明

## 环境要求

- Docker Desktop
- Windows 10/11
- 已运行的 CockroachDB 容器 (`dev_cockroach`)
- 已运行的 Redis 容器 (`dev_redis`)

## 快速开始

### 1. 首次部署

```bash
cd d:\geme\server\docker
setup.bat
```

该脚本会：

1. 创建 Docker 网络 `warforge-network`
2. 连接数据库和 Redis 容器到网络
3. 执行 Nakama 数据库迁移
4. 构建开发镜像 `warforge-server`
5. 启动开发容器

### 2. 启动前端项目

```bash
# 管理后台（端口 8203）
cd d:\geme\admin-web
pnpm install
pnpm dev

# 代理管理后台（端口 8207）
cd d:\geme\proxy-web
pnpm install
pnpm dev
```

## 开发流程

### 修改代码后重新编译

```bash
cd d:\geme\server\docker
rebuild.bat
```

该脚本会：

1. 在容器内编译 Gin 二进制
2. 在容器内编译 Nakama 插件 (.so)
3. 重启 Gin 服务
4. 重启 Nakama 服务

**无需重建镜像，无需删除容器！**

### 手动编译命令

```bash
# 编译 Gin
docker exec warforge-server go build -trimpath -o /app/webadmin ./cmd/webadmin/main.go

# 编译 Nakama 插件
docker exec warforge-server go build -buildmode=plugin -trimpath -o /nakama/data/modules/warforge.so ./cmd/nakama/main.go

# 重启服务
docker exec warforge-server supervisorctl restart gin
docker exec warforge-server supervisorctl restart nakama
```

## 服务端口说明

| 服务 | 端口 | 说明 | 访问地址 |
|------|------|------|----------|
| Gin (WebAdmin) | 8200 | 管理后台 API | <http://localhost:8200> |
| admin-web | 8203 | 游戏管理后台 | <http://localhost:8203> |
| proxy-web | 8207 | 代理管理后台 | <http://localhost:8207> |
| Nakama HTTP | 7350 | 游戏服务器 API | <http://localhost:7350> |
| Nakama gRPC | 7349 | 游戏服务器 gRPC | localhost:7349 |
| Nakama Console | 7351 | Nakama 管理控制台 | <http://localhost:7351> |
| CockroachDB | 26257 | 数据库端口 | - |
| CockroachDB Web UI | 8080 | 数据库管理界面 | <http://localhost:8080> |
| Redis | 6379 | 缓存服务 | - |

## 开发环境架构

```
┌─────────────────────────────────────────────────────────────┐
│                    warforge-server 容器                      │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │   Supervisor    │     │        Go 1.26.1            │   │
│  │   (进程管理)     │     │     (编译环境)               │   │
│  └────────┬────────┘     └─────────────────────────────┘   │
│           │                                                  │
│     ┌─────┴─────┐                                           │
│     │           │                                           │
│  ┌──▼───┐   ┌───▼────┐                                      │
│  │ Gin  │   │ Nakama │                                      │
│  │:8200 │   │:7350   │                                      │
│  └──────┘   └────────┘                                      │
│                                                             │
│  源码挂载: d:\geme\server → /app                            │
└─────────────────────────────────────────────────────────────┘
         │              │
         ▼              ▼
   ┌──────────┐   ┌──────────┐
   │dev_redis │   │dev_cockroach│
   │  :6379   │   │   :26257   │
   └──────────┘   └──────────┘
```

## Docker 文件说明

```
server/docker/
├── bin/
│   └── nakama          # Nakama 二进制文件（从官方镜像提取）
├── Dockerfile          # 开发环境镜像定义
├── entrypoint.sh       # 容器启动脚本（编译 + 启动服务）
├── supervisord.conf    # 进程管理配置
├── setup.bat           # 首次部署脚本
└── rebuild.bat         # 重新编译脚本
```

## 常见问题

### Q: 插件更新后前端没反应？

A: 确保：

1. 编译成功（无错误输出）
2. 服务已重启
3. 刷新浏览器页面

### Q: 编译失败怎么办？

A: 检查：

1. 容器是否正常运行：`docker ps`
2. 查看编译日志：`docker logs warforge-server`
3. 进入容器调试：`docker exec -it warforge-server bash`

### Q: 如何查看服务日志？

```bash
# 查看所有日志
docker logs -f warforge-server

# 查看 Gin 日志
docker exec warforge-server cat /var/log/gin.log
docker exec warforge-server cat /var/log/gin.err

# 查看 Nakama 日志
docker exec warforge-server cat /var/log/nakama.log
docker exec warforge-server cat /var/log/nakama.err
```

### Q: 如何进入 Nakama 控制台？

在浏览器中访问：<http://localhost:7351>

登录凭据：

- 用户名：admin
- 密码：admin123

### Q: 如何管理数据库？

CockroachDB 提供了 Web UI，访问：<http://localhost:8080>

数据库名称：`nakama`

### Q: 如何执行数据库迁移？

```bash
# Gin 迁移（自动执行，启动时检查）
# 如需手动执行，重启 Gin 服务即可

# Nakama 迁移
docker exec warforge-server /nakama/nakama migrate up --database.address "root@dev_cockroach:26257/nakama"
```

## 项目结构

```
d:\geme\
├── admin-web\              # 游戏管理后台（端口 8203）
│   ├── src\
│   │   ├── service\        # API 服务
│   │   ├── store\          # Pinia 状态管理
│   │   ├── router\         # 路由配置
│   │   └── views\          # 页面组件
│   ├── package.json
│   └── vite.config.ts
├── proxy-web\              # 代理管理后台（端口 8207）
│   ├── src\
│   ├── package.json
│   └── vite.config.ts
├── server\                 # 后端服务
│   ├── cmd\
│   │   ├── nakama\         # Nakama 插件入口
│   │   └── webadmin\       # Gin 服务入口
│   ├── internal\           # 内部模块（DDD 分层）
│   │   ├── domain\         # 领域层
│   │   ├── application\    # 应用层
│   │   ├── infrastructure\ # 基础设施层
│   │   └── interfaces\     # 接口层
│   ├── migrations\         # 数据库迁移
│   ├── docker\             # Docker 配置
│   ├── config\             # 配置文件
│   ├── go.mod
│   └── go.sum
├── docs\                   # 文档目录
│   ├── server\             # 服务端文档
│   ├── admin-web\          # 管理后台文档
│   └── old_client\         # 老客户端文档
└── old-code\               # 老系统代码参考
```

## 开发建议

### 1. 阅读文档

开始开发前，请先阅读以下文档：

- [docs/RED_LINES.md](./docs/RED_LINES.md) - 项目红线（必须遵守）
- [.trae/rules/project_rules.md](./.trae/rules/project_rules.md) - 项目架构规则

### 2. 开发顺序

按照渐进式开发策略：

```
管理后台 → API翻译层 → 非游戏功能测试 → 游戏逻辑迁移 → 客户端重构
```

### 3. 代码规范

- 遵循 Go 代码规范
- 提交代码前运行 `go fmt` 和 `go vet`
- 保持代码清晰易读

## 文档资源

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目文档索引 |
| [docs/RED_LINES.md](./docs/RED_LINES.md) | 项目红线 |
| [docs/server/04_ARCHITECTURE.md](./docs/server/04_ARCHITECTURE.md) | 架构设计 |
| [docs/server/07_PROTOCOL_MAPPING.md](./docs/server/07_PROTOCOL_MAPPING.md) | 协议映射 |
