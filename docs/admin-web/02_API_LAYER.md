# API 层设计

> Nakama RPC 调用封装、WebSocket 封装
> 
> 创建日期：2026-04-03

## 模块概述

API 层负责前端与后端 Nakama 服务器的通信，包括 HTTP RPC 调用和 WebSocket 实时通信。采用统一的封装方式，便于维护和扩展。

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/service/api/nakama.ts` | Nakama API 客户端封装 |
| `src/service/api/auth.ts` | 认证 API |
| `src/service/api/route.ts` | 路由 API |
| `src/service/api/index.ts` | API 统一导出 |
| `src/service/request/index.ts` | Axios 请求封装 |
| `src/service/ws/nakama-ws.ts` | Nakama WebSocket 封装 |

---

## Nakama RPC 调用

### 核心封装

```typescript
// src/service/api/nakama.ts

const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST || 'http://localhost:7350';
const NAKAMA_SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY || 'dev_server_key_2026';

// 统一 RPC 调用方法
export const nakamaRpc = async <T>(rpcId: string, payload?: Record<string, unknown>): Promise<T> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers.Authorization = getServerAuth();  // 服务端认证
  }

  return nakamaRequest<T>({
    url: `/v2/rpc/${rpcId}`,
    method: 'POST',
    data: payload,
    headers
  });
};
```

### 使用示例

```typescript
// 调用 RPC
const result = await nakamaRpc<UserInfo>('admin_get_user_info');

// 带参数调用
const loginResult = await nakamaRpc<LoginToken>('admin_login', {
  username: 'admin',
  password: 'admin123'
});
```

---

## API 分类

### 认证 API (`auth.ts`)

| 函数 | RPC | 说明 |
|------|-----|------|
| `fetchLogin` | `admin_login` | 用户登录 |
| `fetchGetUserInfo` | `admin_get_user_info` | 获取用户信息 |
| `fetchRefreshToken` | `admin_refresh_token` | 刷新 Token |

### 路由 API (`route.ts`)

| 函数 | RPC | 说明 |
|------|-----|------|
| `fetchGetConstantRoutes` | - | 获取常量路由（本地） |
| `fetchGetUserRoutes` | `admin_get_routes` | 获取用户动态路由 |
| `fetchIsRouteExist` | `admin_check_route` | 检查路由权限 |

### Nakama 原生 API (`nakama.ts`)

| 函数 | 说明 |
|------|------|
| `nakamaApi.authenticate` | 邮箱认证 |
| `nakamaApi.getAccount` | 获取账户信息 |
| `nakamaApi.storageRead` | 读取存储 |
| `nakamaApi.storageWrite` | 写入存储 |
| `nakamaApi.leaderboardList` | 排行榜列表 |

---

## WebSocket 封装

### 类定义

```typescript
// src/service/ws/nakama-ws.ts

class NakamaWebSocket {
  constructor(options: NakamaWebSocketOptions);
  
  // 连接
  connect(): Promise<void>;
  
  // 断开
  disconnect(): void;
  
  // 发送消息
  send(message: Record<string, unknown>): void;
  
  // Match 相关
  createMatch(): void;
  joinMatch(matchId: string): void;
  leaveMatch(matchId: string): void;
  sendMatchData(matchId: string, opCode: number, data: object): void;
  
  // Party 相关
  createParty(open: boolean, maxSize: number): void;
  joinParty(partyId: string): void;
  leaveParty(partyId: string): void;
  
  // 状态
  get isConnected(): boolean;
}
```

### 使用示例

```typescript
import { NakamaWebSocket } from '@/service/ws/nakama-ws';

// 创建连接
const ws = new NakamaWebSocket({
  token: userToken,
  onMessage: (msg) => {
    console.log('收到消息:', msg);
  },
  onStatus: (status) => {
    console.log('连接状态:', status);
  }
});

// 连接
await ws.connect();

// 加入 Match
ws.joinMatch('match-id');

// 发送数据
ws.sendMatchData('match-id', 1, { action: 'move', x: 100, y: 200 });

// 断开
ws.disconnect();
```

### 自动重连

- 最大重连次数：5 次
- 重连延迟：递增（1s, 2s, 3s...）
- 心跳间隔：15 秒

---

## 请求拦截器

### 请求拦截

```typescript
// 自动添加 Token
headers.Authorization = `Bearer ${token}`;

// 添加基础 URL
baseURL: NAKAMA_HOST
```

### 响应拦截

```typescript
// 统一错误处理
if (error.response?.status === 401) {
  // Token 过期，跳转登录
  router.push('/login');
}
```

---

## 环境配置

```bash
# .env
VITE_NAKAMA_HOST=http://localhost:7350
VITE_NAKAMA_WS_HOST=localhost
VITE_NAKAMA_WS_PORT=7350
VITE_NAKAMA_SERVER_KEY=dev_server_key_2026
```

---

## 错误处理

### 错误类型

| 错误 | 处理方式 |
|------|----------|
| 401 未授权 | 跳转登录页 |
| 403 禁止访问 | 显示 403 页面 |
| 500 服务器错误 | 显示错误提示 |
| 网络错误 | 显示网络错误提示 |

### 错误响应格式

```typescript
interface ErrorResponse {
  error: string;
  code?: number;
}
```

---

## 新增 API 步骤

### 1. 定义类型

```typescript
// src/typings/api/xxx.d.ts
declare namespace Api {
  namespace Xxx {
    interface Request {
      // 请求参数
    }
    interface Response {
      // 响应数据
    }
  }
}
```

### 2. 创建 API 文件

```typescript
// src/service/api/xxx.ts
import { nakamaRpc } from './nakama';

export function fetchXxx(params: Api.Xxx.Request) {
  return nakamaRpc<Api.Xxx.Response>('xxx_rpc', params);
}
```

### 3. 导出

```typescript
// src/service/api/index.ts
export * from './xxx';
```

---

## 最佳实践

1. **统一使用 `nakamaRpc`**：所有 RPC 调用都通过此方法
2. **类型定义**：所有 API 都要有类型定义
3. **错误处理**：统一处理错误，不要在组件中单独处理
4. **命名规范**：`fetch` 前缀 + 功能描述

---

## 后端 RPC 对应表

| 前端函数 | 后端 RPC | 文件 |
|----------|----------|------|
| `fetchLogin` | `admin_login` | auth.ts |
| `fetchGetUserInfo` | `admin_get_user_info` | auth.ts |
| `fetchGetUserRoutes` | `admin_get_routes` | route.ts |
| `fetchIsRouteExist` | `admin_check_route` | route.ts |
