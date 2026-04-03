# RBAC 权限系统

> 基于角色的访问控制
> 
> 创建日期：2026-04-03

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

---

## 扩展计划

- [ ] 数据权限（部门、组织）
- [ ] 权限缓存优化
- [ ] 权限变更实时通知
- [ ] 操作日志记录
