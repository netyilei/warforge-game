# Task Plan: Nakama 游戏服务器开发

## Goal

使用 Nakama 框架重构德州扑克游戏服务器，通过协议翻译层兼容老客户端，最终实现：

1. 老客户端无缝切换到新服务器
2. 新客户端使用 Nakama 原生协议
3. 支持多游戏扩展（德州、牛牛、斗地主、麻将）

---

## 开发策略

**渐进式开发，风险可控：**

```
管理后台 → API翻译层 → 非游戏功能测试 → 游戏逻辑迁移 → 客户端重构
   ↓           ↓             ↓               ↓              ↓
  低风险      中风险        验证通过         高风险         最后一步
```

---

## Phases

### Phase 1: 基础设施搭建

**Status:** `completed`
**Goal:** 完成项目初始化和开发环境

**Tasks:**

- [x] 创建项目目录结构
- [x] 配置 docker-compose.yml (Nakama + CockroachDB + Redis)
- [x] 初始化 Go Module
- [x] 编写 main.go 入口文件
- [x] 验证 Nakama 控制台可访问
- [x] 创建 Docker 构建脚本 (build-and-deploy.bat)
- [x] 配置 CockroachDB 数据库
- [x] 配置 Redis 缓存
- [x] 实现数据库迁移脚本

**Files Created:**

```
game-server/
├── cmd/main.go
├── modules/
├── storage/
├── adapter/
├── config/
├── docker/
│   ├── Dockerfile
│   └── setup.bat
└── build-and-deploy.bat
```

---

### Phase 2: Admin 管理后台 Web

**Status:** `completed`
**Goal:** 实现管理后台前端界面

**Tasks:**

- [x] 创建 admin-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 登录页面
- [x] 布局框架 (侧边栏 + 头部 + 内容区)
- [x] 用户管理页面
- [x] 管理员管理页面
- [x] 角色管理页面
- [x] 权限管理页面
- [ ] 代理管理页面
- [ ] 系统配置页面
- [ ] 数据统计页面
- [x] RBAC 权限系统
- [x] 动态路由
- [x] 主题切换（明暗模式）
- [x] 多标签页
- [x] 国际化支持
- [x] Vite 代理配置
- [x] 状态管理 (Pinia)

**Tech Stack:**

- Vue 3 + TypeScript
- Naive UI 组件库
- Pinia 状态管理
- Axios / Alova 请求封装
- UnoCSS 原子化 CSS
- Elegant Router 自动路由

---

### Phase 2.1: Proxy 代理管理后台 Web

**Status:** `completed`
**Goal:** 实现代理管理后台前端界面

**Tasks:**

- [x] 创建 proxy-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 复制 admin-web 基础框架
- [x] 配置独立端口 (9528)
- [x] 更新项目配置和描述
- [x] 登录页面
- [x] 布局框架
- [x] 代理专属页面
- [x] 权限控制

---

### Phase 3: Admin API 接口

**Status:** `in_progress`
**Goal:** 实现管理后台所需的后端接口

**Tasks:**

- [x] 管理员认证模块
  - [x] 管理员登录/登出
  - [x] JWT Token 验证
  - [x] 权限中间件
- [x] RBAC 权限管理
  - [x] 角色管理
  - [x] 权限管理
  - [x] 动态路由生成
- [ ] 用户管理接口
  - [ ] 用户列表/搜索
  - [ ] 用户详情
  - [ ] 用户禁用/启用
  - [ ] 用户资产查询
- [ ] 管理员管理接口
  - [ ] 管理员 CRUD
  - [ ] 角色权限管理
- [ ] 代理管理接口
  - [ ] 代理列表
  - [ ] 代理层级关系
  - [ ] 佣金统计
- [ ] 系统配置接口
  - [ ] 全局配置 CRUD
  - [ ] 游戏配置
  - [ ] 充值配置
- [ ] 客服接口
  - [ ] 客服账号管理
  - [ ] 会话分配

**Files Created:**

```
modules/admin/
├── admin.go
└── rpc/
    ├── auth.go
    ├── user.go
    └── route.go
```

---

### Phase 4: Storage Schema 定义

**Status:** `pending`
**Goal:** 定义 Nakama Storage 数据结构

**Tasks:**

- [ ] storage/user.go - 用户数据
- [ ] storage/wallet.go - 钱包数据
- [ ] storage/club.go - 俱乐部数据
- [ ] storage/match.go - 比赛数据
- [ ] storage/config.go - 系统配置
- [ ] storage/admin.go - 管理员数据

---

### Phase 5: 客户端 API 翻译层

**Status:** `pending`
**Goal:** 实现老客户端 API 兼容

**Tasks:**

- [ ] adapter/protocol/old_api.go - 老 API 协议定义
- [ ] adapter/protocol/mapping.go - 协议映射表
- [ ] adapter/api_adapter.go - API 翻译层
- [ ] 登录接口翻译
  - [ ] 游客登录
  - [ ] 账号登录
  - [ ] 手机登录
  - [ ] 钱包登录
