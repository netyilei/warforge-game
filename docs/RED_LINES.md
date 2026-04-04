# 项目红线文档

> 本文档定义了项目开发过程中必须严格遵守的规则和约束。任何开发活动都不得违反以下红线。

---

## 一、文档同步红线

### 1.1 文档优先原则

- **开工前必读文档**：开始任何开发任务前，必须先阅读相关正式文档，禁止脱离文档臆造实现。
- **核心文档优先级**：
  1. `task_plan.md` - 开发任务计划（planning-with-files）
  2. `findings.md` - 研究发现（planning-with-files）
  3. `progress.md` - 开发进度日志（planning-with-files）
  4. `docs/02_ARCHITECTURE.md` - 架构设计
  5. `docs/06_PROTOCOL_MAPPING.md` - 协议映射表
  6. 其他相关业务文档

### 1.2 文档同步强制要求

- **任务完成时**：必须立即更新任务进度文档 (`task_plan.md` 和 `progress.md`)，标记任务状态。
- **新需求实现时**：必须先更新需求文档和架构文档，再进行代码实现。
- **新方案确认时**：必须先更新设计文档，明确方案细节，再开始编码。
- **禁止状态**：严禁出现"代码已写完但文档未更新"或"方案已确认但文档不一致"的情况。

---

## 二、代码质量红线

### 2.1 设计原则

- **高聚合、低耦合**：编写代码前必须思考模块划分，确保职责单一、依赖清晰。
- **封装要求**：
  - 简单逻辑：**3 处及以上**使用必须封装
  - 复杂逻辑：**2 处及以上**使用必须封装
- **时刻关注**：性能、维护复杂度、代码质量

### 2.2 DRY 原则（Don't Repeat Yourself）

- **🔴 红线：禁止重复代码**：相同或相似的代码块不得出现在多个地方。
- **封装优先**：任何重复出现的逻辑必须封装为公共函数或方法。
- **示例违规**：

  ```go
  // ❌ 错误：多处重复的数据库检查代码
  db := database.GetDB()
  if db == nil {
      c.JSON(200, gin.H{"code": 500, "msg": "数据库连接未初始化"})
      return
  }
  ```

- **正确做法**：

  ```go
  // ✅ 正确：封装为公共方法
  result := database.GetDBOrError()
  if result.Err != nil {
      c.JSON(200, gin.H{"code": 500, "msg": result.Msg})
      return
  }
  db := result.DB
  ```

### 2.3 单一职责原则（Single Responsibility Principle）

- **🔴 红线：一个函数只做一件事**：每个函数、方法、类应该只有一个变化的原因。
- **Handler 职责**：只负责请求解析、调用业务逻辑、返回响应，不包含业务逻辑和 SQL。
- **Model 职责**：封装数据库操作和业务逻辑，不处理 HTTP 请求细节。
- **示例违规**：

  ```go
  // ❌ 错误：Handler 中包含 SQL 和业务逻辑
  func GetUser(c *gin.Context) {
      db := database.GetDB()
      rows, _ := db.Query("SELECT * FROM users WHERE id = $1", id)
      // ... 业务逻辑处理
  }
  ```

- **正确做法**：

  ```go
  // ✅ 正确：Handler 只负责请求处理
  func GetUser(c *gin.Context) {
      user, err := models.User{}.FindByID(db, id)
      c.JSON(200, gin.H{"code": 0, "data": user})
  }
  ```

### 2.4 高聚合低耦合原则

- **🔴 红线：模块边界清晰**：每个模块应该有明确的职责边界，模块间通过接口通信。
- **高聚合**：模块内部元素紧密相关，共同完成一个明确的功能。
- **低耦合**：模块之间依赖最小化，修改一个模块不影响其他模块。
- **示例违规**：

  ```go
  // ❌ 错误：Handler 直接依赖数据库实现细节
  func Login(c *gin.Context) {
      db := database.GetDB()
      query := "SELECT password_hash FROM admin_users WHERE username = $1"
      // ... 直接操作数据库
  }
  ```

- **正确做法**：

  ```go
  // ✅ 正确：Handler 通过 Model 层抽象数据访问
  func Login(c *gin.Context) {
      user, err := models.AdminUser{}.FindByUsername(db, username)
      // ... 业务逻辑
  }
  ```

### 2.5 代码整洁

