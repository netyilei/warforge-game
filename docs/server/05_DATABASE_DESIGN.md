# 数据库设计

> WarForge Server 数据库表结构设计
>
> 创建日期：2026-04-03
> 最后更新：2026-04-06

**数据库名称：** `nakama`

## 数据库选型

| 数据 | 老系统 | 新系统 | 说明 |
|------|--------|--------|------|
| 主数据 | MongoDB | **CockroachDB** | Nakama 官方推荐，分布式 SQL |
| 缓存 | Redis | Redis | 保持使用 |
| 文件 | OSS | MinIO/OSS | 对象存储 |

> **CockroachDB 优势**：
>
> - 与 PostgreSQL 协议兼容
> - 分布式架构，自动容错
> - 水平扩展能力强
> - Nakama 官方推荐

---

## 数据库迁移

### 模块化迁移系统

项目采用 Go 模块化迁移系统，服务启动时自动执行迁移。

### 迁移模块架构

```
server/migrations/
├── migration.go           # 迁移接口定义
├── manager.go             # 迁移管理器
├── registry.go            # 迁移注册表
└── modules/               # 模块化迁移文件
    ├── 001_admin.go       # 管理员模块 (用户、角色、权限)
    ├── 002_content.go     # 内容模块 (语言、内容、Banner)
    ├── 003_email.go       # 邮件模块 (配置、模板、日志)
    ├── 004_system.go      # 系统模块 (系统配置)
    └── 005_storage.go     # 存储模块 (存储配置、上传记录)
```

### 迁移接口

```go
type Migration interface {
    Version() string      // 版本号 (如 "001")
    Module() string       // 模块名 (如 "admin")
    Up(db *sql.DB) error  // 创建/更新表结构
    Down(db *sql.DB) error // 回滚（可选）
    Seed(db *sql.DB) error // 插入默认数据
}
```

### 配置开关

```yaml
# config/config.yaml
migration:
  auto_run: true   # 是否自动运行迁移（生产环境建议关闭）
  auto_seed: true  # 是否自动插入默认数据
```

### 迁移执行流程

1. 服务启动时检查配置 `migration.auto_run`
2. 创建版本控制表 `wf_schema_migrations`
3. 扫描 `modules/` 目录下的迁移文件
4. 按版本号排序执行未执行的迁移
5. 记录执行结果到版本控制表

### 版本控制表

```sql
CREATE TABLE wf_schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);
```

### 添加新迁移模块

1. 在 `migrations/modules/` 创建新文件，如 `006_newmodule.go`
2. 实现 `Migration` 接口
3. 在 `init()` 函数中注册：`migrations.Register(NewNewModuleMigration())`

### 默认数据管理

每个迁移模块的 `Seed()` 方法负责插入默认数据：

- 使用 `INSERT ... ON CONFLICT DO NOTHING` 避免重复插入
- 使用 `INSERT ... ON CONFLICT DO UPDATE` 更新已有数据
- 可通过配置 `auto_seed` 控制是否执行

### 注意事项

1. **幂等性**：迁移脚本设计为可重复执行，不会破坏现有数据
2. **生产环境**：建议关闭 `auto_run`，手动执行迁移
3. **测试环境**：开启 `auto_run`，每次启动自动同步表结构

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

## RBAC 权限系统

### ER 关系

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
    type VARCHAR(20) NOT NULL,           -- 'menu' 或 'button'
    parent_id UUID,                       -- 父权限ID
    path VARCHAR(255),                    -- 路由路径
    component VARCHAR(255),               -- 前端组件
    icon VARCHAR(100),                    -- 图标
    api_paths JSONB DEFAULT '[]'::jsonb,  -- API路径权限
    sort_order INT DEFAULT 0,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**api_paths 字段格式**：

```json
[
  {"path": "/api/v1/admins", "methods": ["GET", "POST"]},
  {"path": "/api/v1/admins/*", "methods": ["GET", "PUT", "DELETE"]}
]
```

**权限类型**：

| type | 说明 | 用途 |
|------|------|------|
| `menu` | 菜单权限 | 控制菜单显示和路由访问 |
| `button` | 按钮权限 | 控制页面内按钮显示 |

**权限分组：**

| group_code | 权限前缀 | 说明 |
|------------|----------|------|
| dashboard | `dashboard:*` | 仪表盘 |
| user | `user:*` | 用户管理 |
| agent | `agent:*` | 代理管理 |
| game | `game:*` | 游戏管理 |
| finance | `finance:*` | 财务管理 |
| system | `system:*` | 系统设置 |