- [ ] 用户接口翻译
  - [ ] 用户信息
  - [ ] 资产查询
  - [ ] 设置修改
- [ ] 大厅接口翻译
  - [ ] 大厅信息
  - [ ] 公告列表
  - [ ] 活动列表
- [ ] 充值接口翻译
  - [ ] 充值地址
  - [ ] 充值记录
  - [ ] 提现申请

**Files to Create:**

```
adapter/
├── protocol/
│   ├── old_api.go
│   └── mapping.go
├── api_adapter.go
└── response.go
```

---

### Phase 6: 客户端 WebSocket 翻译层

**Status:** `pending`
**Goal:** 实现老客户端 WebSocket 兼容（非游戏部分）

**Tasks:**

- [ ] adapter/protocol/old_ws.go - 老 WS 协议定义
- [ ] adapter/ws_adapter.go - WS 翻译层
- [ ] 连接认证
- [ ] 心跳保活
- [ ] 大厅消息推送
- [ ] 用户状态同步
- [ ] 聊天消息

**Files to Create:**

```
adapter/
├── protocol/
│   └── old_ws.go
├── ws_adapter.go
└── ws_handler.go
```

---

### Phase 7: 非游戏功能测试

**Status:** `pending`
**Goal:** 验证客户端非游戏功能正常

**测试清单:**

- [ ] 登录流程
  - [ ] 游客登录
  - [ ] 账号登录
  - [ ] 手机登录
  - [ ] Token 刷新
- [ ] 用户功能
  - [ ] 用户信息获取
  - [ ] 昵称/头像修改
  - [ ] 资产显示正确
- [ ] 大厅功能
  - [ ] 大厅信息加载
  - [ ] 公告显示
  - [ ] 活动入口
- [ ] 充值功能
  - [ ] 充值地址获取
  - [ ] 充值记录查询
  - [ ] 提现申请
- [ ] 管理后台
  - [ ] 用户管理正常
  - [ ] 配置修改生效
  - [ ] 客服系统可用

**验收标准:**

- 老客户端能正常登录
- 所有非游戏功能正常使用
- 管理后台能管理所有非游戏内容

---

### Phase 8: 游戏逻辑迁移

**Status:** `pending`
**Goal:** 将老服务端游戏逻辑迁移到 Go

**Tasks:**

- [ ] 共享模块开发
  - [ ] shared/opcodes/opcodes.go - OpCode 常量定义
  - [ ] shared/cards/deck.go - 牌组逻辑
  - [ ] shared/cards/hand_rank.go - 牌型判断
  - [ ] shared/room/room_base.go - 房间基类
  - [ ] shared/player/player_state.go - 玩家状态
- [ ] 德州扑克 Match Handler
  - [ ] match/match_texas.go - Match Handler 框架
  - [ ] MatchInit - 房间初始化
  - [ ] MatchJoin - 玩家加入
  - [ ] MatchLeave - 玩家离开
  - [ ] MatchLoop - 游戏循环
  - [ ] 发牌逻辑
  - [ ] 下注轮次逻辑
  - [ ] 奖池分配逻辑
- [ ] 游戏相关 RPC
  - [ ] rpc/rpc_club.go - 俱乐部 RPC
  - [ ] rpc/rpc_match.go - 比赛 RPC
  - [ ] rpc/rpc_room.go - 房间 RPC
- [ ] 游戏 WS 翻译
  - [ ] 游戏房间消息
  - [ ] 游戏操作消息
  - [ ] 游戏结果消息

**Files to Create:**

```
modules/
├── match/
│   └── match_texas.go
├── rpc/
│   ├── rpc_club.go
│   ├── rpc_match.go
│   └── rpc_room.go
└── shared/
    ├── opcodes/
    ├── cards/
    ├── room/
    └── player/
```

---

### Phase 9: 游戏功能测试

**Status:** `pending`
**Goal:** 验证老客户端游戏功能正常

**测试清单:**

- [ ] 房间功能
  - [ ] 创建房间
  - [ ] 加入房间
  - [ ] 退出房间
  - [ ] 解散房间
- [ ] 德州扑克
  - [ ] 发牌正确
  - [ ] 下注流程
  - [ ] 牌型判断
  - [ ] 奖池分配
  - [ ] 结算正确
- [ ] 俱乐部
  - [ ] 创建俱乐部
  - [ ] 成员管理
  - [ ] 房间模板
- [ ] 比赛
  - [ ] 报名
  - [ ] 比赛流程
  - [ ] 排名奖励

**验收标准:**

- 老客户端游戏功能完全正常
- 服务端重构完成

---

### Phase 10: 客户端重构

**Status:** `pending`
**Goal:** 开发新客户端，使用 Nakama 原生协议

**Tasks:**

