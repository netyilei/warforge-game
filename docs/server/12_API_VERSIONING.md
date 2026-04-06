# API 版本规划

> 创建日期：2026-04-06
> 
> 最后更新：2026-04-06

## 概述

为了更好地管理 API 的稳定性和可维护性，我们将 API 分为两个版本：

| 版本 | 前缀 | 说明 | 变化频率 |
|------|------|------|----------|
| **v1** | `/api/v1` | 管理后台核心功能（稳定版本） | 极少变化 |
| **v2** | `/api/v2` | 游戏业务功能（业务版本） | 随业务迭代 |

---

## 版本划分原则

### v1 稳定版本

**特点**：
- 管理后台核心功能
- 接口稳定，极少变化
- 向后兼容性强

**包含模块**：

| 模块 | API 路径 | 说明 |
|------|----------|------|
| 认证 | `/api/v1/auth/*` | 登录、登出、刷新Token、用户信息、修改密码 |
| 管理员 | `/api/v1/admins/*` | 管理员 CRUD、角色分配 |
| 角色 | `/api/v1/roles/*` | 角色 CRUD、权限分配 |
| 权限 | `/api/v1/permissions/*` | 权限 CRUD、权限树 |
| 菜单 | `/api/v1/menus/*` | 菜单列表 |
| 操作日志 | `/api/v1/operation-logs/*` | 操作日志查询 |
| 存储配置 | `/api/v1/storage-configs/*` | 对象存储配置 |
| 上传记录(公共) | `/api/v1/upload-records/presigned` | 获取上传预签名（只需登录） |
| 上传记录(公共) | `/api/v1/upload-records/confirm` | 确认上传（只需登录） |
| 上传记录(管理) | `/api/v1/upload-records` | 上传记录列表（需RBAC） |
| 上传记录(管理) | `/api/v1/upload-records/:id` | 删除上传记录（需RBAC） |

**为什么对象存储放在 v1？**
- 对象存储厂商的协议和标准非常稳定
- S3 协议已成为行业标准，各大厂商都兼容
- 即使升级也需要数年时间
- 管理后台需要稳定的存储功能

### v2 业务版本

**特点**：
- 游戏业务相关功能
- 随业务需求迭代
- 可能有不兼容更新

**包含模块**：

| 模块 | API 路径 | 说明 |
|------|----------|------|
| 用户 | `/api/v2/users/*` | 游戏用户管理 |
| 内容 | `/api/v2/contents/*` | 内容管理（公告、活动等） |
| 分类 | `/api/v2/categories/*` | 内容分类 |
| Banner组 | `/api/v2/banner-groups/*` | Banner 分组管理 |
| Banner | `/api/v2/banners/*` | Banner 管理 |
| 语言 | `/api/v2/languages/*` | 多语言配置 |
| 邮件配置 | `/api/v2/email-configs/*` | 邮件服务器配置 |
| 邮件模板 | `/api/v2/email-templates/*` | 邮件模板 |
| 游戏定义 | `/api/v2/game-definitions/*` | 游戏类型定义 |
| 游戏配置 | `/api/v2/game-configs/*` | 游戏参数配置 |
| 系统配置 | `/api/v2/system-configs/*` | 系统参数 |
| 设置 | `/api/v2/settings/*` | 全局设置 |
| 客服支持 | `/api/v2/support/*` | 客服邮件发送 |

---

## 目录结构

### 后端

```
server/internal/interfaces/http/webadmin/
├── router/
│   ├── router.go              # 主路由入口
│   ├── v1/
│   │   └── router.go          # v1 路由注册
│   └── v2/
│       └── router.go          # v2 路由注册
├── middleware/
│   ├── v1/
│   │   └── middleware.go      # v1 中间件（管理员 JWT 认证）
│   └── v2/
│       └── middleware.go      # v2 中间件（预留扩展）
└── handlers/
    ├── admin/                 # 管理员、角色、权限、菜单、日志
    ├── auth/                  # 认证
    ├── content/               # 内容、Banner
    ├── game/                  # 游戏配置
    ├── system/                # 系统、存储、邮件、语言
    └── user/                  # 用户
```

### 前端

```
admin-web/src/service/api/
├── index.ts                   # 统一导出
├── nakama.ts                  # Nakama API（独立）
├── v1/
│   ├── index.ts               # v1 统一导出
│   ├── auth.ts                # 认证
│   ├── admin.ts               # 管理员、角色、权限、菜单
│   ├── route.ts               # 路由权限
│   ├── operation-log.ts       # 操作日志
│   └── storage.ts             # 存储配置、上传记录
└── v2/
    ├── index.ts               # v2 统一导出
    ├── content.ts             # 内容、Banner、分类
    ├── email.ts               # 邮件配置、模板
    ├── language.ts            # 语言配置
    ├── settings.ts            # 系统设置
    └── support.ts             # 客服支持
```

---

## 中间件分离

### v1 中间件

```go
// internal/interfaces/http/webadmin/middleware/v1/middleware.go

// 管理员 JWT 认证
func Auth() gin.HandlerFunc {
    // 使用 JWT Token 验证管理员身份
}

// CORS 跨域
func CORSMiddleware() gin.HandlerFunc {
    // 跨域配置
}
```

### v2 中间件

```go
// internal/interfaces/http/webadmin/middleware/v2/middleware.go

// 当前使用相同的 JWT 认证
// 未来可扩展：
// - API Key 认证
// - OAuth 认证
// - 限流控制
// - 业务特定中间件

func Auth() gin.HandlerFunc {
    // 当前使用 JWT，未来可扩展
}

func CORSMiddleware() gin.HandlerFunc {
    // 跨域配置
}
```

---

## API 请求示例

### v1 稳定版本

```bash
# 登录
POST /api/v1/auth/login

# 获取管理员列表
GET /api/v1/admins

# 获取存储配置
GET /api/v1/storage-configs
```

### v2 业务版本

```bash
# 获取游戏配置
GET /api/v2/game-configs

# 获取内容列表
GET /api/v2/contents

# 发送客服邮件
POST /api/v2/support/email
```

---

## 版本升级策略

### v1 升级原则

1. **向后兼容**：新增字段不影响现有客户端
2. **废弃通知**：废弃接口需提前 6 个月通知
3. **版本共存**：重大变更时创建 v1.1、v1.2 等

### v2 升级原则

1. **快速迭代**：随业务需求快速更新
2. **变更日志**：记录所有 API 变更
3. **前端适配**：前端需同步更新

---

## 代理配置

### 开发环境

```typescript
// vite.config.ts
proxy: {
  '/api/v1': {
    target: 'http://localhost:8201',
    changeOrigin: true
  },
  '/api/v2': {
    target: 'http://localhost:8201',
    changeOrigin: true
  }
}
```

### 生产环境

```nginx
# Nginx 配置
location /api/v1 {
    proxy_pass http://gin-server:8201;
}

location /api/v2 {
    proxy_pass http://gin-server:8201;
}
```

---

## 注意事项

1. **版本隔离**：v1 和 v2 的中间件独立，互不影响
2. **统一入口**：所有 API 都通过 Gin 服务（端口 8201）
3. **Nakama API**：独立于版本化 API，使用 `/nakama-api` 前缀
4. **文档同步**：API 变更需同步更新文档
