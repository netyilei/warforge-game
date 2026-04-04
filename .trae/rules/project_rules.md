# WarForge 项目架构规则

> **AI 助手必须严格遵守红线规则。红线规则详见：[RED_LINES.md](docs/RED_LINES.md)**

---

## 关键文件索引

| 用途 | 文件路径 |
|------|----------|
| 红线规则 | `docs/RED_LINES.md` |
| Redis Key 定义 | `server/database/redis_keys.go` |
| 数据模型 | `server/models/*.go` |
| Gin 路由 | `server/webadmin/routes.go` |
| JWT 工具 | `server/webadmin/jwtutil/jwt.go` |
| Nakama RPC | `server/nakama/rpc/rpc.go` |
| Nakama 匹配器 | `server/nakama/match/match.go` |
| 配置文件 | `server/config/config.yaml` |

---

## 目录结构

```
server/
├── cmd/main.go                # 入口
├── config/                    # 配置
├── database/                  # 数据库 + Redis Key
├── models/                    # 数据模型
├── nakama/                    # Nakama 模块
│   ├── api/ws/                # WebSocket 消息定义
│   ├── rpc/                   # RPC 接口实现
│   ├── hooks/                 # 生命周期钩子
│   ├── match/                 # 权威匹配器
│   ├── shared/                # 共享常量和类型
│   ├── games/common/          # 游戏通用逻辑
│   ├── services/              # 业务服务模块
│   ├── storage/               # Storage Collection 定义
│   └── event/                 # 事件处理
├── webadmin/                  # Gin HTTP API (管理后台)
├── webproxy/                  # Gin HTTP API (代理后台)
├── modules/                   # 兼容模块 (bot, hiro, storage)
├── adapter/                   # 协议适配器
├── internal/                  # 内部工具
├── pkg/                       # 公共包
└── migrations/                # 数据库迁移
```

---

## 客户端通信架构

| 客户端 | 通信方式 | 经过 Nginx | 目标服务 |
|--------|----------|------------|----------|
| 管理后台 | HTTP/REST | ✅ | Gin (webadmin) |
| 管理后台(客服) | WebSocket | ✅ | Nakama Server |
| 代理后台 | HTTP/REST | ✅ | Gin (webproxy) |
| 游戏客户端 | WebSocket | ✅ | Nakama Server |

**关键点**：
- Gin 仅服务于管理后台和代理后台的 HTTP API
- 所有 WebSocket 连接（游戏客户端、客服）都直接连接 Nakama
- 客户端不与 Gin 直接通信，全部通过 Nginx 反向代理
