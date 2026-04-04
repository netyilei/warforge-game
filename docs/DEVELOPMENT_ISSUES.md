# 开发问题记录

> 记录开发过程中遇到的频发问题、原因分析和解决方案
>
> 创建日期：2026-04-04

---

## 问题索引

| 编号 | 问题类型 | 问题描述 | 严重程度 |
|------|----------|----------|----------|
| P001 | 路由 | 登录后跳转 404 | 高 |
| P002 | 路由 | 菜单点击无反应 | 高 |
| P003 | 数据库 | NULL 值转换失败 | 中 |
| P004 | 数据库 | 迁移脚本编码错误 | 中 |
| P005 | 权限 | 权限层级显示混乱 | 中 |
| P006 | API | 404 接口不存在 | 高 |
| P007 | API | 502 Bad Gateway | 高 |
| P008 | 类型 | TypeScript 类型错误 | 低 |
| P009 | 组件 | 图标不显示 | 低 |
| P010 | SQL | SQL 写在 Handler 中 | 高 |

---

## 详细问题记录

### P001：登录后跳转 404

**发现时间**：2026-04-04

**问题现象**：
用户登录成功后，自动跳转到 404 页面，无法进入系统。

**根本原因**：
首页路由的 `component` 配置错误。数据库中 home 路由的 component 设置为 `layout.base.home`，但前端需要的是 `layout.base$view.home` 格式。

**解决方案**：
```sql
UPDATE admin_permissions 
SET component = 'layout.base$view.home' 
WHERE code = 'home';
```

**预防措施**：
- 新增菜单时，严格按照组件路径格式配置
- 一级菜单（有子菜单）：`layout.base`
- 二级菜单：`view.{路由名}`
- 首页特殊处理：`layout.base$view.home`

---

### P002：菜单点击无反应

**发现时间**：2026-04-04

**问题现象**：
点击左侧菜单项后，页面无任何变化，控制台报错：`No match for {"name":"xxx","params":{}}`

**根本原因**：
前端路由名称与数据库权限 code 不匹配。数据库中使用了 `admin_list`，但前端路由名称可能是 `admin-list` 或其他。

**解决方案**：
1. 检查 `src/router/elegant/routes.ts` 中的路由名称
2. 更新数据库权限 code 使其与前端一致：
```sql
UPDATE admin_permissions SET code = 'admin_list' WHERE code = 'admin-list';
```

**预防措施**：
- 路由命名统一使用下划线分隔：`storage_config`
- 禁止使用冒号：`storage:config`
- 新增菜单前，先确认前端路由名称

---

### P003：数据库 NULL 值转换失败

**发现时间**：2026-04-04

**问题现象**：
API 返回 500 错误，日志显示：`sql: Scan error on column index 5, name "path": converting NULL to string is unsupported`

**根本原因**：
数据库字段值为 NULL，但 Go 结构体使用了非指针类型的 string 字段，无法接收 NULL 值。

**解决方案**：
```go
// 错误写法
type Permission struct {
    Path string  // 无法接收 NULL
}

// 正确写法
type Permission struct {
    Path *string  // 使用指针类型
}

// 或使用 sql.NullString
type Permission struct {
    Path sql.NullString
}
```

**预防措施**：
- 所有可能为 NULL 的数据库字段，在 Go 结构体中使用指针类型
- 扫描时使用 `sql.NullString` 处理

---

### P004：迁移脚本编码错误

**发现时间**：2026-04-04

**问题现象**：
执行迁移脚本时报错：`syntax error at or near "emojione"`

**根本原因**：
PowerShell 的 `Get-Content` 管道传输可能导致 UTF-8 编码问题，中文字符和特殊字符被错误解析。

**解决方案**：
```powershell
# 错误方式：直接管道传输
Get-Content d:\geme\server\migrations\000_init_complete.sql | docker exec -i dev_cockroach cockroach sql --insecure -d nakama

# 正确方式：使用 docker cp
docker cp d:\geme\server\migrations\000_init_complete.sql dev_cockroach:/tmp/migration.sql
docker exec dev_cockroach cockroach sql --insecure -d nakama -f /tmp/migration.sql
```

**预防措施**：
- 执行包含中文或特殊字符的 SQL 脚本时，使用 `docker cp` 方式
- 避免通过 PowerShell 管道传输

---

### P005：权限层级显示混乱

**发现时间**：2026-04-04

**问题现象**：
权限管理列表中，"查看记录"、"查看配置"等权限显示在错误的父级下，层级关系不清晰。

**根本原因**：
数据库中 `parent_id` 设置不正确，没有正确反映菜单层级关系。

