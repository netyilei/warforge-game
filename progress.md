# Progress: 开发进度日志

> 记录每次会话的工作内容，方便恢复上下文

---

## Session Log

### Session 8: 2026-04-04

**Completed:**

- [x] 整合迁移脚本
  - [x] 创建 server/migrations/000_init_complete.sql
  - [x] 包含所有核心表结构（使用 IF NOT EXISTS）
  - [x] 包含初始数据（使用 ON CONFLICT DO NOTHING）
  - [x] 保留已存在的测试数据
- [x] 修复内容分类功能
  - [x] 创建 content_categories 表
  - [x] 实现 ContentCategory Model
  - [x] 实现 CRUD Handler
- [x] 更新文档
  - [x] 创建路由配置指南 (docs/ROUTE_CONFIGURATION_GUIDE.md)
  - [x] 创建开发问题记录 (docs/DEVELOPMENT_ISSUES.md)
  - [x] 更新 RBAC 系统文档
  - [x] 更新数据库设计文档
  - [x] 更新前端概述文档
  - [x] 更新 README.md 文档索引
  - [x] 更新 task_plan.md

**Files Created:**

```
docs/ROUTE_CONFIGURATION_GUIDE.md   # 路由配置指南
docs/DEVELOPMENT_ISSUES.md         # 开发问题记录
server/migrations/000_init_complete.sql  # 整合迁移脚本
```

**Files Updated:**

```
docs/admin-web/03_RBAC_SYSTEM.md    # 添加动态路由和操作日志
docs/server/05_DATABASE_DESIGN.md  # 添加新表结构
docs/admin-web/00_OVERVIEW.md      # 添加常见问题
docs/00_OVERVIEW.md                # 添加文档索引
README.md                          # 添加新文档链接
task_plan.md                       # 更新 Phase 3 状态
```

**Key Decisions:**

1. 迁移脚本使用 `docker cp` 方式执行，避免编码问题
2. 路由配置遵循：前端文件结构为准，数据库权限必须匹配
3. 组件路径格式：
   - 一级菜单（有子菜单）：`layout.base`
   - 二级菜单：`view.{路由名}`
   - 首页：`layout.base$view.home`
4. 路由命名使用下划线分隔，禁止使用冒号或横杠

**Common Issues Fixed:**

- P001: 登录后跳转 404 - 修复 home 路由 component 为 `layout.base$view.home`
- P002: 菜单点击无反应 - 修复路由名称与数据库 code 匹配
- P003: NULL 值转换失败 - 使用指针类型接收可能为 NULL 的字段
- P004: 迁移脚本编码错误 - 使用 `docker cp` 替代 PowerShell 管道
- P005: 权限层级混乱 - 修正 parent_id 设置
- P010: SQL 写在 Handler - 遵循红线规则，SQL 封装在 Model 中

**Next Session:**

- 继续完善管理后台功能
- 实现用户管理接口

**Completed:**

- [x] 修复 API 鉴权问题
  - [x] 检查所有 RPC 函数的鉴权状态
  - [x] 为 7 个缺少鉴权的函数添加 token 验证
- [x] 创建持久化编译容器
  - [x] 创建 builder-start.bat / builder-stop.bat / builder-shell.bat
  - [x] 创建 build.bat 编译脚本
- [x] 添加 GORM 依赖
  - [x] 添加 gorm.io/gorm 和 gorm.io/driver/postgres
- [x] 创建 GORM 模型文件（按模块分文件）
  - [x] models/admin_user.go
  - [x] models/admin_role.go
  - [x] models/admin_permission.go
  - [x] models/admin_relations.go
- [x] 更新文档
  - [x] 添加 GORM 到技术选型
  - [x] 添加持久化编译容器说明

**Files Created:**

