# WarForge Admin Web 概述

> WarForge 游戏服务器管理后台前端项目
> 
> 创建日期：2026-04-03

## 项目简介

WarForge Admin Web 是基于 SoybeanAdmin 模板开发的游戏服务器管理后台，用于管理游戏服务器、玩家数据、机器人配置等。项目采用前后端分离架构，前端通过 Nakama RPC API 与后端通信。

---

## 技术选型

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.31 | 渐进式 JavaScript 框架 |
| Vite | 8.0.3 | 下一代前端构建工具 |
| TypeScript | 6.0.2 | JavaScript 的超集，提供类型支持 |
| Pinia | 3.0.4 | Vue 官方状态管理库 |
| Vue Router | 5.0.4 | Vue 官方路由管理器 |

### UI 框架

| 技术 | 版本 | 说明 |
|------|------|------|
| NaiveUI | 2.44.1 | Vue 3 组件库 |
| UnoCSS | 66.6.7 | 即时原子化 CSS 引擎 |
| Iconify | 5.0.0 | 统一的图标框架 |

### 工具库

| 技术 | 版本 | 说明 |
|------|------|------|
| VueUse | 14.2.1 | Vue Composition API 工具集 |
| Day.js | 1.11.20 | 轻量级日期处理库 |
| ECharts | 6.0.0 | 数据可视化图表库 |
| Vue i18n | 11.3.0 | 国际化解决方案 |

### 后端通信

| 技术 | 说明 |
|------|------|
| Nakama RPC | 通过 HTTP 调用 Nakama 服务端 RPC 函数 |
| Nakama WebSocket | 实时通信，用于游戏状态监控 |

---

## 目录结构

```
d:\geme\admin-web\
├── build/                    # 构建配置
│   ├── config/               # 构建配置项
│   └── plugins/              # Vite 插件配置
├── packages/                 # 内部包（monorepo）
│   ├── alova/                # Alova 请求库封装
│   ├── axios/                # Axios 请求库封装
│   ├── color/                # 颜色处理工具
│   ├── hooks/                # 通用 Hooks
│   ├── materials/            # UI 组件物料
│   ├── scripts/              # 脚本工具
│   ├── uno-preset/           # UnoCSS 预设
│   └── utils/                # 工具函数
├── public/                   # 静态资源
├── src/                      # 源代码
│   ├── assets/               # 静态资源（图片、SVG）
│   ├── components/           # 公共组件
│   │   ├── advanced/         # 高级组件
│   │   ├── common/           # 通用组件
│   │   └── custom/           # 自定义组件
│   ├── constants/            # 常量定义
│   ├── enum/                 # 枚举定义
│   ├── hooks/                # 业务 Hooks
│   │   ├── business/         # 业务相关
│   │   └── common/           # 通用 Hooks
│   ├── layouts/              # 布局组件
│   │   ├── base-layout/      # 基础布局
│   │   ├── blank-layout/     # 空白布局
│   │   └── modules/          # 布局模块
│   ├── locales/              # 国际化
│   ├── plugins/              # 插件
│   ├── router/               # 路由配置
│   │   ├── elegant/          # 自动生成路由
│   │   ├── guard/            # 路由守卫
│   │   └── routes/           # 路由定义
│   ├── service/              # API 服务
│   │   ├── api/              # API 接口定义
│   │   ├── request/          # 请求封装
│   │   └── ws/               # WebSocket 封装
│   ├── store/                # 状态管理
│   │   └── modules/          # Store 模块
│   ├── styles/               # 全局样式
│   ├── theme/                # 主题配置
│   ├── typings/              # 类型定义
│   ├── utils/                # 工具函数
│   └── views/                # 页面视图
│       └── _builtin/         # 内置页面（登录、403、404等）
├── .env                      # 环境变量
├── .env.prod                 # 生产环境变量
├── .env.test                 # 测试环境变量
├── package.json              # 项目配置
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── tsconfig.json             # TypeScript 配置
├── uno.config.ts             # UnoCSS 配置
└── vite.config.ts            # Vite 配置
```

