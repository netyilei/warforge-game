# WarForge 数据库表设计文档

> 本文档介绍 WarForge 项目自定义数据库表的结构和用途。所有自定义表使用 `wf_` 前缀，避免与 Nakama 系统表冲突。

---

## 概述

### 数据库信息

| 项目 | 值 |
|------|-----|
| 数据库类型 | CockroachDB |
| 数据库名称 | nakama |
| 表名前缀 | wf_ |
| 迁移脚本 | `server/migrations/001_complete_schema.sql` |

### 表命名规范

- **wf_** 前缀：WarForge 自定义表
- **Nakama 原生表**：无前缀（如 users, storage, message 等）

---

## 表结构总览

### 核心管理表

| 表名 | 用途 | 关联 |
|------|------|------|
| [wf_admin_users](#1-wf_admin_users) | 管理员用户 | - |
| [wf_admin_roles](#2-wf_admin_roles) | 管理员角色 | - |
| [wf_admin_permissions](#3-wf_admin_permissions) | 权限/菜单 | - |
| [wf_admin_user_roles](#4-wf_admin_user_roles) | 用户-角色关联 | wf_admin_users, wf_admin_roles |
| [wf_admin_role_permissions](#5-wf_admin_role_permissions) | 角色-权限关联 | wf_admin_roles, wf_admin_permissions |
| [wf_admin_operation_logs](#6-wf_admin_operation_logs) | 操作日志 | wf_admin_users |
| [wf_admin_settings](#7-wf_admin_settings) | 管理后台设置 | - |

### 业务数据表

| 表名 | 用途 | 关联 |
|------|------|------|
| [wf_languages](#8-wf_languages) | 语言配置 | - |
| [wf_user_profiles](#9-wf_user_profiles) | 用户档案 | Nakama users |
| [wf_content_categories](#10-wf_content_categories) | 内容分类 | 自关联 |
| [wf_contents](#11-wf_contents) | 内容主表 | wf_content_categories |
| [wf_content_translations](#12-wf_content_translations) | 内容翻译 | wf_contents |
| [wf_banner_groups](#13-wf_banner_groups) | Banner分组 | - |
| [wf_banners](#14-wf_banners) | Banner项目 | wf_banner_groups |
| [wf_banner_translations](#15-wf_banner_translations) | Banner翻译 | wf_banners |

### 系统配置表

| 表名 | 用途 | 关联 |
|------|------|------|
| [wf_email_configs](#16-wf_email_configs) | 邮件服务器配置 | - |
| [wf_email_templates](#17-wf_email_templates) | 邮件模板 | - |
| [wf_storage_configs](#18-wf_storage_configs) | 存储配置 | - |
| [wf_upload_records](#19-wf_upload_records) | 上传记录 | wf_storage_configs |
| [wf_system_settings](#20-wf_system_settings) | 系统设置 | - |

---

## 详细表结构

### 1. wf_admin_users

管理员用户表，存储后台管理系统的用户信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | UNIQUE NOT NULL | 用户名 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| salt | VARCHAR(64) | DEFAULT '' | 盐值（已废弃） |
| nickname | VARCHAR(100) | - | 昵称 |
| email | VARCHAR(255) | - | 邮箱 |
| phone | VARCHAR(20) | - | 手机号 |
| avatar | VARCHAR(500) | - | 头像URL |
| status | SMALLINT | DEFAULT 1 | 状态: 1=启用, 0=禁用 |
| last_login_at | TIMESTAMP | - | 最后登录时间 |
| last_login_ip | VARCHAR(45) | - | 最后登录IP |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_admin_users_username` - 用户名索引
- `idx_wf_admin_users_status` - 状态索引
- `idx_wf_admin_users_deleted` - 软删除索引

---

### 2. wf_admin_roles

管理员角色表，定义角色信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 角色ID |
| name | VARCHAR(50) | NOT NULL | 角色名称 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 角色代码 |
| description | VARCHAR(255) | - | 角色描述 |
| status | SMALLINT | DEFAULT 1 | 状态: 1=启用, 0=禁用 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_admin_roles_code` - 角色代码索引
- `idx_wf_admin_roles_status` - 状态索引

**默认数据**：

- 超级管理员 (super_admin) - ID: `00000000-0000-0000-0000-000000000001`

---

### 3. wf_admin_permissions

权限表，同时承担菜单管理功能。通过 `type` 字段区分菜单和按钮权限。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 权限ID |
| name | VARCHAR(100) | NOT NULL | 权限名称 |
| code | VARCHAR(100) | UNIQUE NOT NULL | 权限代码 |
| type | VARCHAR(20) | NOT NULL | 类型: menu/button/api |
| parent_id | UUID | - | 父级ID |
| path | VARCHAR(255) | - | 路由路径 |
| component | VARCHAR(255) | - | 组件路径 |
| icon | VARCHAR(100) | - | 图标 |
| href | VARCHAR(500) | - | 外部链接 |
| show_in_menu | BOOLEAN | DEFAULT TRUE | 是否在菜单中显示 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| status | SMALLINT | DEFAULT 1 | 状态: 1=启用, 0=禁用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_admin_permissions_code` - 权限代码索引
- `idx_wf_admin_permissions_type` - 类型索引
- `idx_wf_admin_permissions_parent` - 父级索引

**默认菜单结构**：

```
├── 首页 (home)
├── 用户管理 (user)
│   ├── 用户列表 (user_manage)
│   └── 用户审核 (user_approval)
├── 内容管理 (content)
│   ├── 内容分类 (content_category)
│   ├── 内容列表 (content_list)
│   └── Banner管理 (content_banner)
├── 运营管理 (operations)
│   └── 操作日志 (operations_log)
├── 客服管理 (support)
│   └── 发送邮件 (support_send_email)
├── 系统管理 (admin)
│   ├── 管理员列表 (admin_list)
│   ├── 角色管理 (admin_role)
│   └── 权限管理 (admin_permission)
├── 存储管理 (storage)
│   ├── 存储配置 (storage_config)
│   └── 上传记录 (storage_records)
└── 系统设置 (settings)
    ├── 语言设置 (settings_language)
    ├── 邮件配置 (settings_email)
    └── 用户设置 (settings_user)
```

---

### 4. wf_admin_user_roles

用户-角色关联表，多对多关系。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | UUID | NOT NULL, FK | 用户ID |
| role_id | UUID | NOT NULL, FK | 角色ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**主键**：`(user_id, role_id)`

**外键**：

- `user_id` → `wf_admin_users(id)` ON DELETE CASCADE
- `role_id` → `wf_admin_roles(id)` ON DELETE CASCADE

---

### 5. wf_admin_role_permissions

角色-权限关联表，多对多关系。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| role_id | UUID | NOT NULL, FK | 角色ID |
| permission_id | UUID | NOT NULL, FK | 权限ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**主键**：`(role_id, permission_id)`

**外键**：

- `role_id` → `wf_admin_roles(id)` ON DELETE CASCADE
- `permission_id` → `wf_admin_permissions(id)` ON DELETE CASCADE

---

### 6. wf_admin_operation_logs

管理员操作日志表，记录所有管理操作。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 日志ID |
| user_id | UUID | FK | 操作用户ID |
| username | VARCHAR(50) | - | 操作用户名 |
| action | VARCHAR(100) | NOT NULL | 操作类型 |
| target_type | VARCHAR(50) | - | 操作对象类型 |
| target_id | VARCHAR(100) | - | 操作对象ID |
| details | JSONB | - | 操作详情 |
| ip | VARCHAR(45) | - | 操作IP |
| user_agent | VARCHAR(500) | - | 用户代理 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**：

- `idx_wf_admin_operation_logs_user` - 用户索引
- `idx_wf_admin_operation_logs_action` - 操作类型索引
- `idx_wf_admin_operation_logs_time` - 时间索引

**常见操作类型**：

- `login` - 登录
- `logout` - 登出
- `create` - 创建
- `update` - 更新
- `delete` - 删除

---

### 7. wf_admin_settings

管理后台设置表，键值对存储。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| key | VARCHAR(100) | PRIMARY KEY | 设置键 |
| value | TEXT | - | 设置值 |
| description | VARCHAR(255) | - | 设置描述 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

---

### 8. wf_languages

语言配置表，支持多语言系统。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 语言ID |
| code | VARCHAR(10) | UNIQUE NOT NULL | 语言代码 (如 zh-CN) |
| name | VARCHAR(50) | NOT NULL | 语言名称 (英文) |
| native_name | VARCHAR(50) | NOT NULL | 本地名称 |
| icon | VARCHAR(100) | - | 图标 (emoji flag) |
| status | SMALLINT | DEFAULT 1 | 状态: 1=启用, 0=禁用 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认语言 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：

- `idx_wf_languages_code` - 语言代码索引
- `idx_wf_languages_status` - 状态索引

**默认语言** (20种)：

- 简体中文 (zh-CN) - 默认
- 繁體中文 (zh-TW)
- English (en-US)
- 日本語 (ja-JP)
- 한국어 (ko-KR)
- 等...

---

### 9. wf_user_profiles

用户档案表，存储游戏玩家的扩展信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 档案ID |
| user_id | VARCHAR(100) | UNIQUE NOT NULL | Nakama用户ID |
| nickname | VARCHAR(100) | - | 昵称 |
| avatar | VARCHAR(500) | - | 头像URL |
| phone | VARCHAR(20) | - | 手机号 |
| email | VARCHAR(255) | - | 邮箱 |
| real_name | VARCHAR(50) | - | 真实姓名 |
| id_card | VARCHAR(20) | - | 身份证号 |
| id_card_verified | BOOLEAN | DEFAULT FALSE | 身份证是否验证 |
| status | INT | DEFAULT 1 | 状态: 1=正常, 0=禁用 |
| approval_status | INT | DEFAULT 0 | 审核状态: 0=待审核, 1=通过, 2=拒绝 |
| approval_note | VARCHAR(500) | - | 审核备注 |
| approved_by | UUID | - | 审核人ID |
| approved_at | TIMESTAMP | - | 审核时间 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**索引**：

- `idx_wf_user_profiles_user` - 用户ID索引
- `idx_wf_user_profiles_status` - 状态索引
- `idx_wf_user_profiles_approval` - 审核状态索引

---

### 10. wf_content_categories

内容分类表，支持多级分类。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 分类ID |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 分类代码 |
| icon | VARCHAR(255) | - | 图标 |
| parent_id | UUID | FK | 父级分类ID |
| content_type | VARCHAR(50) | DEFAULT 'article' | 内容类型 |
| description | VARCHAR(500) | - | 描述 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| status | SMALLINT | DEFAULT 1 | 状态: 1=启用, 0=禁用 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_content_categories_code` - 分类代码索引
- `idx_wf_content_categories_parent` - 父级索引

**内容类型**：

- `article` - 文章
- `notice` - 公告
- `news` - 新闻

---

### 11. wf_contents

内容主表，存储文章、公告等内容。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 内容ID |
| category_id | UUID | NOT NULL, FK | 分类ID |
| author_id | UUID | - | 作者ID |
| cover_image | VARCHAR(500) | - | 封面图片 |
| is_marquee | BOOLEAN | DEFAULT FALSE | 是否跑马灯 |
| is_popup | BOOLEAN | DEFAULT FALSE | 是否弹窗 |
| start_time | TIMESTAMP | - | 开始时间 |
| end_time | TIMESTAMP | - | 结束时间 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| status | SMALLINT | DEFAULT 1 | 状态: 1=发布, 0=草稿 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_contents_category` - 分类索引
- `idx_wf_contents_status` - 状态索引
- `idx_wf_contents_marquee` - 跑马灯索引
- `idx_wf_contents_popup` - 弹窗索引

---

### 12. wf_content_translations

内容多语言翻译表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 翻译ID |
| content_id | UUID | NOT NULL, FK | 内容ID |
| lang | VARCHAR(10) | NOT NULL | 语言代码 |
| title | VARCHAR(255) | NOT NULL | 标题 |
| summary | TEXT | - | 摘要 |
| content | TEXT | - | 内容 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**唯一约束**：`(content_id, lang)`

**索引**：

- `idx_wf_content_translations_content` - 内容索引
- `idx_wf_content_translations_lang` - 语言索引

---

### 13. wf_banner_groups

Banner分组表，管理不同位置的Banner。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 分组ID |
| name | VARCHAR(100) | NOT NULL | 分组名称 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 分组代码 |
| description | VARCHAR(255) | - | 描述 |
| width | INT | DEFAULT 1200 | 宽度 |
| height | INT | DEFAULT 400 | 高度 |
| status | SMALLINT | DEFAULT 1 | 状态 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**默认分组**：

- `home_top` - 首页顶部 (1200x400)
- `home_middle` - 首页中部 (800x200)
- `login_page` - 登录页面 (1920x1080)
- `sidebar` - 侧边栏 (300x250)
- `popup` - 弹窗广告 (600x400)

---

### 14. wf_banners

Banner项目表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | BannerID |
| group_id | UUID | NOT NULL, FK | 分组ID |
| image_url | VARCHAR(500) | NOT NULL | 图片URL |
| link_url | VARCHAR(500) | - | 跳转链接 |
| link_target | VARCHAR(20) | DEFAULT '_blank' | 链接目标 |
| is_external | BOOLEAN | DEFAULT FALSE | 是否外部链接 |
| extra_data | JSONB | - | 自定义参数 |
| start_time | TIMESTAMP | - | 开始时间 |
| end_time | TIMESTAMP | - | 结束时间 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| status | SMALLINT | DEFAULT 1 | 状态 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_banners_group` - 分组索引
- `idx_wf_banners_status` - 状态索引

---

### 15. wf_banner_translations

Banner多语言翻译表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 翻译ID |
| banner_id | UUID | NOT NULL, FK | BannerID |
| lang | VARCHAR(10) | NOT NULL | 语言代码 |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | VARCHAR(500) | - | 内容 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**唯一约束**：`(banner_id, lang)`

---

### 16. wf_email_configs

邮件服务器配置表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 配置ID |
| name | VARCHAR(100) | NOT NULL | 配置名称 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 配置代码 |
| protocol | VARCHAR(20) | DEFAULT 'smtp' | 协议 |
| host | VARCHAR(255) | NOT NULL | 服务器地址 |
| port | INT | NOT NULL | 端口 |
| username | VARCHAR(255) | NOT NULL | 用户名 |
| password | VARCHAR(255) | - | 密码 |
| encryption | VARCHAR(20) | DEFAULT 'tls' | 加密方式 |
| from_name | VARCHAR(100) | - | 发件人名称 |
| from_email | VARCHAR(255) | NOT NULL | 发件人邮箱 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认 |
| status | SMALLINT | DEFAULT 1 | 状态 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**索引**：

- `idx_wf_email_configs_code` - 代码索引
- `idx_wf_email_configs_status` - 状态索引
- `idx_wf_email_configs_default` - 默认索引

---

### 17. wf_email_templates

邮件模板表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 模板ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| code | VARCHAR(50) | UNIQUE NOT NULL | 模板代码 |
| subject | VARCHAR(255) | NOT NULL | 邮件主题 |
| content_type | VARCHAR(20) | DEFAULT 'html' | 内容类型 |
| content | TEXT | NOT NULL | 模板内容 |
| description | VARCHAR(500) | - | 描述 |
| variables | JSONB | - | 变量说明 |
| status | SMALLINT | DEFAULT 1 | 状态 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMP | - | 软删除时间 |

**默认模板**：

- `verification_code` - 注册验证码
- `password_reset` - 密码重置
- `welcome` - 欢迎邮件
- `notice` - 系统通知
- `bind_email` - 绑定邮箱验证

---

### 18. wf_storage_configs

存储配置表，支持多种云存储服务。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 配置ID |
| name | VARCHAR(100) | NOT NULL | 配置名称 |
| driver | VARCHAR(20) | NOT NULL | 存储驱动 |
| bucket | VARCHAR(100) | NOT NULL | 存储桶 |
| endpoint | VARCHAR(255) | - | 端点地址 |
| region | VARCHAR(50) | DEFAULT 'auto' | 区域 |
| access_key | VARCHAR(255) | NOT NULL | 访问密钥 |
| secret_key | VARCHAR(255) | NOT NULL | 密钥 |
| public_domain | VARCHAR(255) | - | 公开域名 |
| max_file_size | BIGINT | DEFAULT 10485760 | 最大文件大小 |
| allowed_types | VARCHAR(500) | - | 允许的文件类型 |
| is_default | BOOLEAN | DEFAULT FALSE | 是否默认 |
| status | SMALLINT | DEFAULT 1 | 状态 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**支持的存储驱动**：

- `cloudflare` - Cloudflare R2
- `aws` - Amazon S3
- `minio` - MinIO
- `digitalocean` - DigitalOcean Spaces
- `backblaze` - Backblaze B2
- `wasabi` - Wasabi

---

### 19. wf_upload_records

上传记录表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 记录ID |
| user_id | VARCHAR(100) | NOT NULL | 用户ID |
| user_type | VARCHAR(20) | NOT NULL | 用户类型 |
| original_name | VARCHAR(255) | - | 原始文件名 |
| file_path | VARCHAR(500) | NOT NULL | 文件路径 |
| file_size | BIGINT | - | 文件大小 |
| mime_type | VARCHAR(100) | - | MIME类型 |
| storage_id | UUID | FK | 存储配置ID |
| upload_type | VARCHAR(50) | - | 上传类型 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

**索引**：

- `idx_wf_upload_records_user` - 用户索引
- `idx_wf_upload_records_storage` - 存储索引
- `idx_wf_upload_records_time` - 时间索引

**用户类型**：

- `admin` - 管理员
- `player` - 玩家

---

### 20. wf_system_settings

系统设置表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| key | VARCHAR(100) | PRIMARY KEY | 设置键 |
| value | TEXT | - | 设置值 |
| description | VARCHAR(255) | - | 描述 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

**默认设置**：

- `require_registration_approval` - 用户注册是否需要审核
- `require_identity_verification` - 用户注册是否需要证件核实

---

## ER 关系图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ wf_admin_users  │────<│wf_admin_user_   │>────│  wf_admin_roles │
└─────────────────┘     │     roles       │     └─────────────────┘
        │               └─────────────────┘              │
        │                                                │
        ▼               ┌─────────────────┐              ▼
┌─────────────────┐     │wf_admin_role_   │     ┌─────────────────┐
│wf_admin_        │<────│  permissions    │>────│wf_admin_        │
│ operation_logs  │     └─────────────────┘     │  permissions    │
└─────────────────┘                             └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│wf_content_      │────<│   wf_contents   │>────│wf_content_      │
│   categories    │     └─────────────────┘     │  translations   │
└─────────────────┘             │               └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │wf_user_profiles │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│wf_banner_groups │────<│   wf_banners    │>────│wf_banner_       │
└─────────────────┘     └─────────────────┘     │  translations   │
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│wf_storage_      │────<│wf_upload_records│
│    configs      │     └─────────────────┘
└─────────────────┘
```

---

## 迁移与维护

### 执行迁移

```bash
# 在项目根目录执行
cd server
$env:DB_HOST="localhost"  # Windows PowerShell
go run tools/migrate_db/main.go migrations/001_complete_schema.sql
```

### 重置数据库

```bash
# 删除所有 wf_ 前缀表并重新创建
docker exec dev_cockroach cockroach sql --insecure -d nakama -e "
  DROP TABLE IF EXISTS wf_email_templates CASCADE;
  DROP TABLE IF EXISTS wf_email_configs CASCADE;
  -- ... 其他表
"
```

### 备份数据

```bash
# 导出数据库
docker exec dev_cockroach cockroach dump nakama --insecure > backup.sql
```

---

## 注意事项

1. **表名前缀**：所有自定义表使用 `wf_` 前缀，避免与 Nakama 系统表冲突
2. **软删除**：大部分表支持软删除，使用 `deleted_at` 字段
3. **多语言**：内容和 Banner 使用独立的翻译表实现多语言支持
4. **权限系统**：权限表同时承担菜单管理功能，通过 `type` 字段区分
5. **数据库连接**：所有工具和迁移脚本必须从配置文件读取数据库连接信息

---

*文档生成时间: 2026-04-05*