- **即时清理**：确认代码生效后，必须第一时间清理废弃逻辑、历史方案和冗余代码。
- **禁止遗留**：不得保留"以防万一"的注释代码块。
- **呈现标准**：保持代码库绝对整洁，体现工程美学。

---

## 三、开发流程红线

### 3.1 理解先行

- **必须先了解**：在确认了解文档、了解代码情况下再开始工作。
- **禁止闷头瞎干**：不得在不理解上下文的情况下盲目编写代码。
- **不确定必问**：任何不明确的情况，必须先查阅文档或询问，再行动。

### 3.2 方案选择

- **多方案情况**：任何不明确且有多种解决方案的情况，必须告知各方案的优缺点。
- **决策确认**：涉及技术选型或架构决策，必须询问并确认采用哪种方案。
- **禁止擅断**：不得在未确认的情况下自行选择方案。

---

## 四、服务端/客户端隔离红线

### 4.1 重构服务端

- **禁止修改客户端**：重构服务端代码时，禁止在未询问的情况下修改客户端代码。
- **客户端仅作参考**：客户端代码只用于理解业务逻辑，不得随意改动。

### 4.2 修改客户端

- **禁止修改服务端**：修改客户端代码时，禁止修改任何服务端代码（新老代码均不允许）。
- **服务端仅作参考**：服务端代码只用于理解业务逻辑和数据结构。

---

## 五、架构约束红线

### 5.1 平台解耦

- **核心引擎隔离**：核心引擎 (Engine) 严禁直接调用特定平台的通信代码。
- **适配器模式**：所有底层交互必须通过 `BrokerAdapter` Trait 抽象接口实现。

### 5.2 数据安全

- **密码存储**：服务端严禁保存投资账号密码密文，只保存解密控制信息。
- **本地加密**：本地自动登录必须使用 `AppLocalKey + install_salt + HKDF-SHA256 + AES-256-GCM`。

### 5.3 并发控制

- **状态一致性**：严禁绕过 `AccountSupervisor` 并发改同一账号状态。
- **事件串行**：同一账号事件必须串行裁决。

---

## 六、性能红线

### 6.1 高频事件处理

- **禁止逐条发送**：严禁在 Tauri 中逐条发送高频事件。
- **批处理要求**：必须使用 `UiSyncWorker` 按照最高 30 FPS 批处理打包推送。
- **前端原则**：强制保持"瘦前端"和"虚拟滚动"。

---

## 七、知识产权红线

### 7.1 代码声明

- **禁止开源标识**：代码生成严禁包含任何开源协议声明（如 MIT/GPL）。
- **商业闭源**：本项目为严格的闭源专有软件 (Proprietary)。

### 7.2 依赖选择

- **避免病毒式开源库**：不得引入可能引发商业闭源纠纷的开源库（如 GPL/AGPL 系列）。

---

## 八、接口规范红线

### 8.1 请求规范

- **必须携带**：写接口必须带 `X-Request-ID`。

### 8.2 响应规范

- **统一结构**：`{code, msg, data, request_id}`
- **消息置空**：HTTP 与 WS 的 `msg` 必须强制置空，前端通过状态码映射。

---

## 九、存储规范红线

### 9.1 客户端本地存储

- **配置文件**：软件配置使用 JSON。
- **业务数据**：用户信息、账号、密码密文、高频日志统一使用 **Sled KV 的前缀匹配 (Prefix Scan)** 模式管理。
- **禁止拼接**：严禁业务代码随手拼接字符串作为存储键。

---

## 十、多语言规范红线

### 10.1 国际化要求

- **唯一途径**：客户端必须且仅能通过 `vue-i18n` 读取语言包。
- **禁止硬编码**：严禁在正式代码中硬编码人类可读文本。
- **词条清理**：废弃词条必须立即清理，多语言包必须同步修改（中英一致）。
- **测试页面例外**：仅开发期联调的测试页面可使用硬编码，严禁污染正式生产环境的语言包字典。

### 10.2 后端推送

- **禁止携带文本**：后端推送严禁携带人类可读文本。
- **状态码映射**：必须通过状态码 (Status Code) 让前端匹配映射。

---

## 十一、功能测试红线

### 11.1 基准测试要求

- **编译通过≠逻辑正确**：代码编译通过不代表功能逻辑正确，必须进行实际功能测试。
- **任务完成必测试**：任何任务完成后，必须进行基准测试验证功能是否正常。
- **禁止自以为是**：不能仅凭代码看起来正确就认为功能正常，必须通过实际运行验证。

