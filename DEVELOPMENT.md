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

### Q: 如何进入 Nakama 控制台？

在浏览器中访问：`http://localhost:7351`

### Q: 如何管理数据库？

CockroachDB 提供了 Web UI，访问：`http://localhost:8080`

**数据库名称：** `nakama`

## 项目结构

```
d:\geme\
├── admin-web\              # 游戏管理后台（端口 9527）
│   ├── src\
│   │   ├── service\        # API 服务
│   │   ├── store\          # Pinia 状态管理
│   │   ├── router\         # 路由配置
│   │   └── views\          # 页面组件
│   ├── package.json
│   └── vite.config.ts
├── proxy-web\              # 代理管理后台（端口 9528）
│   ├── src\
│   ├── package.json
│   └── vite.config.ts
├── server\                 # Nakama 服务器
│   ├── cmd\
│   │   └── main.go         # 插件入口
│   ├── modules\            # 业务模块
│   │   ├── admin\          # 管理后台模块（认证、RBAC）
│   │   ├── rpc\            # 游戏 RPC 模块
│   │   ├── match\          # 匹配模块
│   │   ├── hooks\          # 钩子模块
│   │   ├── bot\            # 机器人模块（AI 逻辑）
│   │   └── hiro\           # Hiro 模块
│   ├── adapter\            # 协议翻译层
│   │   └── adapter.go      # 适配器入口
│   ├── config\             # 配置文件
│   ├── migrations\         # 数据库迁移
│   ├── tools\              # 工具脚本
│   ├── go.mod
│   ├── go.sum
│   ├── docker-compose.yml
│   └── build-and-deploy.bat
├── docs\                   # 文档目录
│   ├── server\             # 服务端文档
│   ├── admin-web\          # 管理后台文档
│   └── old_client\         # 老客户端文档
└── old-code\               # 老系统代码参考
    ├── servers\            # 老服务端代码
    ├── web-admin\          # 老管理后台
    ├── web-game-h5\       # 老游戏 H5 客户端
    └── web-proxy\          # 老代理后台
```

## 服务端口说明

| 服务 | 端口 | 说明 | 访问地址 |
|------|------|------|----------|
| admin-web | 9527 | 游戏管理后台 | <http://localhost:9527> |
| proxy-web | 9528 | 代理管理后台 | <http://localhost:9528> |
| Nakama API | 7350 | 游戏服务器 API | <http://localhost:7350> |
| Nakama Console | 7351 | Nakama 管理控制台 | <http://localhost:7351> |
| CockroachDB | 26257 | 数据库端口 | - |
| CockroachDB Web UI | 8080 | 数据库管理界面 | <http://localhost:8080> |
| Redis | 6379 | 缓存服务 | - |

## 开发建议

### 1. 阅读文档

开始开发前，请先阅读以下文档：

- [docs/RED_LINES.md](./docs/RED_LINES.md) - 项目红线（必须遵守）
- [task_plan.md](./task_plan.md) - 开发任务计划
- [docs/server/00_OVERVIEW.md](./docs/server/00_OVERVIEW.md) - 服务端概述
- [docs/server/01_ADMIN_MODULE.md](./docs/server/01_ADMIN_MODULE.md) - 管理后台模块

### 2. 开发顺序

按照渐进式开发策略：

```
管理后台 → API翻译层 → 非游戏功能测试 → 游戏逻辑迁移 → 客户端重构
```

### 3. 代码规范

- 遵循 Go 代码规范
- 提交代码前运行 `go fmt` 和 `go vet`
- 保持代码清晰易读

### 4. 文档更新

- 完成任务后更新 `task_plan.md`
- 发现新信息记录到 `findings.md`
- 每次会话记录到 `progress.md`

## 测试建议

### 1. 单元测试

为核心业务逻辑编写单元测试。

### 2. 集成测试

测试 API 接口和 WebSocket 消息。

### 3. 手动测试清单

参考 `task_plan.md` 中的测试清单，确保功能正常。

## 部署说明

### 生产环境部署

1. 配置环境变量
2. 构建 Docker 镜像
3. 部署到 Kubernetes 或其他容器编排平台
4. 配置负载均衡和 HTTPS
5. 进行性能测试和安全测试

### 监控和日志

- 使用 Prometheus 和 Grafana 监控
- 使用 ELK Stack 收集和分析日志
- 设置告警通知机制

## 文档资源

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目文档索引 |
| [task_plan.md](./task_plan.md) | 开发任务计划 |
| [findings.md](./findings.md) | 研究发现 |
| [progress.md](./progress.md) | 开发进度日志 |
| [docs/RED_LINES.md](./docs/RED_LINES.md) | 项目红线 |
| [docs/server/04_ARCHITECTURE.md](./docs/server/04_ARCHITECTURE.md) | 架构设计 |
| [docs/server/07_PROTOCOL_MAPPING.md](./docs/server/07_PROTOCOL_MAPPING.md) | 协议映射 |

## 获取帮助

如果遇到问题，请：

1. 查阅相关文档
2. 查看 Nakama 官方文档
3. 检查日志和错误信息
4. 搜索已有的问题和解决方案
5. 提交新的 issue 或询问团队成员
