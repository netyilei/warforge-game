# WarForge Admin Web 概述

> WarForge 游戏服务器管理后台前端项目
>
> 创建日期：2026-04-03
> 最后更新：2026-04-04

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
VITE_NAKAMA_HOST=http://localhost:8202
VITE_NAKAMA_WS_HOST=localhost
VITE_NAKAMA_WS_PORT=8205
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
| [05_ICON_GUIDE.md](./05_ICON_GUIDE.md) | 图标使用指南（**重要：开发前必读**） |
| [06_STORAGE_MODULE.md](./06_STORAGE_MODULE.md) | 存储模块（文件上传、存储配置管理） |
| [../ROUTE_CONFIGURATION_GUIDE.md](../ROUTE_CONFIGURATION_GUIDE.md) | **路由配置指南（重要）** |
| [../DEVELOPMENT_ISSUES.md](../DEVELOPMENT_ISSUES.md) | **开发问题记录** |

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

### 时间格式规范

列表中的时间字段统一使用 `dayjs` 格式化显示：

```typescript
import dayjs from 'dayjs';

// 列表时间列定义
{
  title: '创建时间',
  key: 'createdAt',
  render(row) {
    return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
  },
}
```

**格式说明**：

- 显示格式：`YYYY-MM-DD HH:mm:ss`（如：`2026-04-02 23:01:15`）
- 不显示毫秒和时区信息
- 适用于所有列表中的时间字段（创建时间、更新时间、登录时间等）

---

## 相关链接

- [SoybeanAdmin 官方文档](https://github.com/soybeanjs/soybean-admin)
- [NaiveUI 文档](https://www.naiveui.com/)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Nakama 文档](https://heroiclabs.com/docs/nakama/)

---

## 常见问题与解决方案

### 路由相关

#### 问题1：登录后跳转 404 页面

**原因**：首页路由配置错误

**解决方案**：

- 检查数据库 `admin_permissions` 表中 home 路由的 component 值
- 正确值应为：`layout.base$view.home`
- 确保 home 路由的 path 为 `/home`

#### 问题2：菜单点击无反应

**原因**：前端路由名称与数据库权限 code 不匹配

**解决方案**：

1. 检查 `src/router/elegant/routes.ts` 中的路由名称
2. 确保数据库 `admin_permissions.code` 与前端路由名称一致
3. 路由命名使用下划线分隔，如 `storage_config`

#### 问题3：路由组件类型错误

**错误信息**：`不能将类型"layout.base"分配给类型"layout.base$view.admin"`

**原因**：组件路径格式不正确

**解决方案**：

- 一级菜单（有子菜单）：`layout.base`
- 二级菜单：`view.{路由名}`
- 首页：`layout.base$view.home`

### API 相关

#### 问题4：404 错误 - 接口不存在

**原因**：后端路由未注册或路径错误

**解决方案**：

1. 检查 `internal/interfaces/http/webadmin/router/router.go` 中是否注册了对应路由
2. 确认前端 API 路径与后端路由一致
3. 检查代理配置是否正确

#### 问题5：502 Bad Gateway

**原因**：后端服务未启动或代理配置错误

**解决方案**：

1. 检查后端服务是否运行
2. 检查 `.env` 文件中的代理配置
3. 确保 JSON 格式正确

### 数据库相关

#### 问题6：数据库错误 - NULL 值转换失败

**错误信息**：`converting NULL to string is unsupported`

**原因**：数据库字段为 NULL，但 Go 结构体使用非指针类型

**解决方案**：

- 使用指针类型接收可能为 NULL 的字段：`*string`
- 或使用 `sql.NullString` 类型

#### 问题7：迁移脚本编码错误

**错误信息**：`syntax error at or near "emojione"`

**原因**：PowerShell 管道传输导致 UTF-8 编码问题

**解决方案**：

```powershell
# 使用 docker cp 方式
docker cp d:\geme\server\migrations\000_init_complete.sql dev_cockroach:/tmp/migration.sql
docker exec dev_cockroach cockroach sql --insecure -d nakama -f /tmp/migration.sql
```

### 组件相关

#### 问题8：图标不显示

**原因**：图标名称格式错误

**解决方案**：

- 使用正确的 Iconify 格式：`mdi:home`、`carbon:user`
- 国旗图标：`emojione:flag-for-china`
- 参考 [图标使用指南](./05_ICON_GUIDE.md)

#### 问题9：类型错误 - 属性不存在

**错误信息**：`类型"Permission"上不存在属性"sortOrder"`

**原因**：接口定义缺少属性

**解决方案**：

- 在对应接口中添加缺失的属性定义
- 使用类型断言：`as unknown as TargetType`

### 权限相关

#### 问题10：权限层级显示混乱

**原因**：`parent_id` 设置不正确

**解决方案**：

- 确保子菜单的 `parent_id` 指向正确的父菜单 ID
- 检查 `sort_order` 字段确保排序正确

---

## 开发注意事项

### 1. SQL 必须封装在 Model 中

**红线规则**：所有 SQL 语句必须封装在对应的 Model 文件中，禁止在 Handler 中直接编写 SQL。

```go
// ✗ 错误：在 Handler 中写 SQL
func GetUser(c *gin.Context) {
    db.Query("SELECT * FROM users WHERE id = $1", id)
}

// ✓ 正确：调用 Model 方法
func GetUser(c *gin.Context) {
    user := models.User{}.GetByID(db, id)
}
```

### 2. 路由命名规范

- 使用下划线分隔：`storage_config` ✓
- 禁止使用冒号：`storage:config` ✗
- 前后端保持一致

### 3. 组件路径格式

| 层级 | 格式 | 示例 |
|------|------|------|
| 一级菜单 | `layout.base` | `layout.base` |
| 二级菜单 | `view.{name}` | `view.storage_config` |
| 首页 | `layout.base$view.home` | `layout.base$view.home` |

### 4. 时间格式

列表中的时间字段统一使用 `YYYY-MM-DD HH:mm:ss` 格式：

```typescript
render(row) {
  return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
}
```

### 5. API 响应格式

统一使用 `{code, msg, data}` 格式：

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```
