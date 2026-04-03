# 老代码索引

> 原 H5 客户端代码结构索引
> 
> 创建日期：2026-04-03

## 概述

本文档记录原 H5 客户端的代码结构，用于新系统迁移参考。

---

## 代码目录结构

```
old-h5-client/
├── assets/                  # 静态资源
│   ├── images/              # 图片资源
│   ├── sounds/              # 音效资源
│   └── fonts/               # 字体资源
├── scripts/                 # 脚本文件
│   ├── core/                # 核心模块
│   │   ├── network/         # 网络通信
│   │   │   ├── http.js      # HTTP 请求封装
│   │   │   └── websocket.js # WebSocket 封装
│   │   ├── game/            # 游戏核心
│   │   │   ├── texas/       # 德州扑克
│   │   │   ├── niuniu/      # 牛牛
│   │   │   └── doudizhu/    # 斗地主
│   │   └── ui/              # UI 组件
│   ├── views/               # 页面视图
│   │   ├── login/           # 登录页
│   │   ├── lobby/           # 大厅页
│   │   ├── room/            # 房间页
│   │   └── profile/         # 个人中心
│   └── utils/               # 工具函数
├── config/                  # 配置文件
│   ├── game.js              # 游戏配置
│   └── server.js            # 服务器配置
└── index.html               # 入口文件
```

---

## 核心模块分析

### 网络通信模块

| 文件 | 说明 |
|------|------|
| `http.js` | HTTP 请求封装，包含 Token 管理、错误处理 |
| `websocket.js` | WebSocket 封装，包含心跳、重连、消息分发 |

### 游戏模块

| 目录 | 说明 |
|------|------|
| `texas/` | 德州扑克游戏逻辑 |
| `niuniu/` | 牛牛游戏逻辑 |
| `doudizhu/` | 斗地主游戏逻辑 |

### UI 组件

| 目录 | 说明 |
|------|------|
| `components/` | 公共组件 |
| `dialogs/` | 弹窗组件 |
| `panels/` | 面板组件 |

---

## 协议文件位置

### HTTP API 协议

```
scripts/core/network/http.js
```

关键函数：
- `login()` - 登录
- `getUserInfo()` - 获取用户信息
- `enterRoom()` - 进入房间
- `exitRoom()` - 退出房间

### WebSocket 协议

```
scripts/core/network/websocket.js
```

消息格式：
```javascript
{
  m: "消息名称",
  d: { /* 数据 */ }
}
```

---

## 迁移要点

### 需要迁移的功能

| 功能 | 原代码位置 | 新系统对应 |
|------|------------|------------|
| 登录认证 | `http.js:login()` | Nakama AuthenticateDevice |
| 用户信息 | `http.js:getUserInfo()` | Nakama GetAccount |
| 进入房间 | `http.js:enterRoom()` | Nakama Match |
| 游戏操作 | `websocket.js:send()` | Nakama Match OpCode |
| 聊天功能 | `websocket.js:chat()` | Nakama Chat |

### 协议映射

| 老协议 | 新协议 | 说明 |
|--------|--------|------|
| `POST /api/user/login` | `client.AuthenticateDevice` | 登录 |
| `POST /api/room/enter` | `client.JoinMatch` | 进入房间 |
| `{m:"GSC_CM_Bet",d:...}` | `OpCode: 101` | 下注 |

---

## 注意事项

1. **代码仅供参考**：新系统使用 TypeScript + Vue 3 重构
2. **协议需适配**：老协议需要翻译层转换
3. **功能需验证**：迁移后需逐一验证功能正确性