### 11.2 测试覆盖要求

- **正常流程测试**：验证正常输入是否能得到预期结果。
- **异常流程测试**：验证错误输入是否能正确处理并返回合理错误信息。
- **边界条件测试**：验证边界值、空值、极限值的处理。

---

## 十二、通信协议红线

### 12.1 Nakama RPC 调用规范

- **payload 双重编码**：调用 Nakama HTTP RPC 接口时，payload 必须是 JSON 字符串的双重编码格式。
  - 正确：`JSON.stringify(JSON.stringify({key: "value"}))` → `'"{\"key\":\"value\"}"'`
  - 错误：直接发送 JSON 对象
- **返回格式处理**：Nakama RPC 返回格式为 `{payload: "...", error: "..."}`，需要解析 payload 字段。
- **业务错误检查**：必须检查解析后的 payload 中是否包含 error 字段，如有则抛出异常。

---

## 十三、移动端兼容红线

### 13.1 布局设计要求

- **必须兼顾移动端**：对管理员后台、代理管理后台做布局、设计工作时，必须兼顾移动端浏览。
- **响应式设计**：所有页面必须采用响应式设计，确保在不同屏幕尺寸下正常显示。

---

## 十四、数据库操作红线

### 14.1 原生 SQL 优先原则

- **使用原生 SQL**：所有数据库操作使用 Go 标准库 `database/sql` 的原生 SQL 方式。
- **参数化查询**：必须使用参数化查询（`$1`, `$2` 等）防止 SQL 注入。

### 14.2 SQL 语句封装红线（强制）

- **🔴 红线：SQL 必须在 Model 中**：所有 SQL 语句必须封装在对应的 Model 文件中，**禁止在 Handler、Controller、Service 等其他地方直接编写 SQL 语句**。
- **封装位置**：统一放在 `server/models/` 目录下，按表名命名文件（如 `admin_user.go`、`admin_permission.go`）。
- **方法命名**：使用清晰的业务语义命名，如 `GetRoleCodes()`、`GetMenusByUserID()`、`CheckRouteAccess()`。
- **调用方式**：Handler 只负责调用 Model 方法，不接触 SQL 细节。

### 14.3 Models 组织规范

- **统一存放位置**：所有数据库 Model 统一存放在 `server/models/` 目录下，便于所有模块共享引用。
- **按表拆分文件**：每个数据库表对应一个 Model 文件，关联表可合并到主表文件或单独创建 `*_relations.go` 文件。
- **禁止模块私有 Models**：不得在 `modules/xxx/models/` 下创建重复的 Model 定义，避免代码冗余和维护困难。

### 14.4 示例规范

**正确做法**：

```go
// server/models/admin_user.go
func (AdminUser) GetRoleCodes(db *sql.DB, userID string) ([]string, error) {
    query := `
        SELECT r.code 
        FROM admin_roles r 
        INNER JOIN admin_user_roles ur ON r.id = ur.role_id 
        WHERE ur.user_id = $1 AND r.status = 1
    `
    rows, err := db.Query(query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var codes []string
    for rows.Next() {
        var code string
        if err := rows.Scan(&code); err != nil {
            return nil, err
        }
        codes = append(codes, code)
    }
    return codes, nil
}

// 使用
codes, err := models.AdminUser{}.GetRoleCodes(db, userID)
```

---

## 十五、路由管理红线

### 15.1 核心原则

- **前端路由为准**：elegant-router 根据文件结构自动生成路由，数据库菜单必须与前端路由结构保持一致。
- **禁止反向操作**：不得在数据库中创建前端不存在的路由。

### 15.2 路由命名规范

| 项目 | 规则 | 示例 |
|------|------|------|
| 路由名称 | 下划线分隔，禁止使用冒号 | `storage_config` ✓, `storage:config` ✗ |
| 路由路径 | 根据文件夹层级自动生成 | `/storage/config` |
| 一级菜单 component | 有子菜单时使用 `layout.base` | `layout.base` |
| 二级菜单 component | 使用 `view.{路由名称}` | `view.storage_config` |
| 父级关系 | 必须与前端文件结构一致 | `storage_config` 父级必须是 `storage` |

### 15.3 添加新菜单流程

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

### 15.4 前端路由与数据库映射示例

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

### 15.5 禁止事项