**解决方案**：
```sql
-- 将 storage_config 移到 storage 下
UPDATE admin_permissions 
SET parent_id = (SELECT id FROM admin_permissions WHERE code = 'storage')
WHERE code = 'storage_config';

-- 将 storage_records 移到 storage 下
UPDATE admin_permissions 
SET parent_id = (SELECT id FROM admin_permissions WHERE code = 'storage')
WHERE code = 'storage_records';
```

**预防措施**：
- 新增子菜单时，确保 `parent_id` 指向正确的父菜单
- 使用 `sort_order` 字段控制同级菜单的显示顺序

---

### P006：404 接口不存在

**发现时间**：2026-04-04

**问题现象**：
前端调用 API 返回 404 错误，提示"获取语言列表失败"、"获取Banner列表失败"等。

**根本原因**：
后端路由未注册或路径配置错误。

**解决方案**：
1. 在 `server/webadmin/routes.go` 中注册路由：
```go
r.GET("/languages", handlers.GetLanguages)
r.GET("/banners", handlers.GetBanners)
```

2. 确保前端 API 路径与后端一致

**预防措施**：
- 新增功能模块时，同步添加后端路由和 Handler
- 使用统一的 API 响应格式：`{code, msg, data}`

---

### P007：502 Bad Gateway

**发现时间**：2026-04-04

**问题现象**：
访问存储相关 API 返回 502 错误。

**根本原因**：
1. 后端服务未启动
2. 代理配置错误
3. `.env` 文件 JSON 格式错误

**解决方案**：
1. 确认后端服务运行中
2. 检查 `.env` 文件中的代理配置：
```
VITE_SERVICE_PROXY_PATTERN=/proxy-default
VITE_BACKEND_PROXY_URL=http://localhost:9528
```

**预防措施**：
- 开发前确认后端服务已启动
- 修改 `.env` 文件后重启前端服务

---

### P008：TypeScript 类型错误

**发现时间**：2026-04-04

**问题现象**：
编译时报错：`类型"Permission"上不存在属性"sortOrder"`

**根本原因**：
接口定义缺少属性，或类型转换不正确。

**解决方案**：
```typescript
// 添加缺失的属性
interface Permission {
  id: string;
  name: string;
  code: string;
  sortOrder: number;  // 添加缺失的属性
}

// 类型转换使用双重断言
const permission = treeOption as unknown as Permission;
```

**预防措施**：
- 保持接口定义与后端数据结构一致
- 使用 `as unknown as TargetType` 进行类型断言

---

### P009：图标不显示

**发现时间**：2026-04-04

**问题现象**：
菜单图标或页面图标显示为空白或乱码。

**根本原因**：
图标名称格式错误，Iconify 无法识别。

**解决方案**：
- 使用正确的 Iconify 图标格式：`{集合名}:{图标名}`
- 常用图标集合：
  - Material Design: `mdi:home`
  - Carbon: `carbon:user`
  - Emoji One: `emojione:flag-for-china`

**预防措施**：
- 使用 Iconify 官网搜索图标：https://icon-sets.iconify.design/
- 参考 [图标使用指南](./admin-web/05_ICON_GUIDE.md)

---

### P010：SQL 写在 Handler 中

**发现时间**：2026-04-04

**问题现象**：
Handler 文件中直接编写 SQL 语句，违反项目架构规范。

**根本原因**：
开发时为图方便，未遵循分层架构原则。

**解决方案**：
```go
// 错误：在 Handler 中写 SQL
func GetUserRoutes(c *gin.Context) {
    rows, err := db.Query(`SELECT * FROM admin_permissions...`)
}

// 正确：调用 Model 方法
func GetUserRoutes(c *gin.Context) {
    permissions, err := models.AdminPermission{}.GetMenusByUserID(db, userID)
}
```

**预防措施**：
- 遵循红线规则：SQL 必须封装在 Model 中
- Code Review 时检查 SQL 位置

---

## 问题统计

| 类型 | 数量 | 占比 |
|------|------|------|
| 路由相关 | 2 | 20% |
| 数据库相关 | 2 | 20% |
| API 相关 | 2 | 20% |
| 权限相关 | 1 | 10% |
| 类型相关 | 1 | 10% |
| 组件相关 | 1 | 10% |
| 架构相关 | 1 | 10% |

---

## 经验总结

### 开发流程建议

1. **新增功能模块前**：
   - 先创建前端页面，确认路由名称
   - 再配置数据库权限，确保 code 与路由名称一致
   - 最后实现后端 Handler 和 Model

2. **数据库操作**：
   - 使用 `docker cp` 方式执行迁移脚本
   - 所有 SQL 封装在 Model 文件中
   - NULL 字段使用指针类型

3. **路由配置**：
   - 使用下划线分隔命名
   - 组件路径格式要正确
   - 确保 parent_id 正确

4. **代码规范**：
   - 遵循红线规则
   - 统一 API 响应格式
   - 保持前后端命名一致