```
server/builder-start.bat        # 启动编译容器
server/builder-stop.bat         # 停止编译容器
server/builder-shell.bat        # 进入编译容器
server/build.bat                # 编译脚本
server/database/database.go     # GORM 初始化
server/models/admin_user.go     # 管理员用户模型
server/models/admin_role.go     # 角色模型
server/models/admin_permission.go  # 权限模型
server/models/admin_relations.go   # 关联表模型
```

**Files Updated:**

```
server/modules/admin/admin.go   # 添加鉴权检查
server/go.mod                   # 添加 GORM 依赖
docs/server/00_OVERVIEW.md      # 添加 GORM、更新目录结构
docs/server/06_TEST_ENVIRONMENT.md  # 添加编译容器说明
docs/admin-web/04_TECH_STACK.md # 添加 GORM
```

**Key Decisions:**

1. 所有管理 API 必须验证 token（除 admin_login 外）
2. 使用持久化编译容器避免每次创建/删除
3. GORM 模型按模块分文件，不合并到一个文件

---

### Session 6: 2026-04-03

**Completed:**

- [x] 修复管理员列表数据显示问题
  - [x] 前端 API 返回数据格式错误（res.data → res）
- [x] 修复管理员编辑时角色不显示问题
  - [x] 新增 admin_get_user_roles / admin_update_user_roles RPC
  - [x] 新增 admin_create_user / admin_update_user / admin_delete_user RPC
- [x] 修复列表操作按钮图标不显示问题
  - [x] 使用 SvgIconVNode 替代 h(Icon, ...) 方式
  - [x] 创建图标使用指南文档
- [x] 修复时间显示格式
  - [x] 使用 dayjs 格式化时间为 YYYY-MM-DD HH:mm:ss

**Files Created:**

```
docs/admin-web/05_ICON_GUIDE.md  # 图标使用指南
```

**Files Updated:**

```
admin-web/src/views/admin/index.vue      # 管理员管理页面
admin-web/src/views/role/index.vue       # 角色管理页面
admin-web/src/views/permission/index.vue  # 权限管理页面
admin-web/src/service/api/admin.ts       # 管理员 API
server/modules/admin/admin.go            # 管理员 RPC 函数
server/go.mod                            # 添加 google/uuid 依赖
docs/admin-web/00_OVERVIEW.md            # 添加时间格式规范
```

**Key Decisions:**

1. 图标使用：render 函数中使用 `SvgIconVNode`，模板中使用 `<NIcon><Icon /></NIcon>`
2. 时间格式：列表中时间字段统一使用 `dayjs().format('YYYY-MM-DD HH:mm:ss')`
3. API 返回：nakamaRpc 直接返回数据对象，不是 `{ data: [...] }` 格式

---

### Session 5: 2026-04-03

**Completed:**

- [x] 修复管理员菜单父子结构
  - [x] 更新迁移文件 005_fix_admin_menu_routes.sql
  - [x] 创建父子菜单结构：管理员 → 管理员用户/角色管理/权限管理
- [x] 修复中文编码问题
  - [x] 更新迁移文件 007_fix_chinese_encoding.sql
  - [x] 使用 Unicode 转义序列更新数据库中的中文名称
- [x] 修复 home 路由 component 格式
  - [x] 创建迁移文件 006_fix_home_component.sql
- [x] 优化 Go JSON 编码
  - [x] 添加 jsonMarshal 辅助函数，使用 json.Encoder 替代 json.Marshal
  - [x] 设置 SetEscapeHTML(false) 避免字符转义问题

**Files Created:**

```
server/migrations/005_fix_admin_menu_routes.sql  # 修复管理员菜单父子结构
server/migrations/006_fix_home_component.sql     # 修复 home 路由 component 格式
server/migrations/007_fix_chinese_encoding.sql   # 修复中文编码
```

**Files Updated:**

```
server/modules/admin/admin.go  # 优化 JSON 编码，添加 jsonMarshal 辅助函数
```

**Key Decisions:**