- ❌ 禁止在数据库中创建前端不存在的路由
- ❌ 禁止使用冒号(:)作为路由名称分隔符，必须使用下划线(_)
- ❌ 禁止数据库菜单层级与前端路由层级不一致
- ❌ 禁止跳过前端直接在数据库添加菜单

---

## 红线检查清单

在提交代码或完成任务前，请逐项检查：

- [ ] 文档是否已同步更新？
- [ ] 是否有重复代码需要封装？
- [ ] 废弃代码是否已清理？
- [ ] 是否在充分理解的情况下工作？
- [ ] 多方案情况是否已确认选择？
- [ ] 服务端/客户端是否越界修改？
- [ ] 是否遵循架构约束？
- [ ] 是否符合性能要求？
- [ ] 是否有违规的开源标识？
- [ ] 接口是否符合规范？
- [ ] 存储键是否符合前缀规范？
- [ ] 是否有硬编码文本？
- [ ] **是否进行了功能测试？（新增）**
- [ ] **Nakama RPC 调用是否符合双重编码规范？（新增）**
- [ ] **是否考虑了移动端兼容性？（新增）**
- [ ] **数据库操作是否使用原生 SQL？（新增）**
- [ ] **🔴 SQL 语句是否封装在 Model 文件中？（强制）**
- [ ] **查询是否封装在 Model 方法中？（新增）**
- [ ] **Models 是否统一存放在 server/models/ 目录？（新增）**
- [ ] **路由配置是否与前端一致？（新增）**
- [ ] **路由名称是否使用下划线格式？（新增）**
- [ ] **Redis Key 是否统一定义在 redis_keys.go？（新增）**
- [ ] **Admin 与 webadmin 职责是否正确分离？（新增）**
- [ ] **认证系统是否正确隔离？（新增）**
- [ ] **Gin 代码是否只在 webadmin和webproxy 目录下？（新增）**
- [ ] **文件头部是否有中文注释说明用途？（新增）**
- [ ] **函数是否有中文注释说明作用？（新增）**
- [ ] **重要逻辑是否有中文注释？（新增）**
- [ ] **🔴 HTTP API 是否使用统一响应格式？（强制）**
- [ ] **🔴 Handler 是否使用 MustGetDB() 而非检查 db == nil？（强制）**
- [ ] **服务启动时是否调用 EnsureDB() 和 EnsureRedis()？（新增）**

---

## 十六、Redis Key 管理红线

### 16.1 统一定义原则

- **禁止硬编码**：所有 Redis Key 必须在 `server/database/redis_keys.go` 中统一定义，禁止在其他地方硬编码。
- **命名规范**：`{模块}:{功能}:{标识}`

### 16.2 示例

**正确做法**：

```go
// server/database/redis_keys.go
const (
    RedisKeyAdminTokenPrefix   = "admin:token:"
    RedisKeyAdminRefreshPrefix = "admin:refresh:"
)

func GetAdminTokenKey(userID string) string {
    return RedisKeyAdminTokenPrefix + userID
}

// 使用
redisKey := database.GetAdminTokenKey(userID)
```

**错误做法**：

```go
// 直接硬编码
redisKey := "admin:token:" + userID
```

---

## 十七、Admin 与 webadmin 职责分离红线

### 17.1 模块职责划分

| 模块 | 位置 | 职责 | 数据操作 |
|------|------|------|----------|
| `modules/admin` | Nakama RPC | Nakama 核心功能 | 调用 Nakama API |
| `webadmin` | Gin HTTP API | 后台管理 | 原生SQL操作 |

### 17.2 判断标准

功能是否涉及 Nakama 核心功能（玩家、好友、匹配、房间、排行榜）？

- **是** → `modules/admin/` 实现 RPC
- **否** → `webadmin/handlers/` 实现 HTTP API

### 17.3 禁止事项

- ❌ 禁止在 webadmin 中调用 Nakama RPC 处理非核心功能
- ❌ 禁止在 modules/admin 中处理后台管理业务（用户、角色、权限、内容、设置、存储）

---

## 十九、Gin 模块独立性红线

### 19.1 模块隔离原则

- **Gin 代码专属目录**：Gin 相关代码只在 `webadmin/` 目录下，禁止与其他模块混用。
- **目录结构**：
  - 路由：`server/webadmin/routes.go`
  - 处理器：`server/webadmin/handlers/`
  - 中间件：`server/webadmin/middleware.go`
  - JWT 工具：`server/webadmin/jwtutil/`

