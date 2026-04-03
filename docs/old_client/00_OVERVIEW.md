# 老客户端 H5 分析文档

> 原 H5 客户端 API 与 WebSocket 协议分析
> 
> 创建日期：2026-04-03

## 目录说明

本目录保存原 H5 客户端的协议分析文档，用于新系统迁移参考。

---

## 文档结构

```
d:\geme\docs\old_client\
├── api/                     # HTTP API 协议分析
│   ├── 00_index.md          # API 索引
│   ├── 01_login.md          # 登录相关
│   ├── 02_lobby.md          # 大厅相关
│   ├── 03_match.md          # 匹配相关
│   ├── 04_upload.md         # 上传相关
│   ├── 05_user.md           # 用户相关
│   ├── 06_charge.md         # 充值相关
│   ├── 07_game.md           # 游戏相关
│   ├── 08_customer.md       # 客服相关
│   └── 09_reward.md         # 奖励相关
└── ws/                      # WebSocket 协议分析
    ├── 00_index.md          # WebSocket 索引
    ├── 01_connection.md     # 连接相关
    ├── 02_lobby.md          # 大厅相关
    ├── 03_texas.md          # 德州游戏
    ├── 04_match.md          # 匹配相关
    └── 05_user.md           # 用户相关
```

---

## 用途

1. **协议迁移参考**：新系统开发时参考原有协议设计
2. **功能对照**：确保新系统功能完整覆盖
3. **数据结构参考**：参考原有数据结构设计

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./00_OVERVIEW.md) | 目录概述（本文档） |
| [01_OLD_CODE_INDEX.md](./01_OLD_CODE_INDEX.md) | 老代码索引（代码结构、迁移要点） |
| [api/00_index.md](./api/00_index.md) | HTTP API 协议分析索引 |
| [ws/00_index.md](./ws/00_index.md) | WebSocket 协议分析索引 |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [../server/07_PROTOCOL_MAPPING.md](../server/07_PROTOCOL_MAPPING.md) | 新旧协议映射 |
