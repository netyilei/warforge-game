# 项目文档索引

> 所有开发必须先阅读本文档，了解文档结构。

---

## 核心文档（必读）

| 文档 | 说明 | 优先级 |
|------|------|--------|
| [docs/RED_LINES.md](./docs/RED_LINES.md) | **项目红线文档** | ⭐⭐⭐⭐ |
| [task_plan.md](./task_plan.md) | 开发任务计划 | ⭐⭐⭐ |
| [findings.md](./findings.md) | 研究发现 | ⭐⭐⭐ |
| [progress.md](./progress.md) | 开发进度日志 | ⭐⭐⭐ |

---

## 子项目文档

### 服务端文档 ([docs/server/](./docs/server/00_OVERVIEW.md))

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./docs/server/00_OVERVIEW.md) | 服务端概述 |
| [01_ADMIN_MODULE.md](./docs/server/01_ADMIN_MODULE.md) | 管理后台模块（认证、RBAC） |
| [02_BOT_MODULE.md](./docs/server/02_BOT_MODULE.md) | 机器人模块（AI 逻辑） |
| [03_MATCH_MODULE.md](./docs/server/03_MATCH_MODULE.md) | 匹配模块（游戏匹配） |
| [04_ARCHITECTURE.md](./docs/server/04_ARCHITECTURE.md) | 架构设计（技术栈、目录结构） |
| [05_DATABASE_DESIGN.md](./docs/server/05_DATABASE_DESIGN.md) | 数据库设计（表结构、Redis Key） |
| [06_TEST_ENVIRONMENT.md](./docs/server/06_TEST_ENVIRONMENT.md) | 测试环境配置（Docker、验证） |
| [07_PROTOCOL_MAPPING.md](./docs/server/07_PROTOCOL_MAPPING.md) | 协议映射（老客户端兼容） |
| [08_NAKAMA_API_REFERENCE.md](./docs/server/08_NAKAMA_API_REFERENCE.md) | Nakama API 参考（Runtime 接口） |

### 管理后台文档 ([docs/admin-web/](./docs/admin-web/00_OVERVIEW.md))

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./docs/admin-web/00_OVERVIEW.md) | 管理后台概述 |
| [01_AUTH_MODULE.md](./docs/admin-web/01_AUTH_MODULE.md) | 认证模块（登录、Token、权限验证） |
| [02_API_LAYER.md](./docs/admin-web/02_API_LAYER.md) | API 层设计（Nakama RPC、WebSocket） |
| [03_RBAC_SYSTEM.md](./docs/admin-web/03_RBAC_SYSTEM.md) | RBAC 权限系统（角色、权限管理） |
| [04_TECH_STACK.md](./docs/admin-web/04_TECH_STACK.md) | 技术选型详情（版本、选型理由） |

### 老客户端文档 ([docs/old_client/](./docs/old_client/00_OVERVIEW.md))

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./docs/old_client/00_OVERVIEW.md) | 老客户端概述 |
| [01_OLD_CODE_INDEX.md](./docs/old_client/01_OLD_CODE_INDEX.md) | 老代码索引（代码结构、迁移要点） |
| [api/](./docs/old_client/api/00_index.md) | HTTP API 协议分析 |
| [ws/](./docs/old_client/ws/00_index.md) | WebSocket 协议分析 |

---

## 开发流程

```
0. 阅读 docs/RED_LINES.md 了解项目红线（必须遵守）
1. 阅读 task_plan.md 了解当前任务
2. 阅读 docs/server/04_ARCHITECTURE.md 了解架构
3. 阅读 docs/server/07_PROTOCOL_MAPPING.md 了解协议映射
4. 按任务开发，完成后更新 task_plan.md 和 progress.md
```

---

## 项目目录结构

```
geme/
├── server/                 # 服务端（Nakama Go Runtime）
│   ├── cmd/
│   ├── modules/            # 功能模块
│   ├── adapter/            # 协议翻译层
│   ├── storage/            # Storage Schema
│   └── docker/
├── admin-web/              # 管理后台（Vue 3 + NaiveUI）
│   ├── src/
│   ├── packages/
│   └── build/
└── docs/                   # 文档
    ├── server/             # 服务端文档
    ├── admin-web/          # 管理后台文档
    └── old_client/         # 老客户端文档
```

---

## 关键约定

1. **红线文档**: 开发前必须阅读并遵守 [docs/RED_LINES.md](./docs/RED_LINES.md)
2. **目录结构**: 严格遵循架构文档定义的目录结构
3. **协议映射**: 所有协议必须遵循 docs/server/07_PROTOCOL_MAPPING.md
4. **OpCode 分配**: 德州扑克使用 100-149/200-249
5. **任务追踪**: 每完成一个任务必须更新 task_plan.md 和 progress.md
6. **文档同步**: 任务完成、新需求、新方案确认时必须先更新相关文档