### 19.2 公共资源

- **全局共用**：`models/`, `database/`, `config/` 可被所有模块引用
- **禁止复制**：不得在 Gin 模块中复制公共模块的代码

---

## 十八、双轨认证红线

### 18.1 认证系统隔离

| 系统 | 用户类型 | 认证方式 | Token 存储 |
|------|----------|----------|------------|
| Nakama 认证 | 游戏玩家 | Nakama Session | Nakama 内部 |
| Admin 认证 | 后台管理员 | 自定义 JWT | Redis |

### 18.2 禁止混用

- **管理员认证不依赖 Nakama**：后台管理员使用独立的 JWT 系统，不依赖 Nakama 的认证。
- **玩家认证不依赖 Admin JWT**：游戏玩家使用 Nakama Session，不使用 Admin JWT。

### 18.3 参考文件

- JWT 工具：`server/webadmin/jwtutil/jwt.go`

---

---

## 二十、代码注释红线

### 20.1 文件头部注释

- **必须添加**：每个文件头部必须添加注释，说明该文件的用途。
- **格式要求**：

  ```go
  // Package xxx 提供xxx功能
  //
  // 本文件实现xxx核心逻辑，包括：
  // - 功能1
  // - 功能2
  package xxx
  ```

### 20.2 函数注释

- **必须添加**：每个函数必须添加注释，说明函数的作用。
- **格式要求**：

  ```go
  // FunctionName 函数功能简述
  //
  // 详细说明（可选）：
  // - 参数说明
  // - 返回值说明
  // - 注意事项
  func FunctionName(param string) error {
  ```

### 20.3 重要逻辑注释

- **必须添加**：重要逻辑、复杂算法、业务规则必须添加注释说明。
- **注释语言**：所有注释必须使用中文。

### 20.4 示例

**正确做法**：

```go
// Package rpc 提供 Nakama RPC 接口实现
//
// 本文件实现游戏核心 RPC 接口，包括：
// - 健康检查接口
// - 用户信息查询接口
package rpc

import (
    "context"
    "database/sql"

    "github.com/heroiclabs/nakama-common/runtime"
)

// Init 初始化 RPC 模块
//
// 注册所有 RPC 接口到 Nakama 运行时
func Init(logger runtime.Logger, initializer runtime.Initializer) error {
    logger.Info("Nakama RPC Module Loading...")

    // 注册健康检查接口
    if err := initializer.RegisterRpc("health", healthCheck); err != nil {
        return err
    }

    logger.Info("Nakama RPC Module Loaded!")
    return nil
}

// healthCheck 健康检查接口
//
// 返回服务状态信息，用于监控和负载均衡检测
func healthCheck(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    return `{"status":"ok","service":"warforge-nakama"}`, nil
}
```

### 20.5 禁止事项

- ❌ 禁止文件无头部注释
- ❌ 禁止函数无功能说明
- ❌ 禁止使用英文注释
- ❌ 禁止注释与代码不一致

---

## 二十一、统一响应格式红线

### 21.1 响应格式规范

- **统一结构**：所有 HTTP API 响应必须使用统一的 `Response` 结构。
- **封装位置**：统一响应辅助函数定义在 `server/webadmin/response.go`。
- **禁止直接返回**：禁止在 Handler 中直接使用 `c.JSON(200, gin.H{...})` 格式返回。

### 21.2 响应辅助函数

| 函数 | 用途 | 示例 |
|------|------|------|
| `Success(c, data)` | 成功响应 | `webadmin.Success(c, user)` |
| `SuccessMsg(c, msg, data)` | 成功响应（带消息） | `webadmin.SuccessMsg(c, "创建成功", user)` |
| `Error(c, code, msg)` | 错误响应 | `webadmin.Error(c, 400, "参数错误")` |
| `ErrorWithData(c, code, msg, data)` | 错误响应（带数据） | `webadmin.ErrorWithData(c, 400, "验证失败", errors)` |
| `BadRequest(c)` | 参数错误 | `webadmin.BadRequest(c)` |
| `NotFound(c, msg)` | 未找到 | `webadmin.NotFound(c, "用户不存在")` |
| `ServerError(c, msg)` | 服务器错误 | `webadmin.ServerError(c, "内部错误")` |
| `DBError(c, msg)` | 数据库错误 | `webadmin.DBError(c, "查询失败")` |
| `Unauthorized(c, msg)` | 未授权 | `webadmin.Unauthorized(c, "请先登录")` |
| `Forbidden(c, msg)` | 禁止访问 | `webadmin.Forbidden(c, "无权限")` |