1. 管理员菜单采用父子结构：父菜单"管理员"包含三个子菜单
2. 路由命名使用 elegant-router 格式：`adminManagement_user`（用下划线分隔层级）
3. 父菜单 component 为 `layout.base`，子菜单 component 为 `view.xxx`
4. Go JSON 编码使用 json.Encoder 替代 json.Marshal，避免字符转义问题

**Database Verification:**

```
CockroachDB 默认支持 UTF-8 编码，中文数据存储正常：
- home → 仪表盘
- adminManagement → 管理员
- adminManagement_user → 管理员用户
- adminManagement_role → 角色管理
- adminManagement_permission → 权限管理
```

---

### Session 4: 2026-04-03

**Completed:**

- [x] 创建 Nakama 功能模块参考文档
  - [x] docs/server/09_NAKAMA_MODULES.md - 详细列出 Nakama 提供的所有功能模块
  - [x] 包含核心模块、认证、用户、存储、钱包、匹配、匹配器、排行榜等
  - [x] 提供功能选择指南，按功能需求和游戏类型推荐模块
  - [x] 提供模块依赖关系图和最佳实践
- [x] 创建管理员管理页面
  - [x] admin-web/src/views/admin/index.vue - 管理员列表和 CRUD 操作
- [x] 创建角色管理页面
  - [x] admin-web/src/views/role/index.vue - 角色列表、权限配置
- [x] 创建权限管理页面
  - [x] admin-web/src/views/permission/index.vue - 权限列表和 CRUD 操作
- [x] 创建数据库迁移文件
  - [x] server/migrations/004_add_admin_menu.sql - 添加管理员菜单权限
- [x] 更新服务端 admin.go
  - [x] 移除路由过滤逻辑，返回所有权限路由
- [x] 为 admin 用户添加所有管理员菜单权限
  - [x] 数据库迁移文件自动分配权限给超级管理员

**Files Created:**

```
docs/server/09_NAKAMA_MODULES.md          # Nakama 功能模块参考文档
admin-web/src/views/admin/index.vue        # 管理员管理页面
admin-web/src/views/role/index.vue         # 角色管理页面
admin-web/src/views/permission/index.vue    # 权限管理页面
server/migrations/004_add_admin_menu.sql   # 添加管理员菜单的数据库迁移
```

**Files Updated:**

```
server/modules/admin/admin.go              # 移除路由过滤，返回所有权限路由
DEVELOPMENT.md                             # 完善开发流程说明文档
```

**Key Decisions:**

1. 创建 Nakama 功能模块参考文档，帮助开发人员快速选择合适的模块
2. 实现完整的 RBAC 管理界面，包括管理员、角色、权限管理
3. 数据库迁移文件自动为超级管理员分配所有管理员菜单权限
4. 移除服务端路由过滤，让前端根据权限动态显示菜单

**Next Session:**

- 部署更新后的代码
- 验证管理员菜单是否正常显示
- 测试 RBAC 功能

**Completed:**

- [x] 创建 docs/server/ 目录结构
  - [x] 00_OVERVIEW.md - 服务端概述
  - [x] 01_ADMIN_MODULE.md - 管理后台模块
  - [x] 02_BOT_MODULE.md - 机器人模块
  - [x] 03_MATCH_MODULE.md - 匹配模块
  - [x] 04_ARCHITECTURE.md - 架构设计
  - [x] 05_DATABASE_DESIGN.md - 数据库设计
  - [x] 06_TEST_ENVIRONMENT.md - 测试环境配置
  - [x] 07_PROTOCOL_MAPPING.md - 协议映射
- [x] 创建 docs/admin-web/ 目录结构
  - [x] 00_OVERVIEW.md - 管理后台概述
  - [x] 01_AUTH_MODULE.md - 认证模块
  - [x] 02_API_LAYER.md - API 层设计
  - [x] 03_RBAC_SYSTEM.md - RBAC 权限系统
  - [x] 04_TECH_STACK.md - 技术选型详情
