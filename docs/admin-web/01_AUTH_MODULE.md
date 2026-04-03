# 认证模块

> 用户登录、Token 管理、权限验证
> 
> 创建日期：2026-04-03

## 模块概述

认证模块负责管理后台的用户登录、Token 管理和权限验证。采用 Nakama RPC 进行认证，支持 RBAC 权限控制。

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/service/api/auth.ts` | 认证 API 接口 |
| `src/service/api/nakama.ts` | Nakama RPC 客户端 |
| `src/store/modules/auth/index.ts` | 认证状态管理 |
| `src/store/modules/auth/shared.ts` | 认证工具函数 |
| `src/hooks/business/auth.ts` | 认证相关 Hooks |
| `src/views/_builtin/login/` | 登录页面 |
| `src/router/guard/` | 路由守卫 |

---

## 登录流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  登录页面   │────>│  调用 RPC   │────>│  验证密码   │────>│  生成 Token │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  进入首页   │<────│  获取路由   │<────│  获取权限   │<────│  存储 Token │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 详细步骤

1. **用户输入账号密码**
   - 页面：`src/views/_builtin/login/index.vue`
   - 组件：`pwd-login.vue`

2. **调用登录 API**
   ```typescript
   // src/service/api/auth.ts
   export function fetchLogin(userName: string, password: string) {
     return nakamaRpc<Api.Auth.LoginToken>('admin_login', {
       username: userName,
       password
     });
   }
   ```

3. **后端验证**
   - RPC：`admin_login`
   - 验证用户名密码
   - 生成 JWT Token

4. **存储 Token**
   ```typescript
   // src/store/modules/auth/index.ts
   await authStore.login(userName, password);
   // Token 存储在 localStorage
   ```

5. **获取用户信息和权限**
   ```typescript
   // 调用 admin_get_user_info RPC
   const userInfo = await fetchGetUserInfo();
   // 获取用户角色和按钮权限
   ```

6. **获取动态路由**
   ```typescript
   // 调用 admin_get_routes RPC
   const routes = await fetchGetUserRoutes();
   // 根据权限生成菜单
   ```

---

## API 接口

### 登录

```typescript
// RPC: admin_login
// 请求参数
interface LoginRequest {
  username: string;
  password: string;
}

// 响应数据
interface LoginResponse {
  token: string;
  refreshToken: string;
}
```

### 获取用户信息

```typescript
// RPC: admin_get_user_info
// 无需参数，通过 Token 获取用户信息

// 响应数据
interface UserInfoResponse {
  userId: string;
  userName: string;
  roles: string[];      // 角色列表
  buttons: string[];    // 按钮权限列表
}
```

### 刷新 Token

```typescript
// RPC: admin_refresh_token
interface RefreshTokenRequest {
  refreshToken: string;
}

// 响应数据
interface LoginResponse {
  token: string;
  refreshToken: string;
}
```

---

## 状态管理

### Auth Store

```typescript
// src/store/modules/auth/index.ts
interface AuthState {
  userInfo: UserInfo;
  token: string;
  refreshToken: string;
}

// Actions
- login(userName, password)     // 登录
- logout()                       // 登出
- refreshToken()                 // 刷新 Token
- initUserInfo()                 // 初始化用户信息
- resetStore()                   // 重置状态

// Getters
- isStaticSuper                  // 是否超级管理员
- userRoles                      // 用户角色
```

---

## 权限控制

### 路由权限

```typescript
// src/router/guard/route.ts
// 动态路由模式：根据用户权限动态加载路由
if (authRouteMode === 'dynamic') {
  await initDynamicAuthRoute();
}
```

### 菜单权限

- 通过 `admin_get_routes` RPC 获取用户可访问的菜单
- 前端根据返回的菜单数据渲染侧边栏

### 按钮权限

```typescript
// 在组件中使用
import { useAuthStore } from '@/store';

const authStore = useAuthStore();

// 检查是否有某个按钮权限
if (authStore.userInfo.buttons.includes('user:delete')) {
  // 显示删除按钮
}
```

---

## Token 管理

### 存储

```typescript
// src/utils/storage.ts
// Token 存储在 localStorage
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
```

### 自动刷新

- Token 过期时自动调用 `admin_refresh_token` 刷新
- 刷新失败则跳转登录页

### 请求拦截

```typescript
// src/service/api/nakama.ts
// 每次请求自动携带 Token
headers.Authorization = `Bearer ${token}`;
```

---

## 登录页面

### 文件结构

```
src/views/_builtin/login/
├── index.vue              # 登录页面主组件
└── modules/
    ├── pwd-login.vue      # 账号密码登录
    ├── code-login.vue     # 验证码登录（预留）
    ├── register.vue       # 注册（预留）
    ├── reset-pwd.vue      # 重置密码（预留）
    └── bind-wechat.vue    # 绑定微信（预留）
```

### 当前实现

- 仅实现账号密码登录
- 默认管理员：`admin` / `admin123`

---

## 配置项

### 环境变量

```bash
# .env
VITE_AUTH_ROUTE_MODE=dynamic    # 动态路由模式
VITE_STATIC_SUPER_ROLE=super_admin  # 超级管理员角色
```

### 路由守卫

```typescript
// src/router/guard/index.ts
// 白名单路由（无需登录）
const WHITE_LIST = ['/login', '/403', '/404', '/500'];
```

---

## 后端 RPC 对应

| 前端 API | 后端 RPC | 说明 |
|----------|----------|------|
| `fetchLogin` | `admin_login` | 用户登录 |
| `fetchGetUserInfo` | `admin_get_user_info` | 获取用户信息 |
| `fetchRefreshToken` | `admin_refresh_token` | 刷新 Token |

---

## 扩展计划

- [ ] 验证码登录
- [ ] 双因素认证
- [ ] 单点登录（SSO）
- [ ] 登录日志记录
