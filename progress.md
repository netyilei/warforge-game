# Progress: 开发进度日志

> 记录每次会话的工作内容，方便恢复上下文

---

## Session Log

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
