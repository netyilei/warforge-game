# 数据库设计

## 数据库选型

| 数据 | 老系统 | 新系统 | 说明 |
|------|--------|--------|------|
| 主数据 | MongoDB | PostgreSQL | 结构化、事务支持 |
| 缓存 | Redis | Redis | 保持使用 |
| 文件 | OSS | MinIO/OSS | 对象存储 |

---

## 用户系统设计

### 设计原则

| 用户类型 | 存储位置 | 说明 |
|----------|----------|------|
| **Admin** | `admins` 表 | 管理员，独立表 |
| **用户** | `users` 表 | 普通用户 |
| **代理** | `users` 表 | 与用户同表，通过字段区分 |

### 用户身份转换流程

```
普通用户 ──▶ Admin后台设置代理身份 ──▶ 成为代理
                                          │
                                          ▼
                                    ┌─────────────┐
                                    │ 生成邀请码  │
                                    │ 可登录代理后台 │
                                    └─────────────┘
```

---

## PostgreSQL 表设计

### RBAC 权限系统

> 基于角色的访问控制 (Role-Based Access Control)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   admins    │────▶│   admin_roles    │◀────│    roles    │
└─────────────┘     └──────────────────┘     └─────────────┘
                                                  │
                                                  ▼
                                            ┌──────────────────┐
                                            │ role_permissions │
                                            └──────────────────┘
                                                  │
                                                  ▼
                                            ┌─────────────┐
                                            │ permissions │
                                            └─────────────┘
```

### 角色表 (roles)

```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    description VARCHAR(256),
    is_system SMALLINT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_status ON roles(status);
```

**预设角色：**

| code | name | 说明 |
|------|------|------|
| super_admin | 超级管理员 | 拥有所有权限 |
| admin | 管理员 | 常规管理权限 |
| operator | 运营 | 运营相关权限 |
| finance | 财务 | 财务相关权限 |
| customer_service | 客服 | 客服相关权限 |
| agent_manager | 代理管理 | 代理相关权限 |

### 权限表 (permissions)

```sql
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    group_code VARCHAR(32),
    description VARCHAR(256),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_group ON permissions(group_code);
```

**权限分组：**

| group_code | 权限前缀 | 说明 |
|------------|----------|------|
| dashboard | `dashboard:*` | 仪表盘 |
| user | `user:*` | 用户管理 |
| agent | `agent:*` | 代理管理 |
| game | `game:*` | 游戏管理 |
| finance | `finance:*` | 财务管理 |
| system | `system:*` | 系统设置 |

**权限示例：**

| code | name | group_code |
|------|------|------------|
| dashboard:view | 查看仪表盘 | dashboard |
| user:view | 查看用户 | user |
| user:edit | 编辑用户 | user |
| user:ban | 封禁用户 | user |
| user:set_agent | 设置代理 | user |
| agent:view | 查看代理 | agent |
| agent:edit | 编辑代理 | agent |
| finance:view | 查看财务 | finance |
| finance:audit | 财务审核 | finance |
| system:config | 系统配置 | system |
| system:role | 角色管理 | system |
| system:admin | 管理员管理 | system |

### 角色-权限关联表 (role_permissions)

```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_role_permissions_role_perm ON role_permissions(role_id, permission_id);
```

### 管理员-角色关联表 (admin_roles)

```sql
CREATE TABLE admin_roles (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_admin_roles_admin_role ON admin_roles(admin_id, role_id);
```

---

### 管理员表 (admins)

> Admin 用户独立表，与普通用户完全隔离

```sql
CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    nickname VARCHAR(64),
    avatar_url VARCHAR(256),
    phone VARCHAR(20),
    email VARCHAR(128),
    status SMALLINT DEFAULT 1,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_status ON admins(status);
```

**RBAC 查询示例：**

```go
// 检查管理员是否有某权限
func HasPermission(adminID int64, permissionCode string) bool {
    var count int64
    db.Table("admins").
        Joins("JOIN admin_roles ON admins.id = admin_roles.admin_id").
        Joins("JOIN role_permissions ON admin_roles.role_id = role_permissions.role_id").
        Joins("JOIN permissions ON role_permissions.permission_id = permissions.id").
        Where("admins.id = ? AND permissions.code = ?", adminID, permissionCode).
        Count(&count)
    return count > 0
}

// 获取管理员所有权限
func GetAdminPermissions(adminID int64) []string {
    var permissions []string
    db.Table("permissions").
        Select("DISTINCT permissions.code").
        Joins("JOIN role_permissions ON permissions.id = role_permissions.permission_id").
        Joins("JOIN admin_roles ON role_permissions.role_id = admin_roles.role_id").
        Where("admin_roles.admin_id = ?", adminID).
        Pluck("code", &permissions)
    return permissions
}

// 获取管理员所有角色
func GetAdminRoles(adminID int64) []string {
    var roles []string
    db.Table("roles").
        Select("roles.code").
        Joins("JOIN admin_roles ON roles.id = admin_roles.role_id").
        Where("admin_roles.admin_id = ?", adminID).
        Pluck("code", &roles)
    return roles
}
```

**前端权限控制：**

```typescript
// 权限 Store
export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [] as string[],
    roles: [] as string[]
  }),
  actions: {
    async fetchPermissions() {
      const res = await api.getAdminPermissions()
      this.permissions = res.permissions
      this.roles = res.roles
    },
    hasPermission(code: string): boolean {
      if (this.roles.includes('super_admin')) return true
      return this.permissions.includes(code)
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const permissionStore = usePermissionStore()
  const requiredPermission = to.meta.permission as string
  
  if (requiredPermission && !permissionStore.hasPermission(requiredPermission)) {
    next('/403')
  } else {
    next()
  }
})
```

---

### 用户表 (users)

> 用户与代理同表，通过 `is_agent` 字段区分

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    account VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128),
    nickname VARCHAR(64),
    avatar_url VARCHAR(256),
    phone VARCHAR(20),
    email VARCHAR(128),
    
    -- 代理相关字段
    is_agent SMALLINT DEFAULT 0,
    agent_level SMALLINT DEFAULT 0,
    invite_code VARCHAR(16) UNIQUE,
    invited_by BIGINT REFERENCES users(id),
    agent_rate DECIMAL(5,2) DEFAULT 0,
    
    -- 用户状态
    status SMALLINT DEFAULT 1,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_account ON users(account);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_users_is_agent ON users(is_agent);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| is_agent | SMALLINT | 是否代理：0=否, 1=是 |
| agent_level | SMALLINT | 代理等级：0=普通, 1-5=等级 |
| invite_code | VARCHAR | 代理专属邀请码（唯一） |
| invited_by | BIGINT | 被谁邀请（邀请人ID） |
| agent_rate | DECIMAL | 代理返佣比例 |

**身份转换逻辑：**

```go
// 设置用户为代理
func SetUserAsAgent(userID int64, level int, rate float64) error {
    inviteCode := generateInviteCode(userID)
    return db.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
        "is_agent":    1,
        "agent_level": level,
        "invite_code": inviteCode,
        "agent_rate":  rate,
    }).Error
}