- [x] 创建 docs/old_client/ 目录结构
  - [x] 00_OVERVIEW.md - 老客户端概述
  - [x] 01_OLD_CODE_INDEX.md - 老代码索引
  - [x] api/ - HTTP API 协议分析（从 docs/api/ 移动）
  - [x] ws/ - WebSocket 协议分析（从 docs/ws/ 移动）
- [x] 删除已整合的旧文档
  - [x] docs/01_TECH_STACK.md
  - [x] docs/02_ARCHITECTURE.md
  - [x] docs/03_DATA_MIGRATION.md
  - [x] docs/04_API_PROTOCOL.md
  - [x] docs/05_WS_PROTOCOL.md
  - [x] docs/06_PROTOCOL_MAPPING.md
  - [x] docs/08_DATABASE_DESIGN.md
  - [x] docs/10_TEST_ENVIRONMENT.md
  - [x] docs/OLD_CODE_INDEX.md
- [x] 更新 README.md 文档索引
- [x] 更新 docs/00_OVERVIEW.md
- [x] 更新 task_plan.md
- [x] 更新 findings.md

**Files Created:**

```
docs/
├── server/
│   ├── 00_OVERVIEW.md
│   ├── 01_ADMIN_MODULE.md
│   ├── 02_BOT_MODULE.md
│   ├── 03_MATCH_MODULE.md
│   ├── 04_ARCHITECTURE.md
│   ├── 05_DATABASE_DESIGN.md
│   ├── 06_TEST_ENVIRONMENT.md
│   └── 07_PROTOCOL_MAPPING.md
├── admin-web/
│   ├── 00_OVERVIEW.md
│   ├── 01_AUTH_MODULE.md
│   ├── 02_API_LAYER.md
│   ├── 03_RBAC_SYSTEM.md
│   └── 04_TECH_STACK.md
└── old_client/
    ├── 00_OVERVIEW.md
    ├── 01_OLD_CODE_INDEX.md
    ├── api/  (moved from docs/api/)
    └── ws/   (moved from docs/ws/)
```

**Files Deleted:**

```
docs/
├── 01_TECH_STACK.md
├── 02_ARCHITECTURE.md
├── 03_DATA_MIGRATION.md
├── 04_API_PROTOCOL.md
├── 05_WS_PROTOCOL.md
├── 06_PROTOCOL_MAPPING.md
├── 08_DATABASE_DESIGN.md
├── 10_TEST_ENVIRONMENT.md
└── OLD_CODE_INDEX.md
```

**Key Decisions:**

1. 文档按子项目组织：server、admin-web、old_client
2. 每个子项目目录有独立的 00_OVERVIEW.md 作为入口
3. 文档命名格式：`NN_模块名称.md`（NN 为序号）
4. 删除已整合内容的旧文档，避免重复

**Next Session:**

- 继续完善 Admin API 接口开发
- 实现用户管理接口

---

### Session 2: 2026-04-02

**Completed:**

- [x] 创建旧代码索引文档 (docs/OLD_CODE_INDEX.md)
- [x] 创建项目红线文档 (docs/RED_LINES.md)
- [x] 更新 README.md 文档索引
- [x] 废弃 docs/07_TASK_PLAN.md，改用 planning-with-files 技能
- [x] 重新规划开发计划（渐进式开发策略）
- [x] **修正文档一致性**：更新 01_TECH_STACK.md 和 00_OVERVIEW.md，统一使用 Nakama + 翻译层方案

**Files Created:**

```
docs/
├── OLD_CODE_INDEX.md   # 旧代码索引（AI 参考）
└── RED_LINES.md        # 项目红线文档
```

**Files Updated:**

```
docs/
├── 00_OVERVIEW.md      # 更新为 Nakama + 翻译层方案
└── 01_TECH_STACK.md    # 移除"不使用 Nakama"，改为使用 Nakama
```

