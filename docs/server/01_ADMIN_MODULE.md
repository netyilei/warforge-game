# Admin 模块

> 管理后台相关功能：认证、RBAC 权限、动态路由
>
> 创建日期：2026-04-03
>
> 最后更新：2026-04-06

**数据库名称：** `nakama`

## 模块概述

Admin 模块负责管理后台的用户认证、权限管理和动态路由功能。采用 RBAC（基于角色的访问控制）模型，实现细粒度的权限控制。

---

## API权限分类

| 分类 | 中间件 | 说明 | 示例 |
|------|--------|------|------|
| **公开API** | 无 | 无需登录 | `/api/v1/auth/login` |
| **登录即可** | `Auth()` | 只需登录状态，操作自己的数据 | `/api/v1/auth/change-password` |
| **需要RBAC** | `Auth()` + `RBAC()` | 需要特定权限 | `/api/v1/admins` |

### 不需要RBAC鉴权的API

这些API只需要登录状态，通过JWT中的userID确保只能操作自己的数据：

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

---

## DDD 架构文件结构

| 层级 | 文件路径 | 说明 |
|------|----------|------|
| **领域层** | `internal/domain/admin/` | 领域实体和仓库接口 |
| | `internal/domain/admin/admin_user.go` | 管理员用户实体 |
| | `internal/domain/admin/admin_role.go` | 角色实体 |
| | `internal/domain/admin/admin_permission.go` | 权限实体 |
| | `internal/domain/admin/repository.go` | 仓库接口定义 |
| **应用层** | `internal/application/admin/` | 应用服务 |
| | `internal/application/admin/admin_user_service.go` | 用户服务 |
| | `internal/application/admin/admin_role_service.go` | 角色服务 |
| | `internal/application/admin/admin_permission_service.go` | 权限服务 |
| **基础设施层** | `internal/infrastructure/persistence/admin/` | 仓库实现 |
| | `internal/infrastructure/persistence/admin/user_repository.go` | 用户仓库实现 |
| | `internal/infrastructure/persistence/admin/role_repository.go` | 角色仓库实现 |
| | `internal/infrastructure/persistence/admin/permission_repository.go` | 权限仓库实现 |
| **接口层** | `internal/interfaces/http/webadmin/` | HTTP 接口 |
| | `internal/interfaces/http/webadmin/handlers/auth/auth.go` | 认证处理器 |
| | `internal/interfaces/http/webadmin/handlers/admin/admin.go` | 管理员处理器 |
| | `internal/interfaces/http/webadmin/handlers/admin/role.go` | 角色处理器 |
| | `internal/interfaces/http/webadmin/handlers/admin/permission.go` | 权限处理器 |
| | `internal/interfaces/http/webadmin/auth/jwt.go` | JWT 工具 |
| **数据库迁移** | `migrations/001_admin_rbac.sql` | RBAC 数据库表结构 |

---

## 数据模型

### 表结构

| 表名 | 说明 |
|------|------|
| `admin_users` | 管理员用户表 |
| `admin_roles` | 角色表 |
| `admin_permissions` | 权限表 |
| `admin_user_roles` | 用户-角色关联表 |
| `admin_role_permissions` | 角色-权限关联表 |

### ER 关系

```
admin_users ──< admin_user_roles >── admin_roles
                                              │
                                              │
admin_permissions ──< admin_role_permissions >┘
```

---

## RPC 函数

### admin_login

管理员登录，验证账号密码并生成 Token。

**请求**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "..."
}
```

**实现逻辑**：

1. 查询 `admin_users` 表验证用户名
2. 使用 bcrypt 验证密码
3. 调用 `nk.AuthenticateTokenGenerate` 生成 Token
4. 返回 Token 和 RefreshToken

---

### admin_get_user_info

获取当前登录用户的信息和权限。

**请求**：无（通过 Token 获取用户 ID）

**响应**：

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "userName": "Administrator",
  "roles": ["super_admin"],
  "buttons": ["user:create", "user:edit", "user:delete"]
}
```

**实现逻辑**：

1. 从 Context 获取用户 ID
2. 查询用户基本信息
3. 查询用户角色
4. 查询用户按钮权限
5. 组装返回数据

---

### admin_refresh_token

刷新 Token。

**请求**：

```json
{
  "refreshToken": "..."
}
```

**响应**：

```json
{
  "token": "...",
  "refreshToken": "..."
}
```

---

### admin_get_routes

获取当前用户可访问的菜单路由。

**请求**：无

**响应**：

```json
{
  "routes": [
    {
      "name": "dashboard",
      "path": "/dashboard",
      "component": "view.dashboard",
      "meta": {
        "title": "Dashboard",
        "icon": "carbon:dashboard",
        "order": 1
      },
      "children": []
    }
  ],
  "home": "dashboard"
}
```

**实现逻辑**：

1. 从 Context 获取用户 ID
2. 联表查询用户可访问的菜单权限
3. 构建路由树结构
4. 返回路由列表和默认首页

---

### admin_check_route

检查用户是否有访问某个路由的权限。

**请求**：

```json
{
  "routeName": "system_user"
}
```

**响应**：

```text
"true" | "false"
```

---

## 核心类型

### RouteItem

```go
type RouteItem struct {
    Name      string      `json:"name"`
    Path      string      `json:"path"`
    Component string      `json:"component"`
    Meta      RouteMeta   `json:"meta"`
    Children  []RouteItem `json:"children,omitempty"`
}
```

### RouteMeta

```go
type RouteMeta struct {
    Title      string `json:"title"`
    Icon       string `json:"icon,omitempty"`
    Order      int    `json:"order,omitempty"`
    HideInMenu bool   `json:"hideInMenu,omitempty"`
}
```

### dbPermission

```go
type dbPermission struct {
    ID        string
    Name      string
    Code      string
    Type      string
    ParentID  string
    Path      string
    Component string
    Icon      string
    SortOrder int
}
```

---

## 工具函数

### buildRouteTree

构建路由树结构。

```go
func buildRouteTree(permissions []dbPermission, parentID string) []RouteItem
```

**参数**：

- `permissions`: 权限列表
- `parentID`: 父级 ID（空字符串表示根节点）

**返回**：

- 路由树结构

---

## 默认数据

### 默认管理员

| 字段 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `admin123`（bcrypt 加密） |
| 角色 | `super_admin` |

### 默认角色

| 角色编码 | 角色名称 |
|----------|----------|
| `super_admin` | 超级管理员 |

---

## 前端对应

| 后端 RPC | 前端 API | 说明 |
|----------|----------|------|
| `admin_login` | `fetchLogin` | 登录 |
| `admin_get_user_info` | `fetchGetUserInfo` | 获取用户信息 |
| `admin_refresh_token` | `fetchRefreshToken` | 刷新 Token |
| `admin_get_routes` | `fetchGetUserRoutes` | 获取路由 |
| `admin_check_route` | `fetchIsRouteExist` | 检查权限 |

---

## 扩展计划

- [ ] 用户管理 CRUD
- [ ] 角色管理 CRUD
- [ ] 权限管理 CRUD
- [ ] 操作日志记录
- [ ] 登录日志记录
