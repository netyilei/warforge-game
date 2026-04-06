-- ============================================================
-- WarForge Admin 完整数据库迁移脚本
-- 版本: 002
-- 日期: 2026-04-06
-- 说明: 幂等迁移，可重复执行，不破坏现有数据
-- ============================================================

-- ============================================================
-- Part 1: 核心管理后台表
-- ============================================================

-- 管理员用户表
CREATE TABLE IF NOT EXISTS wf_admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) DEFAULT '',
    nickname VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    status SMALLINT DEFAULT 1,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_users_username ON wf_admin_users(username);
CREATE INDEX IF NOT EXISTS idx_wf_admin_users_status ON wf_admin_users(status);
CREATE INDEX IF NOT EXISTS idx_wf_admin_users_deleted ON wf_admin_users(deleted_at);

COMMENT ON TABLE wf_admin_users IS '管理员用户表';
COMMENT ON COLUMN wf_admin_users.status IS '状态: 1=启用, 0=禁用';

-- 管理员角色表
CREATE TABLE IF NOT EXISTS wf_admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_roles_code ON wf_admin_roles(code);
CREATE INDEX IF NOT EXISTS idx_wf_admin_roles_status ON wf_admin_roles(status);

COMMENT ON TABLE wf_admin_roles IS '管理员角色表';

-- 管理员权限表（同时承担菜单管理功能）
CREATE TABLE IF NOT EXISTS wf_admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    parent_id UUID,
    path VARCHAR(255),
    component VARCHAR(255),
    icon VARCHAR(100),
    href VARCHAR(500),
    show_in_menu BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_permissions_code ON wf_admin_permissions(code);
CREATE INDEX IF NOT EXISTS idx_wf_admin_permissions_type ON wf_admin_permissions(type);
CREATE INDEX IF NOT EXISTS idx_wf_admin_permissions_parent ON wf_admin_permissions(parent_id);

COMMENT ON TABLE wf_admin_permissions IS '管理员权限表(含菜单): type=menu为菜单, type=button为按钮权限';
COMMENT ON COLUMN wf_admin_permissions.type IS '类型: menu=菜单, button=按钮';
COMMENT ON COLUMN wf_admin_permissions.show_in_menu IS '是否在菜单中显示';

