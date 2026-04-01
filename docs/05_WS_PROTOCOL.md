# WebSocket 协议

> 详细文档已拆分到 [ws/](./ws/) 子目录

## 文档结构

```
ws/
├── 00_index.md       # 索引和通用规范
├── 01_connection.md  # 连接模块
├── 02_lobby.md       # 大厅模块
├── 03_texas.md       # 德州扑克模块
├── 04_match.md       # 比赛模块
└── 05_user.md        # 用户模块
```

---

## 快速导航

| 模块 | 文档 | 说明 |
|------|------|------|
| 索引 | [ws/00_index.md](./ws/00_index.md) | 消息汇总、DCN路径汇总 |
| 连接模块 | [ws/01_connection.md](./ws/01_connection.md) | 连接、心跳、登录、DCN订阅 |
| 大厅模块 | [ws/02_lobby.md](./ws/02_lobby.md) | 房间进入、分组系统、俱乐部订阅 |
| 德州扑克 | [ws/03_texas.md](./ws/03_texas.md) | 德州扑克游戏消息 |
| 比赛模块 | [ws/04_match.md](./ws/04_match.md) | 比赛相关消息 |
| 用户模块 | [ws/05_user.md](./ws/05_user.md) | 用户状态同步 |

---

## 消息格式概览

### 客户端发送

```json
{
  "m": "消息名称",
  "d": "JSON字符串"
}
```

### 服务端推送

```json
{
  "msgName": "消息名称",
  "data": { ... }
}
```

---

## 消息前缀规范

| 前缀 | 说明 |
|------|------|
| SRS_ | 服务器路由消息 |
| GSC_ | 游戏服务器消息 |
| SSH | 简单心跳 |