- [ ] 新客户端架构设计
- [ ] 使用 Nakama SDK
- [ ] 原生协议适配
- [ ] 功能迁移
- [ ] UI/UX 优化

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| 开发顺序 | 管理后台优先 | 风险最低，不涉及游戏核心 |
| 协议兼容方式 | 翻译层适配 | 老客户端无需修改 |
| 游戏服务器框架 | Nakama 3.x | 成熟框架，内置 Match/Matchmaker/Storage |
| 德州扑克 OpCode | 100-149/200-249 | 预留扩展空间 |
| 数据存储 | Nakama Storage | 原生支持，无需额外设计 |
| 数据库 | CockroachDB | 分布式 SQL，PostgreSQL 兼容，Nakama 官方推荐 |
| 前端框架 | Vue 3 + NaiveUI | 现代化，TypeScript 支持，组件丰富 |
| 构建工具 | Vite | 快速启动，热更新，开发体验好 |

---

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Git 子模块无法添加 | admin-web 和 proxy-web 被识别为子模块 | 删除 .git 目录，重新添加为普通文件 |
| 403 Forbidden after login | 组件路径格式错误 | 更新为 "layout.base$view.home" 格式 |
| 仪表盘权限问题 | 所有管理员都需要仪表盘权限 | 前端不检查仪表盘权限 |
| Docker 构建效率低 | 每次修改都重新构建镜像 | 创建 build-and-deploy.bat，使用卷挂载 |
| Go 版本不兼容 | Nakama 插件需要特定 Go 版本 | 更新 go.mod 为 Go 1.26.1 |
| PostgreSQL 引用 | 文档中使用 PostgreSQL 但实际使用 CockroachDB | 更新所有文档为 CockroachDB |

---

## Dependencies

```
Phase 1 (基础设施)
    ↓
Phase 2 (Admin Web) ← Phase 3 (Admin API) ← Phase 4 (Schema)
    ↓                         ↓
Phase 2.1 (Proxy Web)
    ↓
Phase 5 (API翻译层) ← Phase 6 (WS翻译层)
    ↓
Phase 7 (非游戏测试) ← 验收通过
    ↓
Phase 8 (游戏逻辑迁移)
    ↓
Phase 9 (游戏测试) ← 验收通过
    ↓
Phase 10 (客户端重构)
```

---

## Current Focus

**Phase:** 3
**Task:** Admin API 接口开发
**Next Action:** 完善用户管理接口和代理管理接口

---

## Completed Tasks

### 文档整理 (2026-04-03)

- [x] 创建 docs/server/ 目录结构
- [x] 创建 docs/admin-web/ 目录结构
- [x] 创建 docs/old_client/ 目录结构
- [x] 整合服务端文档到 docs/server/
- [x] 整合管理后台文档到 docs/admin-web/
- [x] 整合老客户端文档到 docs/old_client/
- [x] 删除已整合的旧文档
- [x] 更新 README.md 文档索引
- [x] 更新 docs/00_OVERVIEW.md
- [x] 更新 DEVELOPMENT.md 开发文档
- [x] 更新所有数据库引用为 CockroachDB
- [x] 更新架构图和技术选型

### 开发流程优化 (2026-04-03)

- [x] 创建 Docker 构建脚本 (build-and-deploy.bat)
- [x] 优化 Go 插件开发流程
- [x] 配置 Vite 代理和头信息保留
- [x] 修复组件路径格式问题
- [x] 实现仪表盘权限豁免
- [x] 创建 proxy-web 项目框架

### Git 问题修复 (2026-04-03)

- [x] 解决 admin-web 和 proxy-web 子模块问题
- [x] 删除 .git 目录，重新添加为普通文件

### Phase 1: 基础设施搭建

- [x] 创建项目目录结构
- [x] 配置 docker-compose.yml (Nakama + CockroachDB + Redis)
- [x] 初始化 Go Module
- [x] 编写 main.go 入口文件
- [x] 验证 Nakama 控制台可访问
- [x] 配置 CockroachDB 数据库
- [x] 配置 Redis 缓存
- [x] 实现数据库迁移脚本

### Phase 2: Admin 管理后台 Web

- [x] 创建 admin-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 登录页面
- [x] 布局框架 (侧边栏 + 头部 + 内容区)
- [x] RBAC 权限系统
- [x] 动态路由
- [x] 主题切换（明暗模式）
- [x] 多标签页
- [x] 国际化支持
- [x] Vite 代理配置
- [x] 状态管理 (Pinia)

### Phase 2.1: Proxy 代理管理后台 Web

- [x] 创建 proxy-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 复制 admin-web 基础框架
- [x] 配置独立端口 (9528)
- [x] 更新项目配置和描述

### Phase 3: Admin API 接口 (进行中)

- [x] 管理员认证模块
  - [x] 管理员登录/登出
  - [x] JWT Token 验证
  - [x] 权限中间件
- [x] RBAC 权限管理
  - [x] 角色管理
  - [x] 权限管理
  - [x] 动态路由生成
- [ ] 用户管理接口
  - [ ] 用户列表/搜索
  - [ ] 用户详情
  - [ ] 用户禁用/启用
  - [ ] 用户资产查询