### 角色-权限关联表 (role_permissions)

```sql
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 管理员-角色关联表 (admin_roles)

```sql
CREATE TABLE admin_roles (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 管理员表 (admins)

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
```

---

## 用户表 (users)

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
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| is_agent | SMALLINT | 是否代理：0=否, 1=是 |
| agent_level | SMALLINT | 代理等级：0=普通, 1-5=等级 |
| invite_code | VARCHAR | 代理专属邀请码（唯一） |
| invited_by | BIGINT | 被谁邀请（邀请人ID） |
| agent_rate | DECIMAL | 代理返佣比例 |

---

## 用户钱包表 (user_wallets)

```sql
CREATE TABLE user_wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    coin DECIMAL(20,2) DEFAULT 0,
    diamond DECIMAL(20,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 房间表 (rooms)

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
```

---

## 游戏记录表 (game_records)

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
```

---

## 账单表 (bills)

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
```

---

## 充值订单表 (charge_orders)

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
```

---

## 比赛表 (matches)

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
```

---

## 机器人系统设计

### 机器人性格配置表

```sql
CREATE TABLE bot_personalities (
    id              BIGSERIAL PRIMARY KEY,
    game_type       VARCHAR(32) NOT NULL,
    name            VARCHAR(64) NOT NULL,
    description     TEXT,
    
    -- 下注行为配置
    bet_rate        DECIMAL(5,4) DEFAULT 0.5,
    call_rate       DECIMAL(5,4) DEFAULT 0.5,
    raise_rate      DECIMAL(5,4) DEFAULT 0.3,
    allin_rate      DECIMAL(5,4) DEFAULT 0.1,
    fold_rate       DECIMAL(5,4) DEFAULT 0.2,
    
    -- 风险偏好
    risk_level      INT DEFAULT 2,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_type, name)
);
```

### 房间机器人配置表

```sql
CREATE TABLE room_bot_configs (
    id                  BIGSERIAL PRIMARY KEY,
    game_type           VARCHAR(32) NOT NULL,
    room_level          INT NOT NULL,
    
    min_players         INT DEFAULT 2,
    max_players         INT DEFAULT 9,
    max_bots            INT DEFAULT 3,
    
    personality_weights JSONB,
    
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(game_type, room_level)
);
```

---

## 内容管理系统

### 内容分类表 (content_categories)

```sql
CREATE TABLE content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(100),
    parent_id UUID,
    sort_order INT DEFAULT 0,
    status INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 语言表 (languages)

```sql
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    status SMALLINT DEFAULT 1,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Banner 位置表 (admin_banner_positions)

```sql
CREATE TABLE admin_banner_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    width INT,
    height INT,
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Banner 表 (admin_banners)

```sql
CREATE TABLE admin_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES admin_banner_positions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    link_target VARCHAR(20) DEFAULT '_self',
    sort_order INT DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 存储系统

### 存储配置表 (storage_configs)

```sql
CREATE TABLE storage_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    driver VARCHAR(20) NOT NULL,
    bucket VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    region VARCHAR(50) DEFAULT 'auto',
    access_key VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    public_domain VARCHAR(255),
    max_file_size BIGINT DEFAULT 10485760,
    allowed_types VARCHAR(500),
    is_default BOOLEAN DEFAULT FALSE,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 上传记录表 (upload_records)

```sql
CREATE TABLE upload_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_id UUID REFERENCES storage_configs(id) ON DELETE SET NULL,
    upload_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 系统设置

### 系统设置表 (system_settings)

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 管理员设置表 (admin_settings)

```sql
CREATE TABLE admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 操作日志

### 管理员操作日志表 (admin_operation_logs)

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

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 操作用户ID |
| username | VARCHAR | 操作用户名 |
| action | VARCHAR | 操作类型（如 login、user:create） |
| target_type | VARCHAR | 操作对象类型 |
| target_id | VARCHAR | 操作对象ID |
| details | JSONB | 操作详情 |
| ip | VARCHAR | 操作IP |
| user_agent | VARCHAR | 浏览器信息 |

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

### 机器人相关

```
bot:pool:{gameType}              # 可用机器人池 Set
bot:room:{roomID}                # 房间内机器人列表 Set
bot:status:{botID}               # 机器人状态 Hash
```