**Files Deleted:**

```
docs/07_TASK_PLAN.md    # 已废弃，改用 task_plan.md
```

**Key Decisions:**

1. 采用 planning-with-files 技能管理任务计划
2. 核心文档优先级：task_plan.md → findings.md → progress.md → 架构文档
3. **开发策略调整**：渐进式开发，风险可控
   - 管理后台优先（低风险）
   - API 翻译层次之（中风险）
   - 非游戏功能测试验证
   - 游戏逻辑迁移（高风险）
   - 客户端重构（最后一步）
4. **Nakama + 翻译层方案确认**：
   - Nakama 已处理状态同步、并发控制、房间管理
   - 主要工作是读懂老代码，设计翻译层
   - 游戏逻辑迁移风险实际可控
5. **翻译器架构决策**：翻译器作为 Nakama 内置模块（`adapter/`），而非独立服务
   - ✅ 单一服务，部署简单
   - ✅ 无额外网络延迟
   - ✅ 新客户端重构后，删除 `adapter/` 目录即可
6. **Admin 后台模板选型**：SoybeanAdmin + NaiveUI
   - ✅ 性能最优、体积最小（~300KB）
   - ✅ 移动端完美适配
   - ✅ 动画简洁、专业感强
   - Admin 与 Agent 后台独立部署
7. **用户系统设计**：
   - Admin 用户独立 `admins` 表
   - 用户与代理同 `users` 表，通过 `is_agent` 字段区分
   - Admin 后台可平滑设置用户为代理
   - 代理拥有专属邀请码，可登录代理后台
8. **RBAC 权限系统设计**：
   - 完整的角色-权限管理
   - 表结构：`roles` + `permissions` + `role_permissions` + `admin_roles`
   - 预设角色：super_admin, admin, operator, finance, customer_service, agent_manager
   - 权限分组：dashboard, user, agent, game, finance, system
   - 前端路由守卫 + 按钮级权限控制

**New Phase Plan:**

```
Phase 1: 基础设施搭建
Phase 2: Admin 管理后台 Web
Phase 3: Admin API 接口
Phase 4: Storage Schema 定义
Phase 5: 客户端 API 翻译层
Phase 6: 客户端 WebSocket 翻译层
Phase 7: 非游戏功能测试 ← 验收通过
Phase 8: 游戏逻辑迁移
Phase 9: 游戏功能测试 ← 验收通过
Phase 10: 客户端重构
```

---

### Session 1: 2026-04-02

**Completed:**

- [x] 确定技术方案：Nakama + 协议翻译层
- [x] 创建架构文档 (02_ARCHITECTURE.md)
- [x] 创建协议映射表 (06_PROTOCOL_MAPPING.md)
- [x] 创建任务计划 (07_TASK_PLAN.md)
- [x] 创建文档索引 (00_INDEX.md)
- [x] 创建 planning-with-files 规划文件

**Files Created:**

```
refactor-docs/
├── 00_INDEX.md
├── 02_ARCHITECTURE.md
├── 06_PROTOCOL_MAPPING.md
├── 07_TASK_PLAN.md
└── api/*.md, ws/*.md

game-server/
├── task_plan.md
├── findings.md
└── progress.md
```

**Key Decisions:**

1. 采用 Nakama 3.x 作为游戏服务器框架
2. 使用协议翻译层兼容老客户端
3. 德州扑克 OpCode 范围: 100-149/200-249

**Next Session:**

- 创建项目目录结构
- 配置 docker-compose.yml
- 初始化 Go Module

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| (none yet) | - | - |

---

## Blockers

| Blocker | Status | Resolution |
|---------|--------|------------|
| (none yet) | - | - |

---

## Notes

- 所有协议映射必须遵循 `06_PROTOCOL_MAPPING.md`
- 每完成一个 Phase 必须更新 `task_plan.md`
- 发现新信息必须记录到 `findings.md`
