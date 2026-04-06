# RBAC 权限系统

> 基于角色的访问控制
>
> 创建日期：2026-04-03
> 最后更新：2026-04-06

## 模块概述

WarForge Admin 采用 RBAC（Role-Based Access Control）权限模型，通过用户-角色-权限的层级关系控制菜单访问和按钮操作权限。

---

## 数据模型

### ER 图

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│ admin_users │     │ admin_user_roles│     │ admin_roles │
├─────────────┤     ├─────────────────┤     ├─────────────┤
│ id          │────>│ user_id         │<────│ id          │
│ username    │     │ role_id         │     │ name        │
│ password    │     └─────────────────┘     │ code        │
│ nickname    │                             │ status      │
│ status      │                             └─────────────┘
└─────────────┘                                   │
                                                  │
┌─────────────┐     ┌───────────────────────┐    │
│admin_perms  │<────│admin_role_permissions │<───┘
├─────────────┤     ├───────────────────────┤
│ id          │     │ role_id               │
│ name        │     │ permission_id         │
│ code        │     └───────────────────────┘
│ type        │
│ path        │
│ component   │
│ icon        │
│ parent_id   │
└─────────────┘
```

### 数据库表

| 表名 | 说明 |
|------|------|
| `admin_users` | 管理员用户表 |
| `admin_roles` | 角色表 |
| `admin_permissions` | 权限表（菜单+按钮） |
| `admin_user_roles` | 用户-角色关联表 |
| `admin_role_permissions` | 角色-权限关联表 |
| `admin_operation_logs` | 操作日志表 |

---

## 权限类型

### 菜单权限 (type = 'menu')

控制用户可见的菜单项，用于生成动态路由。

```sql
-- 示例：Dashboard 菜单
INSERT INTO admin_permissions (name, code, type, path, component, icon)
VALUES ('Dashboard', 'dashboard', 'menu', '/dashboard', 'view.dashboard', 'carbon:dashboard');
```

### 按钮权限 (type = 'button')

控制页面内的操作按钮，如新增、删除、导出等。

```sql
-- 示例：用户管理按钮权限
INSERT INTO admin_permissions (name, code, type, parent_id)
VALUES 
  ('新增用户', 'user:create', 'button', '用户管理ID'),
  ('删除用户', 'user:delete', 'button', '用户管理ID'),
  ('编辑用户', 'user:edit', 'button', '用户管理ID');
```

### API权限 (api_paths 字段)

控制后端API的访问权限，用于RBAC中间件鉴权。

```sql
-- 权限表增加 api_paths 字段
ALTER TABLE admin_permissions ADD COLUMN api_paths JSONB DEFAULT '[]'::jsonb;