### 21.3 示例规范

**错误做法**：

```go
// ❌ 错误：直接使用 gin.H 返回
func GetUser(c *gin.Context) {
    db := database.GetDB()
    if db == nil {
        c.JSON(200, gin.H{
            "code": 500,
            "msg":  "数据库连接未初始化",
            "data": nil,
        })
        return
    }
    user, err := models.User{}.FindByID(db, id)
    if err != nil {
        c.JSON(200, gin.H{
            "code": 404,
            "msg":  "用户不存在",
            "data": nil,
        })
        return
    }
    c.JSON(200, gin.H{
        "code": 0,
        "msg":  "success",
        "data": user,
    })
}
```

**正确做法**：

```go
// ✅ 正确：使用统一响应辅助函数
func GetUser(c *gin.Context) {
    db := database.MustGetDB()
    user, err := models.User{}.FindByID(db, id)
    if err != nil {
        webadmin.NotFound(c, "用户不存在")
        return
    }
    webadmin.Success(c, user)
}
```

---

## 二十二、数据库连接管理红线

### 22.1 启动时检查原则

- **Fail Fast 原则**：服务启动时必须检查数据库和 Redis 连接是否可用，如果不可用则立即退出。
- **责任归属**：数据库连接检查是 `database` 包的责任，不是 Handler 的责任。
- **Handler 简化**：Handler 不应关心数据库连接状态，直接使用 `database.MustGetDB()` 获取连接。

### 22.2 连接获取规范

| 函数 | 用途 | 行为 |
|------|------|------|
| `database.MustGetDB()` | 获取数据库连接 | 连接不可用时 panic |
| `database.MustGetRedis()` | 获取 Redis 连接 | 连接不可用时 panic |
| `database.EnsureDB()` | 确保数据库可用 | 启动时调用，不可用则退出 |
| `database.EnsureRedis()` | 确保 Redis 可用 | 启动时调用，不可用则退出 |

### 22.3 服务启动流程

```go
// server/webadmin/server.go
func StartServer() *http.Server {
    // 1. 启动时确保数据库和 Redis 可用
    database.EnsureDB()
    database.EnsureRedis()

    // 2. 初始化路由和服务
    router := gin.New()
    router.Use(gin.Recovery())  // Recovery 中间件捕获 panic

    // 3. 注册路由
    registerRoutes(router)

    // 4. 启动服务
    // ...
}
```

### 22.4 Handler 编写规范

**错误做法**：

```go
// ❌ 错误：Handler 检查数据库连接
func GetUser(c *gin.Context) {
    db := database.GetDB()
    if db == nil {
        c.JSON(200, gin.H{"code": 500, "msg": "数据库连接未初始化"})
        return
    }
    // ...
}
```

**正确做法**：

```go
// ✅ 正确：Handler 直接使用 MustGetDB
func GetUser(c *gin.Context) {
    db := database.MustGetDB()  // 如果连接不可用，由 Recovery 中间件处理
    // ...
}
```

### 22.5 设计理由

1. **职责分离**：Handler 专注业务逻辑，不关心基础设施状态
2. **快速失败**：服务启动时发现问题，而不是运行时才发现
3. **代码简洁**：消除每个 Handler 中重复的连接检查代码
4. **统一处理**：由 Recovery 中间件统一处理运行时异常

---

## 二十三、代码编辑后检查红线

### 23.1 强制检查要求

- **必须检查错误**：每次编辑代码后，必须检查是否有编译错误、类型错误或运行时错误。
- **检查方式**：
  - Go 代码：运行 `go build` 检查编译错误
  - TypeScript 代码：运行 `npm run typecheck` 或查看 IDE 诊断
  - 前端代码：运行 `npm run build` 检查构建错误

### 23.2 检查时机

- **编辑后立即检查**：代码编辑完成后，必须立即进行错误检查。
- **提交前检查**：提交代码前必须再次确认无错误。

### 23.3 禁止事项

- ❌ 禁止编辑代码后不检查错误
- ❌ 禁止忽略编译错误或类型错误
- ❌ 禁止在存在错误的情况下继续其他任务

---

**违反以上红线的代码提交将被驳回，严重者将进行代码回滚。**
