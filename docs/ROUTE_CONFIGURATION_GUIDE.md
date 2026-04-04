# 路由配置指南

> 前后端路由定义规则与格式规范
>
> 创建日期：2026-04-04

---

## 概述

WarForge Admin 采用**动态路由**模式，路由由后端根据用户权限动态生成，前端不再硬编码路由配置。正确配置路由是系统正常运行的关键。

---

## 核心原则

### 1. 前端路由为准

elegant-router 根据文件结构自动生成路由，**数据库菜单必须与前端路由结构保持一致**。

### 2. 命名统一

- 路由名称使用**下划线分隔**
- 禁止使用冒号、横杠等特殊字符
- 前后端命名必须完全一致

### 3. 层级对应

数据库中的 `parent_id` 必须与前端文件目录结构一致。

---

## 前端路由规则

### 文件结构与路由映射

```
src/views/
├── home/
│   └── index.vue              → 路由: home, 路径: /home
├── storage/
│   ├── index.vue              → 路由: storage, 路径: /storage (父级)
│   ├── config/
│   │   └── index.vue          → 路由: storage_config, 路径: /storage/config
│   └── records/
│       └── index.vue          → 路由: storage_records, 路径: /storage/records
└── settings/
    ├── language/
    │   └── index.vue          → 路由: settings_language, 路径: /settings/language
    └── user/
        └── index.vue          → 路由: settings_user, 路径: /settings/user
```

### 路由名称生成规则

| 目录结构 | 路由名称 | 路由路径 |
|----------|----------|----------|
| `views/home/index.vue` | `home` | `/home` |
| `views/storage/index.vue` | `storage` | `/storage` |
| `views/storage/config/index.vue` | `storage_config` | `/storage/config` |
| `views/admin/role/index.vue` | `admin_role` | `/admin/role` |

### 自动生成的路由文件

路由配置自动生成在 `src/router/elegant/routes.ts`：

```typescript
export const generatedRoutes = [
  {
    name: 'home',
    path: '/home',
    component: 'layout.base$view.home',
    meta: {
      title: 'home',
      i18nKey: 'route.home'
    }
  },
  {
    name: 'storage',
    path: '/storage',
    component: 'layout.base',
    meta: {
      title: 'storage',
      i18nKey: 'route.storage'
    },
    children: [
      {
        name: 'storage_config',
        path: '/storage/config',
        component: 'view.storage_config',
        meta: {
          title: 'storage_config',
          i18nKey: 'route.storage_config'
        }
      }
    ]
  }
];
```

---

## 后端数据库配置

### 权限表结构

```sql
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,        -- 菜单显示名称
    code VARCHAR(100) UNIQUE NOT NULL, -- 路由名称（必须与前端一致）
    type VARCHAR(20) NOT NULL,         -- 'menu' 或 'button'
    parent_id UUID,                    -- 父级菜单ID
    path VARCHAR(255),                 -- 路由路径
    component VARCHAR(255),            -- 组件路径
    icon VARCHAR(100),                 -- 图标
    sort_order INT DEFAULT 0,          -- 排序
    status SMALLINT DEFAULT 1          -- 状态
);
```

### 组件路径格式

| 层级 | component 格式 | 说明 | 示例 |
|------|----------------|------|------|
| 一级菜单（有子菜单） | `layout.base` | 只作为容器，不显示内容 | `layout.base` |
| 一级菜单（无子菜单） | `layout.base$view.{name}` | 带布局的页面 | `layout.base$view.home` |
| 二级菜单 | `view.{name}` | 嵌入父级布局 | `view.storage_config` |
| 三级菜单 | `view.{name}` | 嵌入父级布局 | `view.xxx_detail` |

### 配置示例

#### 示例1：首页（一级菜单，无子菜单）

```sql
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('10000000-0000-0000-0000-000000000000', '仪表盘', 'home', 'menu', NULL, '/home', 'layout.base$view.home', 'mdi:home', 1);
```

#### 示例2：存储管理（一级菜单 + 二级子菜单）

```sql
-- 一级菜单
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('85000000-0000-0000-0000-000000000001', '存储管理', 'storage', 'menu', NULL, '/storage', 'layout.base', 'mdi:cloud-upload', 5);

-- 二级菜单：存储配置
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('80000000-0000-0000-0000-000000000003', '存储配置', 'storage_config', 'menu', '85000000-0000-0000-0000-000000000001', '/storage/config', 'view.storage_config', 'carbon:cloud-upload', 1);

-- 二级菜单：上传记录
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('90000000-0000-0000-0000-000000000002', '上传记录', 'storage_records', 'menu', '85000000-0000-0000-0000-000000000001', '/storage/records', 'view.storage_records', 'carbon:document', 2);
```