-- 示例：管理员管理权限的API路径配置
UPDATE admin_permissions SET api_paths = '[
  {"path": "/api/v1/admins", "methods": ["GET", "POST"]},
  {"path": "/api/v1/admins/*", "methods": ["GET", "PUT", "DELETE"]},
  {"path": "/api/v1/admins/*/roles", "methods": ["GET", "PUT"]}
]'::jsonb WHERE code = 'admin_list';
```

**API路径格式**：

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | API路径，支持通配符 `*` |
| methods | string[] | 允许的HTTP方法 |

**通配符说明**：

- `/api/v1/admins` - 精确匹配
- `/api/v1/admins/*` - 匹配 `/api/v1/admins/:id` 等路径

---

## 默认数据

### 默认管理员

| 字段 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `admin123` |
| 角色 | `super_admin`（超级管理员） |

### 默认角色

| 角色编码 | 角色名称 | 说明 |
|----------|----------|------|
| `super_admin` | 超级管理员 | 拥有所有权限 |

### 默认菜单权限

| 菜单 | 路径 | 图标 |
|------|------|------|
| Dashboard | `/dashboard` | carbon:dashboard |
| 系统管理 | `/system` | carbon:settings |
| 用户管理 | `/system/user` | carbon:user |
| 角色管理 | `/system/role` | carbon:user-role |
| 权限管理 | `/system/permission` | carbon:locked |
| 游戏管理 | `/game` | carbon:game-console |
| 机器人管理 | `/game/bot` | carbon:bot |
| 玩家管理 | `/game/player` | carbon:user-profile |
| 统计分析 | `/statistics` | carbon:chart-bar |
| 游戏统计 | `/statistics/game` | carbon:chart-line |
| 玩家统计 | `/statistics/player` | carbon:chart-area |

---

## 前端实现

### 获取用户权限

```typescript
// src/store/modules/auth/index.ts
// 登录后获取用户信息
const userInfo = await fetchGetUserInfo();
// userInfo.roles: 角色列表
// userInfo.buttons: 按钮权限列表
```

### 获取动态路由

```typescript
// src/store/modules/route/index.ts
// 动态路由模式
async function initDynamicAuthRoute() {
  const { data, error } = await fetchGetUserRoutes();
  // data.routes: 用户可访问的路由
  // data.home: 默认首页
}
```

### 按钮权限控制

```vue
<template>
  <!-- 方式1：v-if 判断 -->
  <n-button v-if="hasPermission('user:create')">新增用户</n-button>
  
  <!-- 方式2：自定义指令 -->
  <n-button v-permission="'user:delete'">删除用户</n-button>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store';

const authStore = useAuthStore();

function hasPermission(code: string) {
  return authStore.userInfo.buttons.includes(code);
}
</script>
```

---

## 后端 RPC 接口

### admin_login

用户登录，验证账号密码，生成 Token。

```go
// 请求
{
  "username": "admin",
  "password": "admin123"
}

// 响应
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "..."
}
```

### admin_get_user_info

获取当前登录用户的信息和权限。

```go
// 响应
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "userName": "Administrator",
  "roles": ["super_admin"],
  "buttons": ["user:create", "user:edit", "user:delete"]
}
```

### admin_get_routes

获取当前用户可访问的菜单路由。

```go
// 响应
{
  "routes": [
    {
      "name": "dashboard",
      "path": "/dashboard",
      "component": "view.dashboard",
      "meta": {
        "title": "Dashboard",
        "icon": "carbon:dashboard"
      }
    }
  ],
  "home": "dashboard"
}
```

### admin_check_route

检查用户是否有访问某个路由的权限。

```go
// 请求
{
  "routeName": "system_user"
}

// 响应
"true" | "false"
```

---

## 权限管理界面

### 用户管理

- 用户列表
- 新增/编辑用户
- 分配角色
- 启用/禁用用户

### 角色管理

- 角色列表
- 新增/编辑角色
- 分配权限
- 删除角色

### 权限管理

- 权限列表（树形）
- 新增/编辑权限
- 菜单权限配置
- 按钮权限配置

---

## 权限检查流程

### 前端路由权限检查

```
用户访问页面
     │
     ▼
┌─────────────────┐
│ 路由守卫检查    │
│ token 是否有效  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 获取用户权限    │
│ admin_get_user  │
│ _info           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 获取动态路由    │
│ admin_get_routes│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 生成菜单和路由  │
│ 注册到 Router   │
└────────┬────────┘
         │
         ▼
    进入页面
```

### 后端API权限检查

```
API请求到达
     │
     ▼
┌─────────────────┐
│ Auth 中间件     │
│ 验证 JWT Token  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RBAC 中间件     │
│ 检查API权限     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  通过      拒绝(403)
    │
    ▼
┌─────────────────┐
│ 执行业务逻辑    │
└─────────────────┘
```

### API权限分类

| 分类 | 中间件 | 说明 | 示例 |
|------|--------|------|------|
| **公开API** | 无 | 无需登录 | `/api/v1/auth/login` |
| **登录即可** | `Auth()` | 只需登录状态 | `/api/v1/auth/change-password` |
| **需要RBAC** | `Auth()` + `RBAC()` | 需要特定权限 | `/api/v1/admins` |

### 不需要RBAC鉴权的API

这些API只需要登录状态即可访问：

| API | 说明 |
|-----|------|
| `/api/v1/auth/login` | 登录 |
| `/api/v1/auth/refresh-token` | 刷新Token |
| `/api/v1/auth/logout` | 退出登录 |
| `/api/v1/auth/user-info` | 获取自己的信息 |
| `/api/v1/auth/change-password` | 修改自己的密码 |
| `/api/v1/auth/profile` | 修改自己的资料 |
| `/api/v1/auth/routes` | 获取自己的路由 |
| `/api/v1/menus` | 获取菜单列表 |
| `/api/v1/upload-records/presigned` | 获取上传预签名 |
| `/api/v1/upload-records/confirm` | 确认上传 |

**设计原则**：

- 个人操作（修改密码、修改资料）只能操作自己的数据
- 通过JWT中的userID确保数据安全

---

## 路由命名规范

### 核心原则

**前端路由为准**：elegant-router 根据文件结构自动生成路由，数据库菜单必须与前端路由结构保持一致。

### 命名规则

| 项目 | 规则 | 示例 |
|------|------|------|
| 路由名称 | 下划线分隔，禁止使用冒号 | `storage_config` ✓, `storage:config` ✗ |
| 路由路径 | 根据文件夹层级自动生成 | `/storage/config` |
| 一级菜单 component | 有子菜单时使用 `layout.base` | `layout.base` |
| 二级菜单 component | 使用 `view.{路由名称}` | `view.storage_config` |
| 父级关系 | 必须与前端文件结构一致 | `storage_config` 父级必须是 `storage` |

### 添加新菜单流程

```
步骤 1: 创建前端页面
        └─ 文件位置: src/views/{父目录}/{子目录}/index.vue

步骤 2: 等待路由生成
        └─ 重启 dev server 或等待热更新
        └─ 检查: src/router/elegant/routes.ts

步骤 3: 配置数据库菜单
        └─ code = 前端路由名称 (下划线格式)
        └─ path = 前端路由路径
        └─ component = 根据层级设置
        └─ parent_id = 与前端路由层级一致

步骤 4: 分配权限
        └─ 给相应角色分配菜单和按钮权限
```

### 前端路由与数据库映射示例

**前端文件结构**：

```
src/views/
├── storage/
│   ├── config/
│   │   └── index.vue      → 路由: storage_config, 路径: /storage/config
│   └── records/
│       └── index.vue      → 路由: storage_records, 路径: /storage/records
```

**数据库菜单配置**：

```sql
-- 一级菜单 (storage)
INSERT INTO admin_permissions (code, name, parent_id, path, component) VALUES
('storage', '存储', NULL, '/storage', 'layout.base');

-- 二级菜单 (storage_config)
INSERT INTO admin_permissions (code, name, parent_id, path, component) VALUES
('storage_config', '存储配置', '{storage_id}', '/storage/config', 'view.storage_config');

-- 二级菜单 (storage_records)
INSERT INTO admin_permissions (code, name, parent_id, path, component) VALUES
('storage_records', '上传记录', '{storage_id}', '/storage/records', 'view.storage_records');
```

---

## 扩展计划

- [ ] 数据权限（部门、组织）
- [ ] 权限缓存优化
- [ ] 权限变更实时通知
- [x] 操作日志记录（已完成）

---

## 操作日志系统

### 概述

所有管理员在后台的操作都会被记录到 `admin_operation_logs` 表中，用于审计和问题追踪。

### 数据库表结构

```sql
CREATE TABLE admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admin_users(id),
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 记录的操作类型

| action | 说明 |
|--------|------|
| `login` | 登录 |
| `logout` | 登出 |
| `user:create` | 创建用户 |
| `user:update` | 更新用户 |
| `user:delete` | 删除用户 |
| `role:create` | 创建角色 |
| `role:update` | 更新角色 |
| `role:delete` | 删除角色 |
| `permission:assign` | 分配权限 |
| `content:create` | 创建内容 |
| `content:update` | 更新内容 |
| `content:delete` | 删除内容 |
| `storage:upload` | 上传文件 |
| `settings:update` | 更新设置 |

### 后端实现

操作日志通过中间件自动记录：

```go
// internal/interfaces/http/webadmin/middleware/middleware.go
func OperationLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 记录请求信息
        log := models.AdminOperationLog{
            UserID:     userID,
            Username:   username,
            Action:     c.Request.Method + ":" + c.FullPath(),
            TargetType: targetType,
            TargetID:   targetID,
            Details:    details,
            IP:         c.ClientIP(),
            UserAgent:  c.Request.UserAgent(),
        }
        log.Save(db)
    }
}
```

### 前端查看

运维菜单下有"操作日志"页面，可以查看所有操作记录。

---

## 动态路由系统

### 概述

路由由后端根据用户权限动态生成，前端不再硬编码路由配置。

### 工作流程

```
用户登录
    │
    ▼
前端请求 /api/user/routes
    │
    ▼
后端查询用户权限
    │
    ▼
构建路由树 (buildRouteTree)
    │
    ▼
返回路由配置给前端
    │
    ▼
前端注册路由
```

### 后端路由生成逻辑

```go
// internal/interfaces/http/webadmin/handlers/admin/route.go
func GetUserRoutes(c *gin.Context) {
    // 1. 获取用户ID
    userID := c.Get("userID")
    
    // 2. 查询用户菜单权限
    permissions := models.AdminPermission{}.GetMenusByUserID(db, userID)
    
    // 3. 构建路由树
    routes := buildRouteTree(permissions, nil)
    
    // 4. 返回路由配置
    c.JSON(200, gin.H{
        "code": 0,
        "data": gin.H{
            "routes": routes,
            "home":   "home",
        },
    })
}
```

### 路由数据结构

```typescript
interface RouteConfig {
  name: string;           // 路由名称，如 "storage_config"
  path: string;           // 路由路径，如 "/storage/config"
  component: string;      // 组件路径，如 "view.storage_config"
  meta: {
    title: string;        // 菜单标题
    i18nKey: string;      // 国际化 key
    icon?: string;        // 图标
  };
  children?: RouteConfig[];
}
```

### 组件路径规则

| 层级 | component 格式 | 示例 |
|------|----------------|------|
| 一级菜单（有子菜单） | `layout.base` | `layout.base` |
| 二级菜单 | `view.{路由名}` | `view.storage_config` |
| 首页 | `layout.base$view.home` | `layout.base$view.home` |

---

## 常见问题与解决方案

### 问题1：菜单不显示

**原因**：数据库权限配置与前端路由不匹配

**解决方案**：

1. 检查 `admin_permissions` 表中的 `code` 是否与前端路由名称一致
2. 检查 `parent_id` 是否正确设置
3. 检查 `component` 路径格式是否正确

### 问题2：登录后跳转 404

**原因**：首页路由配置错误

**解决方案**：

- 确保 home 路由的 component 为 `layout.base$view.home`
- 检查数据库中 home 权限的配置

### 问题3：权限层级显示混乱

**原因**：`parent_id` 设置不正确

**解决方案**：

- 确保 `parent_id` 与实际菜单层级一致
- 例如：`storage_config` 的 `parent_id` 应该是 `storage` 的 ID

### 问题4：图标不显示

**原因**：图标名称格式错误

**解决方案**：

- 使用正确的 Iconify 图标名称格式：`mdi:home`、`carbon:user`
- 参考 [图标使用指南](./05_ICON_GUIDE.md)