// 生成邀请码
func generateInviteCode(userID int64) string {
    return fmt.Sprintf("A%06d", userID%1000000)
}
```

---

### 用户钱包表 (user_wallets)

```sql
CREATE TABLE user_wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    coin DECIMAL(20,2) DEFAULT 0,
    diamond DECIMAL(20,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
```

### 用户背包表 (user_bags)

```sql
CREATE TABLE user_bags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    item_id VARCHAR(64) NOT NULL,
    count DECIMAL(20,2) DEFAULT 0,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_bags_user_id ON user_bags(user_id);
CREATE UNIQUE INDEX idx_user_bags_user_item ON user_bags(user_id, item_id);
```

### 房间表 (rooms)

```sql
CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT UNIQUE NOT NULL,
    game_id INT NOT NULL,
    room_name VARCHAR(128),
    creator_id BIGINT REFERENCES users(id),
    status SMALLINT DEFAULT 1,
    max_players INT DEFAULT 8,
    min_buyin DECIMAL(20,2),
    small_blind DECIMAL(20,2),
    big_blind DECIMAL(20,2),
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_room_id ON rooms(room_id);
CREATE INDEX idx_rooms_status ON rooms(status);
```

### 游戏记录表 (game_records)

```sql
CREATE TABLE game_records (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    game_id INT NOT NULL,
    round_no INT,
    players JSONB,
    result JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_records_room_id ON game_records(room_id);
CREATE INDEX idx_game_records_start_time ON game_records(start_time);
```

### 账单表 (bills)

```sql
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(32) NOT NULL,
    amount DECIMAL(20,2) NOT NULL,
    balance_before DECIMAL(20,2),
    balance_after DECIMAL(20,2),
    related_id VARCHAR(128),
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_type ON bills(type);
CREATE INDEX idx_bills_created_at ON bills(created_at);
```

### 充值订单表 (charge_orders)

```sql
CREATE TABLE charge_orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    amount DECIMAL(20,2) NOT NULL,
    status SMALLINT DEFAULT 0,
    pay_channel VARCHAR(32),
    pay_data JSONB,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_charge_orders_order_no ON charge_orders(order_no);
CREATE INDEX idx_charge_orders_user_id ON charge_orders(user_id);
CREATE INDEX idx_charge_orders_status ON charge_orders(status);
```

### 新闻表 (news)

```sql
CREATE TABLE news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    content TEXT,
    type VARCHAR(32),
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    publish_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_publish_at ON news(publish_at);
```

### 比赛表 (matches)

```sql
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32),
    status SMALLINT DEFAULT 0,
    max_players INT,
    signup_start TIMESTAMP,
    signup_end TIMESTAMP,
    start_time TIMESTAMP,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_match_id ON matches(match_id);
CREATE INDEX idx_matches_status ON matches(status);
```

### 比赛报名表 (match_signups)

```sql
CREATE TABLE match_signups (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    status SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_match_signups_match_user ON match_signups(match_id, user_id);
```

---

## Redis Key 设计

### 用户相关

```
user:{userID}                    # 用户基本信息 Hash
user:coin:{userID}               # 用户金币 String
user:token:{token}               # Token 对应的用户ID String
user:online:{userID}             # 用户在线状态 String
```

### 房间相关

```
room:{roomID}                    # 房间信息 Hash
room:players:{roomID}            # 房间玩家列表 Set
room:game:{roomID}               # 当前游戏状态 Hash
```

### 游戏相关

```
game:{gameID}:rooms              # 游戏房间列表 Set
game:player:{userID}:room        # 玩家当前房间 String
```

### 在线相关

```
online:count                     # 在线人数 String
online:users                     # 在线用户列表 Set
gateway:{gatewayID}:users        # 网关连接用户 Set
```

### 锁相关

```
lock:user:{userID}               # 用户操作锁 String
lock:room:{roomID}               # 房间操作锁 String
```

---

## 待完善

> 以下内容需要通过分析老服务端代码完善：
>
> - 俱乐部相关表
> - 机器人相关表
> - 客服相关表
> - 管理员相关表
> - 完整的索引设计
> - 分表分库策略