#### 示例3：系统管理（一级菜单 + 多个二级子菜单）

```sql
-- 一级菜单
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('70000000-0000-0000-0000-000000000100', '系统管理', 'admin', 'menu', NULL, '/admin', 'layout.base', 'mdi:shield-account', 3);

-- 二级菜单：管理员列表
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('20000000-0000-0000-0000-000000000002', '管理员列表', 'admin_list', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/list', 'view.admin_list', 'carbon:user', 1);

-- 二级菜单：角色管理
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('20000000-0000-0000-0000-000000000003', '角色管理', 'admin_role', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/role', 'view.admin_role', 'carbon:user-role', 2);

-- 二级菜单：权限管理
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order) VALUES
('20000000-0000-0000-0000-000000000004', '权限管理', 'admin_permission', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/permission', 'view.admin_permission', 'carbon:locked', 3);
```

---

## 新增菜单流程

### 步骤1：创建前端页面

```bash
# 在 src/views 下创建目录和文件
src/views/
└── new_module/
    ├── index.vue           # 父级页面（可选）
    └── sub_page/
        └── index.vue       # 子页面
```

### 步骤2：等待路由生成

- 重启 dev server 或等待热更新
- 检查 `src/router/elegant/routes.ts` 确认路由已生成

### 步骤3：配置数据库权限

```sql
-- 一级菜单
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('xxx-xxx-xxx', '新模块', 'new_module', 'menu', NULL, '/new_module', 'layout.base', 'mdi:puzzle', 10, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- 二级菜单
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('xxx-xxx-xxx', '子页面', 'new_module_sub_page', 'menu', 'xxx-xxx-xxx', '/new_module/sub_page', 'view.new_module_sub_page', NULL, 1, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, sort_order = EXCLUDED.sort_order;
```

### 步骤4：分配权限

```sql
-- 给超级管理员角色分配权限
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM admin_permissions WHERE code IN ('new_module', 'new_module_sub_page')
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

### 步骤5：刷新前端

重新登录或刷新页面，新菜单应该出现在侧边栏。

---

## 常见错误

### 错误1：路由名称使用冒号

```sql
-- ✗ 错误
code = 'storage:config'

-- ✓ 正确
code = 'storage_config'
```

**后果**：菜单点击无反应，路由无法匹配

### 错误2：组件路径格式错误

```sql
-- ✗ 错误：二级菜单使用了 layout.base
component = 'layout.base'

-- ✓ 正确：二级菜单使用 view.xxx
component = 'view.storage_config'
```

**后果**：页面显示空白或布局错乱

### 错误3：parent_id 设置错误

```sql
-- ✗ 错误：子菜单的 parent_id 指向错误的父级
parent_id = 'settings_id'  -- 实际应该是 storage_id

-- ✓ 正确
parent_id = 'storage_id'
```

**后果**：菜单层级显示错误

### 错误4：首页组件路径错误

```sql
-- ✗ 错误
component = 'layout.base.home'
component = 'view.home'

-- ✓ 正确
component = 'layout.base$view.home'
```

**后果**：登录后跳转 404

---

## 检查清单

新增菜单时，请逐项检查：

- [ ] 前端页面文件已创建
- [ ] 路由已自动生成（检查 routes.ts）
- [ ] 数据库 code 与前端路由名称一致
- [ ] path 与前端路由路径一致
- [ ] component 格式正确
- [ ] parent_id 指向正确的父菜单
- [ ] sort_order 设置合理
- [ ] 已给相关角色分配权限
- [ ] 重新登录测试

---

## 快速参考

### 路由命名规范

| 规则 | 正确示例 | 错误示例 |
|------|----------|----------|
| 使用下划线 | `storage_config` | `storage-config`, `storage:config` |
| 全小写 | `admin_list` | `AdminList`, `adminList` |
| 层级用下划线连接 | `settings_language` | `settings/language` |

### 组件路径速查

| 场景 | component 值 |
|------|--------------|
| 首页 | `layout.base$view.home` |
| 一级菜单（有子菜单） | `layout.base` |
| 二级菜单 | `view.{路由名}` |

### 数据库字段速查

| 字段 | 说明 | 示例 |
|------|------|------|
| `code` | 路由名称，必须唯一 | `storage_config` |
| `name` | 显示名称 | `存储配置` |
| `path` | 路由路径 | `/storage/config` |
| `component` | 组件路径 | `view.storage_config` |
| `parent_id` | 父级ID | `storage 的 UUID` |
| `icon` | 图标 | `mdi:cog` |
| `sort_order` | 排序 | `1` |