---

## 核心模块说明

### 1. API 服务层 (`src/service/`)

| 文件 | 说明 |
|------|------|
| `api/nakama.ts` | Nakama API 客户端封装，提供统一的 RPC 调用方法 |
| `api/auth.ts` | 认证相关 API（登录、获取用户信息、刷新 Token） |
| `api/route.ts` | 路由相关 API（获取动态菜单、检查路由权限） |
| `ws/nakama-ws.ts` | Nakama WebSocket 封装，支持实时通信 |

### 2. 状态管理 (`src/store/`)

| 模块 | 说明 |
|------|------|
| `auth` | 用户认证状态（登录信息、Token、权限） |
| `route` | 路由状态（动态路由、菜单、缓存） |
| `tab` | 标签页状态（多标签管理） |
| `theme` | 主题状态（主题配置、布局设置） |
| `app` | 应用状态（侧边栏、全局配置） |

### 3. 布局系统 (`src/layouts/`)

| 布局 | 说明 |
|------|------|
| `base-layout` | 主布局（包含侧边栏、头部、内容区） |
| `blank-layout` | 空白布局（用于登录页等） |

### 4. 路由系统 (`src/router/`)

- 使用 `@elegant-router/vue` 自动生成路由
- 支持动态路由（基于 RBAC 权限）
- 路由守卫处理权限验证

---

## 环境配置

### 环境变量 (`.env`)

```bash
# 应用配置
VITE_APP_TITLE=WarForge Admin
VITE_APP_DESC=WarForge Game Server Management Console

# 路由模式：static | dynamic
VITE_AUTH_ROUTE_MODE=dynamic

# Nakama 服务配置
VITE_NAKAMA_HOST=http://localhost:7350
VITE_NAKAMA_WS_HOST=localhost
VITE_NAKAMA_WS_PORT=7350
VITE_NAKAMA_SERVER_KEY=dev_server_key_2026
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

---

## 与后端通信

### Nakama RPC 调用示例

```typescript
import { nakamaRpc } from '@/service/api/nakama';

// 调用登录 RPC
const result = await nakamaRpc<LoginResponse>('admin_login', {
  username: 'admin',
  password: 'admin123'
});
```

### WebSocket 连接示例

```typescript
import { NakamaWebSocket } from '@/service/ws/nakama-ws';

const ws = new NakamaWebSocket({
  token: userToken,
  onMessage: (msg) => console.log('Message:', msg),
  onStatus: (status) => console.log('Status:', status)
});

await ws.connect();
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./00_OVERVIEW.md) | 项目概述（本文档） |
| [01_AUTH_MODULE.md](./01_AUTH_MODULE.md) | 认证模块（登录、Token、权限验证） |
| [02_API_LAYER.md](./02_API_LAYER.md) | API 层设计（Nakama RPC、WebSocket） |
| [03_RBAC_SYSTEM.md](./03_RBAC_SYSTEM.md) | RBAC 权限系统（角色、权限管理） |
| [04_TECH_STACK.md](./04_TECH_STACK.md) | 技术选型详情（版本、选型理由） |

> 💡 新增模块时，请在此表格中添加文档链接，文件命名格式：`NN_模块名称.md`

---

## 开发规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.vue` |
| 页面 | kebab-case | `user-profile.vue` |
| 变量 | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 文件 | kebab-case | `auth-service.ts` |

### 目录规范

- 每个功能模块放在 `src/views/` 下独立目录
- 公共组件放在 `src/components/`
- 业务 Hooks 放在 `src/hooks/business/`
- API 接口放在 `src/service/api/`

### Git 提交规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

---

## 相关链接

- [SoybeanAdmin 官方文档](https://github.com/soybeanjs/soybean-admin)
- [NaiveUI 文档](https://www.naiveui.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Nakama 文档](https://heroiclabs.com/docs/nakama/)
