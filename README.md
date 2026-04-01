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
| [docs/02_ARCHITECTURE.md](./docs/02_ARCHITECTURE.md) | 架构设计（Nakama） | ⭐⭐⭐ |
| [docs/06_PROTOCOL_MAPPING.md](./docs/06_PROTOCOL_MAPPING.md) | 协议映射表 | ⭐⭐⭐ |

---

## 设计文档

| 文档 | 说明 |
|------|------|
| [docs/00_OVERVIEW.md](./docs/00_OVERVIEW.md) | 项目概述 |
| [docs/01_TECH_STACK.md](./docs/01_TECH_STACK.md) | 技术选型 |
| [docs/03_DATA_MIGRATION.md](./docs/03_DATA_MIGRATION.md) | 数据迁移方案 |
| [docs/08_DATABASE_DESIGN.md](./docs/08_DATABASE_DESIGN.md) | 数据库设计 |
| [docs/OLD_CODE_INDEX.md](./docs/OLD_CODE_INDEX.md) | 旧代码索引（AI 参考） |

---

## 协议文档

### API 协议

| 文档 | 说明 |
|------|------|
| [docs/api/00_index.md](./docs/api/00_index.md) | API 索引 |
| [docs/api/01_login.md](./docs/api/01_login.md) | 登录模块 |
| [docs/api/02_lobby.md](./docs/api/02_lobby.md) | 大厅模块 |
| [docs/api/03_match.md](./docs/api/03_match.md) | 比赛模块 |
| [docs/api/04_upload.md](./docs/api/04_upload.md) | 上传模块 |
| [docs/api/05_user.md](./docs/api/05_user.md) | 用户模块 |
| [docs/api/06_charge.md](./docs/api/06_charge.md) | 充值模块 |
| [docs/api/07_game.md](./docs/api/07_game.md) | 游戏模块 |
| [docs/api/08_customer.md](./docs/api/08_customer.md) | 客服模块 |
| [docs/api/09_reward.md](./docs/api/09_reward.md) | 奖励模块 |

### WebSocket 协议

| 文档 | 说明 |
|------|------|
| [docs/ws/00_index.md](./docs/ws/00_index.md) | WS 索引 |
| [docs/ws/01_connection.md](./docs/ws/01_connection.md) | 连接模块 |
| [docs/ws/02_lobby.md](./docs/ws/02_lobby.md) | 大厅模块 |
| [docs/ws/03_texas.md](./docs/ws/03_texas.md) | 德州扑克 |
| [docs/ws/04_match.md](./docs/ws/04_match.md) | 比赛模块 |
| [docs/ws/05_user.md](./docs/ws/05_user.md) | 用户模块 |

---

## 开发流程

```
0. 阅读 docs/RED_LINES.md 了解项目红线（必须遵守）
1. 阅读 task_plan.md 了解当前任务
2. 阅读 docs/02_ARCHITECTURE.md 了解架构
3. 阅读 docs/06_PROTOCOL_MAPPING.md 了解协议映射
4. 按任务开发，完成后更新 task_plan.md 和 progress.md
```

---

## 项目目录结构

```
server/
├── cmd/
│   └── main.go
├── modules/
│   ├── match/          # Match Handlers
│   ├── rpc/            # RPC Functions
│   ├── hooks/          # Hooks
│   └── shared/         # 共享模块
├── adapter/            # 协议翻译层
├── storage/            # Storage Schema
├── config/
└── docker/
```

---

## 关键约定

1. **红线文档**: 开发前必须阅读并遵守 [docs/RED_LINES.md](./docs/RED_LINES.md)
2. **目录结构**: 严格遵循架构文档定义的目录结构
3. **协议映射**: 所有协议必须遵循 docs/06_PROTOCOL_MAPPING.md
4. **OpCode 分配**: 德州扑克使用 100-149/200-249
5. **任务追踪**: 每完成一个任务必须更新 task_plan.md 和 progress.md
6. **文档同步**: 任务完成、新需求、新方案确认时必须先更新相关文档