-- 添加 api_paths 字段（幂等）
ALTER TABLE wf_admin_permissions ADD COLUMN IF NOT EXISTS api_paths JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN wf_admin_permissions.api_paths IS 'API路径列表，格式: [{"path": "/api/v1/admins", "methods": ["GET", "POST"]}]';

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS wf_admin_user_roles (
    user_id UUID NOT NULL REFERENCES wf_admin_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES wf_admin_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_user_roles_role ON wf_admin_user_roles(role_id);

COMMENT ON TABLE wf_admin_user_roles IS '管理员用户-角色关联表';

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS wf_admin_role_permissions (
    role_id UUID NOT NULL REFERENCES wf_admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES wf_admin_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_role_permissions_permission ON wf_admin_role_permissions(permission_id);

COMMENT ON TABLE wf_admin_role_permissions IS '角色-权限关联表';

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS wf_admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES wf_admin_users(id),
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_admin_operation_logs_user ON wf_admin_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wf_admin_operation_logs_action ON wf_admin_operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_wf_admin_operation_logs_time ON wf_admin_operation_logs(created_at);

COMMENT ON TABLE wf_admin_operation_logs IS '管理员操作日志表';
COMMENT ON COLUMN wf_admin_operation_logs.action IS '操作类型: create/update/delete/login/logout等';
COMMENT ON COLUMN wf_admin_operation_logs.target_type IS '操作对象类型: user/role/permission等';
COMMENT ON COLUMN wf_admin_operation_logs.details IS '操作详情(JSON格式)';

-- 管理后台设置表
CREATE TABLE IF NOT EXISTS wf_admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE wf_admin_settings IS '管理后台设置表';

-- ============================================================
-- Part 2: 语言管理表
-- ============================================================

CREATE TABLE IF NOT EXISTS wf_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    status SMALLINT DEFAULT 1,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_languages_code ON wf_languages(code);
CREATE INDEX IF NOT EXISTS idx_wf_languages_status ON wf_languages(status);

COMMENT ON TABLE wf_languages IS '语言配置表';
COMMENT ON COLUMN wf_languages.code IS '语言代码: zh-CN, en-US等';
COMMENT ON COLUMN wf_languages.is_default IS '是否为默认语言';

-- ============================================================
-- Part 3: 内容管理表
-- ============================================================

-- 内容分类表
CREATE TABLE IF NOT EXISTS wf_content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(255),
    parent_id UUID REFERENCES wf_content_categories(id) ON DELETE SET NULL,
    content_type VARCHAR(50) DEFAULT 'article',
    description VARCHAR(500),
    sort_order INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_content_categories_code ON wf_content_categories(code);
CREATE INDEX IF NOT EXISTS idx_wf_content_categories_parent ON wf_content_categories(parent_id);

COMMENT ON TABLE wf_content_categories IS '内容分类表';
COMMENT ON COLUMN wf_content_categories.content_type IS '内容类型: article=文章, notice=公告, news=新闻';

-- 内容主表
CREATE TABLE IF NOT EXISTS wf_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES wf_content_categories(id) ON DELETE CASCADE,
    author_id UUID,
    cover_image VARCHAR(500),
    is_marquee BOOLEAN DEFAULT FALSE,
    is_popup BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    sort_order INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_contents_category ON wf_contents(category_id);
CREATE INDEX IF NOT EXISTS idx_wf_contents_status ON wf_contents(status);
CREATE INDEX IF NOT EXISTS idx_wf_contents_marquee ON wf_contents(is_marquee);
CREATE INDEX IF NOT EXISTS idx_wf_contents_popup ON wf_contents(is_popup);

COMMENT ON TABLE wf_contents IS '内容主表';
COMMENT ON COLUMN wf_contents.is_marquee IS '是否跑马灯显示';
COMMENT ON COLUMN wf_contents.is_popup IS '是否弹窗显示';

-- 内容翻译表
CREATE TABLE IF NOT EXISTS wf_content_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES wf_contents(id) ON DELETE CASCADE,
    lang VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(content_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_wf_content_translations_content ON wf_content_translations(content_id);
CREATE INDEX IF NOT EXISTS idx_wf_content_translations_lang ON wf_content_translations(lang);

COMMENT ON TABLE wf_content_translations IS '内容多语言翻译表';

-- ============================================================
-- Part 5: Banner管理表
-- ============================================================

-- Banner分组表
CREATE TABLE IF NOT EXISTS wf_banner_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    width INT DEFAULT 1200,
    height INT DEFAULT 400,
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_banner_groups_code ON wf_banner_groups(code);
CREATE INDEX IF NOT EXISTS idx_wf_banner_groups_status ON wf_banner_groups(status);

COMMENT ON TABLE wf_banner_groups IS 'Banner分组表';

-- Banner项目表
CREATE TABLE IF NOT EXISTS wf_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES wf_banner_groups(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    link_target VARCHAR(20) DEFAULT '_blank',
    is_external BOOLEAN DEFAULT FALSE,
    extra_data JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    sort_order INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_banners_group ON wf_banners(group_id);
CREATE INDEX IF NOT EXISTS idx_wf_banners_status ON wf_banners(status);

COMMENT ON TABLE wf_banners IS 'Banner项目表';
COMMENT ON COLUMN wf_banners.is_external IS '是否外部链接';
COMMENT ON COLUMN wf_banners.extra_data IS '自定义参数(JSON格式)';

-- Banner翻译表
CREATE TABLE IF NOT EXISTS wf_banner_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id UUID NOT NULL REFERENCES wf_banners(id) ON DELETE CASCADE,
    lang VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(banner_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_wf_banner_translations_banner ON wf_banner_translations(banner_id);
CREATE INDEX IF NOT EXISTS idx_wf_banner_translations_lang ON wf_banner_translations(lang);

COMMENT ON TABLE wf_banner_translations IS 'Banner多语言翻译表';

-- ============================================================
-- Part 6: 邮件配置表
-- ============================================================

-- 邮件服务器配置表
CREATE TABLE IF NOT EXISTS wf_email_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    protocol VARCHAR(20) DEFAULT 'smtp',
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    encryption VARCHAR(20) DEFAULT 'tls',
    from_name VARCHAR(100),
    from_email VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_email_configs_code ON wf_email_configs(code);
CREATE INDEX IF NOT EXISTS idx_wf_email_configs_status ON wf_email_configs(status);
CREATE INDEX IF NOT EXISTS idx_wf_email_configs_default ON wf_email_configs(is_default);

COMMENT ON TABLE wf_email_configs IS '邮件服务器配置表';
COMMENT ON COLUMN wf_email_configs.encryption IS '加密方式: tls/ssl/none';

-- 邮件模板表
CREATE TABLE IF NOT EXISTS wf_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) DEFAULT 'html',
    content TEXT NOT NULL,
    description VARCHAR(500),
    variables JSONB,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wf_email_templates_code ON wf_email_templates(code);
CREATE INDEX IF NOT EXISTS idx_wf_email_templates_status ON wf_email_templates(status);

COMMENT ON TABLE wf_email_templates IS '邮件模板表';
COMMENT ON COLUMN wf_email_templates.variables IS '模板变量说明(JSON格式)';

-- ============================================================
-- Part 7: 存储配置表
-- ============================================================

CREATE TABLE IF NOT EXISTS wf_storage_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    driver VARCHAR(20) NOT NULL,
    bucket VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    region VARCHAR(50) DEFAULT 'auto',
    access_key VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    custom_url VARCHAR(255),
    public_domain VARCHAR(255),
    max_file_size BIGINT DEFAULT 10485760,
    allowed_types VARCHAR(500),
    is_default BOOLEAN DEFAULT FALSE,
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_storage_configs_driver ON wf_storage_configs(driver);
CREATE INDEX IF NOT EXISTS idx_wf_storage_configs_default ON wf_storage_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_wf_storage_configs_status ON wf_storage_configs(status);

COMMENT ON TABLE wf_storage_configs IS '存储配置表';
COMMENT ON COLUMN wf_storage_configs.driver IS '存储驱动: cloudflare/aws/minio/digitalocean/backblaze/wasabi';
COMMENT ON COLUMN wf_storage_configs.max_file_size IS '最大文件大小(字节), 默认10MB';

-- 上传记录表
CREATE TABLE IF NOT EXISTS wf_upload_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_id UUID REFERENCES wf_storage_configs(id) ON DELETE SET NULL,
    upload_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_upload_records_user ON wf_upload_records(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_wf_upload_records_storage ON wf_upload_records(storage_id);
CREATE INDEX IF NOT EXISTS idx_wf_upload_records_time ON wf_upload_records(created_at);

COMMENT ON TABLE wf_upload_records IS '上传记录表';
COMMENT ON COLUMN wf_upload_records.user_type IS '用户类型: admin/player';
COMMENT ON COLUMN wf_upload_records.upload_type IS '上传类型: avatar/banner/content等';

-- ============================================================
-- Part 8: 系统设置表
-- ============================================================

CREATE TABLE IF NOT EXISTS wf_system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE wf_system_settings IS '系统设置表';

-- ============================================================
-- Part 9: 初始数据
-- ============================================================

-- 默认管理员（密码: admin123）
INSERT INTO wf_admin_users (id, username, password_hash, nickname, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.iW8jY9D6aV3xV9xKCu',
    '管理员',
    1
) ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    nickname = EXCLUDED.nickname,
    status = EXCLUDED.status;

-- 超级管理员角色
INSERT INTO wf_admin_roles (id, name, code, description, status, sort_order)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '超级管理员',
    'super_admin',
    '拥有所有权限',
    1,
    0
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

-- 分配超级管理员角色给admin用户
INSERT INTO wf_admin_user_roles (user_id, role_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- Part 11: 默认权限数据（菜单和按钮）
-- ============================================================

-- 首页菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '10000000-0000-0000-0000-000000000000',
    '首页',
    'home',
    'menu',
    NULL,
    '/home',
    'layout.base$view.home',
    'mdi:home',
    1,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 用户管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '20000000-0000-0000-0000-000000000000',
    '用户管理',
    'user',
    'menu',
    NULL,
    '/user',
    'layout.base',
    'mdi:account-group',
    2,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 用户列表（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '用户列表',
    'user_manage',
    'menu',
    '20000000-0000-0000-0000-000000000000',
    '/user/manage',
    'view.user_manage',
    'carbon:user-multiple',
    1,
    1,
    '[{"path": "/api/v2/users", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/users/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v2/users/*/reset-password", "methods": ["PUT"]}, {"path": "/api/v2/users/*/roles", "methods": ["POST"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 用户审核（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '20000000-0000-0000-0000-000000000002',
    '用户审核',
    'user_approval',
    'menu',
    '20000000-0000-0000-0000-000000000000',
    '/user/approval',
    'view.user_approval',
    'carbon:task',
    2,
    1,
    '[{"path": "/api/v2/users", "methods": ["GET"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 内容管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '30000000-0000-0000-0000-000000000000',
    '内容管理',
    'content',
    'menu',
    NULL,
    '/content',
    'layout.base',
    'mdi:file-document-outline',
    3,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 内容分类（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '内容分类',
    'content_category',
    'menu',
    '30000000-0000-0000-0000-000000000000',
    '/content/category',
    'view.content_category',
    'carbon:folder',
    1,
    1,
    '[{"path": "/api/v2/categories", "methods": ["GET", "POST", "PUT", "DELETE"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 内容列表（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '30000000-0000-0000-0000-000000000002',
    '内容列表',
    'content_list',
    'menu',
    '30000000-0000-0000-0000-000000000000',
    '/content/list',
    'view.content_list',
    'carbon:document',
    2,
    1,
    '[{"path": "/api/v2/contents", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/contents/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- Banner管理（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '30000000-0000-0000-0000-000000000003',
    'Banner管理',
    'content_banner',
    'menu',
    '30000000-0000-0000-0000-000000000000',
    '/content/banner',
    'view.content_banner',
    'carbon:image',
    3,
    1,
    '[{"path": "/api/v2/banner-groups", "methods": ["GET", "POST", "PUT", "DELETE"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 其他管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '40000000-0000-0000-0000-000000000000',
    '其他',
    'operations',
    'menu',
    NULL,
    '/operations',
    'layout.base',
    'mdi:cog-outline',
    4,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 操作日志（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    '操作日志',
    'operations_log',
    'menu',
    '40000000-0000-0000-0000-000000000000',
    '/operations/log',
    'view.operations_log',
    'carbon:recently-viewed',
    1,
    1,
    '[{"path": "/api/v1/operation-logs", "methods": ["GET"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 客服管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '50000000-0000-0000-0000-000000000000',
    '客服管理',
    'support',
    'menu',
    NULL,
    '/support',
    'layout.base',
    'mdi:headset',
    5,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 发送邮件（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    '发送邮件',
    'support_send-email',
    'menu',
    '50000000-0000-0000-0000-000000000000',
    '/support/send-email',
    'view.support_send-email',
    'carbon:email',
    1,
    1,
    '[{"path": "/api/v2/support/email", "methods": ["POST"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 管理员管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '60000000-0000-0000-0000-000000000000',
    '管理员',
    'admin',
    'menu',
    NULL,
    '/admin',
    'layout.base',
    'mdi:shield-account',
    6,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 管理员列表（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '60000000-0000-0000-0000-000000000001',
    '管理员列表',
    'admin_list',
    'menu',
    '60000000-0000-0000-0000-000000000000',
    '/admin/list',
    'view.admin_list',
    'carbon:user-avatar',
    1,
    1,
    '[{"path": "/api/v1/admins", "methods": ["GET", "POST"]}, {"path": "/api/v1/admins/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/admins/*/roles", "methods": ["GET", "PUT"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 角色管理（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '60000000-0000-0000-0000-000000000002',
    '角色管理',
    'admin_role',
    'menu',
    '60000000-0000-0000-0000-000000000000',
    '/admin/role',
    'view.admin_role',
    'carbon:user-role',
    2,
    1,
    '[{"path": "/api/v1/roles", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/roles/*/permissions", "methods": ["GET", "PUT"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 权限管理（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '60000000-0000-0000-0000-000000000003',
    '权限管理',
    'admin_permission',
    'menu',
    '60000000-0000-0000-0000-000000000000',
    '/admin/permission',
    'view.admin_permission',
    'carbon:locked',
    3,
    1,
    '[{"path": "/api/v1/permissions", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/permissions/tree", "methods": ["GET"]}, {"path": "/api/v1/permissions/sort", "methods": ["PUT"]}, {"path": "/api/v1/permissions/*/move", "methods": ["PUT"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 存储管理（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '70000000-0000-0000-0000-000000000000',
    '存储管理',
    'storage',
    'menu',
    NULL,
    '/storage',
    'layout.base',
    'mdi:cloud-upload',
    7,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 存储配置（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '70000000-0000-0000-0000-000000000001',
    '存储配置',
    'storage_config',
    'menu',
    '70000000-0000-0000-0000-000000000000',
    '/storage/config',
    'view.storage_config',
    'carbon:cloud',
    1,
    1,
    '[{"path": "/api/v1/storage-configs", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/storage-configs/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/storage-configs/*/default", "methods": ["PUT"]}, {"path": "/api/v1/storage-configs/drivers", "methods": ["GET"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 上传记录（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '70000000-0000-0000-0000-000000000002',
    '上传记录',
    'storage_records',
    'menu',
    '70000000-0000-0000-0000-000000000000',
    '/storage/records',
    'view.storage_records',
    'carbon:document',
    2,
    1,
    '[{"path": "/api/v1/upload-records", "methods": ["GET"]}, {"path": "/api/v1/upload-records/*", "methods": ["DELETE"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 系统设置（一级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status)
VALUES (
    '80000000-0000-0000-0000-000000000000',
    '系统设置',
    'settings',
    'menu',
    NULL,
    '/settings',
    'layout.base',
    'mdi:cog',
    8,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 语言设置（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '80000000-0000-0000-0000-000000000001',
    '语言设置',
    'settings_language',
    'menu',
    '80000000-0000-0000-0000-000000000000',
    '/settings/language',
    'view.settings_language',
    'carbon:language',
    1,
    1,
    '[{"path": "/api/v2/languages", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/languages/supported", "methods": ["GET", "PUT"]}, {"path": "/api/v2/languages/*/default", "methods": ["PUT"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 邮件配置（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '80000000-0000-0000-0000-000000000002',
    '邮件配置',
    'settings_email',
    'menu',
    '80000000-0000-0000-0000-000000000000',
    '/settings/email',
    'view.settings_email',
    'carbon:email',
    2,
    1,
    '[{"path": "/api/v2/email-configs", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/email-configs/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v2/email-configs/test", "methods": ["POST"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- 用户设置（二级菜单）
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
VALUES (
    '80000000-0000-0000-0000-000000000003',
    '用户设置',
    'settings_user',
    'menu',
    '80000000-0000-0000-0000-000000000000',
    '/settings/user',
    'view.settings_user',
    'carbon:user-settings',
    3,
    1,
    '[{"path": "/api/v2/settings", "methods": ["GET", "PUT"]}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    component = EXCLUDED.component,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    api_paths = EXCLUDED.api_paths;

-- ============================================================
-- Part 12: 为超级管理员分配所有权限
-- ============================================================

INSERT INTO wf_admin_role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM wf_admin_permissions
ON CONFLICT DO NOTHING;

-- ============================================================
-- 迁移完成
-- ============================================================
