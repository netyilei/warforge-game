-- ============================================================
-- WarForge Admin Complete Migration Script
-- 所有自定义表使用 wf_ 前缀，避免与 Nakama 表冲突
-- ============================================================

-- ============================================================
-- Part 1: 删除所有旧表（按依赖顺序）
-- ============================================================

DROP TABLE IF EXISTS wf_email_templates CASCADE;
DROP TABLE IF EXISTS wf_email_configs CASCADE;
DROP TABLE IF EXISTS wf_content_translations CASCADE;
DROP TABLE IF EXISTS wf_contents CASCADE;
DROP TABLE IF EXISTS wf_content_categories CASCADE;
DROP TABLE IF EXISTS wf_banner_translations CASCADE;
DROP TABLE IF EXISTS wf_banners CASCADE;
DROP TABLE IF EXISTS wf_banner_groups CASCADE;
DROP TABLE IF EXISTS wf_upload_records CASCADE;
DROP TABLE IF EXISTS wf_storage_configs CASCADE;
DROP TABLE IF EXISTS wf_user_profiles CASCADE;
DROP TABLE IF EXISTS wf_system_settings CASCADE;
DROP TABLE IF EXISTS wf_admin_settings CASCADE;
DROP TABLE IF EXISTS wf_admin_operation_logs CASCADE;
DROP TABLE IF EXISTS wf_admin_role_permissions CASCADE;
DROP TABLE IF EXISTS wf_admin_user_roles CASCADE;
DROP TABLE IF EXISTS wf_admin_permissions CASCADE;
DROP TABLE IF EXISTS wf_admin_roles CASCADE;
DROP TABLE IF EXISTS wf_admin_users CASCADE;
DROP TABLE IF EXISTS wf_languages CASCADE;

-- 删除旧的无前缀表
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_configs CASCADE;
DROP TABLE IF EXISTS content_translations CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS banner_translations CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS banner_groups CASCADE;
DROP TABLE IF EXISTS upload_records CASCADE;
DROP TABLE IF EXISTS storage_configs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS admin_operation_logs CASCADE;
DROP TABLE IF EXISTS admin_role_permissions CASCADE;
DROP TABLE IF EXISTS admin_user_roles CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS admin_banner_positions CASCADE;
DROP TABLE IF EXISTS admin_banners CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- ============================================================
-- Part 2: 核心管理后台表
-- ============================================================

-- 管理员用户表
CREATE TABLE wf_admin_users (
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

CREATE INDEX idx_wf_admin_users_username ON wf_admin_users(username);
CREATE INDEX idx_wf_admin_users_status ON wf_admin_users(status);
CREATE INDEX idx_wf_admin_users_deleted ON wf_admin_users(deleted_at);

COMMENT ON TABLE wf_admin_users IS '管理员用户表';
COMMENT ON COLUMN wf_admin_users.status IS '状态: 1=启用, 0=禁用';

-- 管理员角色表
CREATE TABLE wf_admin_roles (
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

CREATE INDEX idx_wf_admin_roles_code ON wf_admin_roles(code);
CREATE INDEX idx_wf_admin_roles_status ON wf_admin_roles(status);

COMMENT ON TABLE wf_admin_roles IS '管理员角色表';

-- 管理员权限表（同时承担菜单管理功能）
CREATE TABLE wf_admin_permissions (
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

CREATE INDEX idx_wf_admin_permissions_code ON wf_admin_permissions(code);
CREATE INDEX idx_wf_admin_permissions_type ON wf_admin_permissions(type);
CREATE INDEX idx_wf_admin_permissions_parent ON wf_admin_permissions(parent_id);

COMMENT ON TABLE wf_admin_permissions IS '管理员权限表(含菜单): type=menu为菜单, type=button为按钮权限';
COMMENT ON COLUMN wf_admin_permissions.type IS '类型: menu=菜单, button=按钮, api=API权限';
COMMENT ON COLUMN wf_admin_permissions.show_in_menu IS '是否在菜单中显示';

-- 用户-角色关联表
CREATE TABLE wf_admin_user_roles (
    user_id UUID NOT NULL REFERENCES wf_admin_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES wf_admin_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_wf_admin_user_roles_role ON wf_admin_user_roles(role_id);

COMMENT ON TABLE wf_admin_user_roles IS '管理员用户-角色关联表';

-- 角色-权限关联表
CREATE TABLE wf_admin_role_permissions (
    role_id UUID NOT NULL REFERENCES wf_admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES wf_admin_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_wf_admin_role_permissions_permission ON wf_admin_role_permissions(permission_id);

COMMENT ON TABLE wf_admin_role_permissions IS '角色-权限关联表';

-- 管理员操作日志表
CREATE TABLE wf_admin_operation_logs (
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

CREATE INDEX idx_wf_admin_operation_logs_user ON wf_admin_operation_logs(user_id);
CREATE INDEX idx_wf_admin_operation_logs_action ON wf_admin_operation_logs(action);
CREATE INDEX idx_wf_admin_operation_logs_time ON wf_admin_operation_logs(created_at);

COMMENT ON TABLE wf_admin_operation_logs IS '管理员操作日志表';
COMMENT ON COLUMN wf_admin_operation_logs.action IS '操作类型: create/update/delete/login/logout等';
COMMENT ON COLUMN wf_admin_operation_logs.target_type IS '操作对象类型: user/role/permission等';
COMMENT ON COLUMN wf_admin_operation_logs.details IS '操作详情(JSON格式)';

-- 管理后台设置表
CREATE TABLE wf_admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE wf_admin_settings IS '管理后台设置表';

-- ============================================================
-- Part 3: 语言管理表
-- ============================================================

CREATE TABLE wf_languages (
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

CREATE INDEX idx_wf_languages_code ON wf_languages(code);
CREATE INDEX idx_wf_languages_status ON wf_languages(status);

COMMENT ON TABLE wf_languages IS '语言配置表';
COMMENT ON COLUMN wf_languages.code IS '语言代码: zh-CN, en-US等';
COMMENT ON COLUMN wf_languages.is_default IS '是否为默认语言';

-- ============================================================
-- Part 4: 用户档案表
-- ============================================================

CREATE TABLE wf_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    real_name VARCHAR(50),
    id_card VARCHAR(20),
    id_card_verified BOOLEAN DEFAULT FALSE,
    status INT DEFAULT 1,
    approval_status INT DEFAULT 0,
    approval_note VARCHAR(500),
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wf_user_profiles_user ON wf_user_profiles(user_id);
CREATE INDEX idx_wf_user_profiles_status ON wf_user_profiles(status);
CREATE INDEX idx_wf_user_profiles_approval ON wf_user_profiles(approval_status);

COMMENT ON TABLE wf_user_profiles IS '用户档案表';
COMMENT ON COLUMN wf_user_profiles.user_id IS 'Nakama用户ID';
COMMENT ON COLUMN wf_user_profiles.status IS '状态: 1=正常, 0=禁用';
COMMENT ON COLUMN wf_user_profiles.approval_status IS '审核状态: 0=待审核, 1=已通过, 2=已拒绝';

-- ============================================================
-- Part 5: 内容管理表
-- ============================================================

-- 内容分类表
CREATE TABLE wf_content_categories (
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

CREATE INDEX idx_wf_content_categories_code ON wf_content_categories(code);
CREATE INDEX idx_wf_content_categories_parent ON wf_content_categories(parent_id);

COMMENT ON TABLE wf_content_categories IS '内容分类表';
COMMENT ON COLUMN wf_content_categories.content_type IS '内容类型: article=文章, notice=公告, news=新闻';

-- 内容主表
CREATE TABLE wf_contents (
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

CREATE INDEX idx_wf_contents_category ON wf_contents(category_id);
CREATE INDEX idx_wf_contents_status ON wf_contents(status);
CREATE INDEX idx_wf_contents_marquee ON wf_contents(is_marquee);
CREATE INDEX idx_wf_contents_popup ON wf_contents(is_popup);

COMMENT ON TABLE wf_contents IS '内容主表';
COMMENT ON COLUMN wf_contents.is_marquee IS '是否跑马灯显示';
COMMENT ON COLUMN wf_contents.is_popup IS '是否弹窗显示';

-- 内容翻译表
CREATE TABLE wf_content_translations (
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

CREATE INDEX idx_wf_content_translations_content ON wf_content_translations(content_id);
CREATE INDEX idx_wf_content_translations_lang ON wf_content_translations(lang);

COMMENT ON TABLE wf_content_translations IS '内容多语言翻译表';

-- ============================================================
-- Part 6: Banner管理表
-- ============================================================

-- Banner分组表
CREATE TABLE wf_banner_groups (
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

CREATE INDEX idx_wf_banner_groups_code ON wf_banner_groups(code);
CREATE INDEX idx_wf_banner_groups_status ON wf_banner_groups(status);

COMMENT ON TABLE wf_banner_groups IS 'Banner分组表';

-- Banner项目表
CREATE TABLE wf_banners (
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

CREATE INDEX idx_wf_banners_group ON wf_banners(group_id);
CREATE INDEX idx_wf_banners_status ON wf_banners(status);

COMMENT ON TABLE wf_banners IS 'Banner项目表';
COMMENT ON COLUMN wf_banners.is_external IS '是否外部链接';
COMMENT ON COLUMN wf_banners.extra_data IS '自定义参数(JSON格式)';

-- Banner翻译表
CREATE TABLE wf_banner_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id UUID NOT NULL REFERENCES wf_banners(id) ON DELETE CASCADE,
    lang VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(banner_id, lang)
);

CREATE INDEX idx_wf_banner_translations_banner ON wf_banner_translations(banner_id);
CREATE INDEX idx_wf_banner_translations_lang ON wf_banner_translations(lang);

COMMENT ON TABLE wf_banner_translations IS 'Banner多语言翻译表';

-- ============================================================
-- Part 7: 邮件配置表
-- ============================================================

-- 邮件服务器配置表
CREATE TABLE wf_email_configs (
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

CREATE INDEX idx_wf_email_configs_code ON wf_email_configs(code);
CREATE INDEX idx_wf_email_configs_status ON wf_email_configs(status);
CREATE INDEX idx_wf_email_configs_default ON wf_email_configs(is_default);

COMMENT ON TABLE wf_email_configs IS '邮件服务器配置表';
COMMENT ON COLUMN wf_email_configs.encryption IS '加密方式: tls/ssl/none';

-- 邮件模板表
CREATE TABLE wf_email_templates (
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

CREATE INDEX idx_wf_email_templates_code ON wf_email_templates(code);
CREATE INDEX idx_wf_email_templates_status ON wf_email_templates(status);

COMMENT ON TABLE wf_email_templates IS '邮件模板表';
COMMENT ON COLUMN wf_email_templates.variables IS '模板变量说明(JSON格式)';

-- ============================================================
-- Part 8: 存储配置表
-- ============================================================

CREATE TABLE wf_storage_configs (
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

CREATE INDEX idx_wf_storage_configs_driver ON wf_storage_configs(driver);
CREATE INDEX idx_wf_storage_configs_default ON wf_storage_configs(is_default);
CREATE INDEX idx_wf_storage_configs_status ON wf_storage_configs(status);

COMMENT ON TABLE wf_storage_configs IS '存储配置表';
COMMENT ON COLUMN wf_storage_configs.driver IS '存储驱动: cloudflare/aws/minio/digitalocean/backblaze/wasabi';
COMMENT ON COLUMN wf_storage_configs.max_file_size IS '最大文件大小(字节), 默认10MB';

-- 上传记录表
CREATE TABLE wf_upload_records (
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

CREATE INDEX idx_wf_upload_records_user ON wf_upload_records(user_id, user_type);
CREATE INDEX idx_wf_upload_records_storage ON wf_upload_records(storage_id);
CREATE INDEX idx_wf_upload_records_time ON wf_upload_records(created_at);

COMMENT ON TABLE wf_upload_records IS '上传记录表';
COMMENT ON COLUMN wf_upload_records.user_type IS '用户类型: admin/player';
COMMENT ON COLUMN wf_upload_records.upload_type IS '上传类型: avatar/banner/content等';

-- ============================================================
-- Part 9: 系统设置表
-- ============================================================

CREATE TABLE wf_system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE wf_system_settings IS '系统设置表';

-- ============================================================
-- Part 10: 默认数据
-- ============================================================

-- 默认超级管理员角色
INSERT INTO wf_admin_roles (id, name, code, description, status, sort_order)
VALUES ('00000000-0000-0000-0000-000000000001', '超级管理员', 'super_admin', '拥有所有权限的超级管理员', 1, 0);

-- 默认管理员账号 (密码: admin123)
INSERT INTO wf_admin_users (id, username, password_hash, salt, nickname, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.eG1H2DkKsQPmPLF9y.', '', '管理员', 1);

-- 关联管理员和角色
INSERT INTO wf_admin_user_roles (user_id, role_id)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

-- ============================================================
-- Part 11: 默认菜单权限
-- ============================================================

-- 一级菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('10000000-0000-0000-0000-000000000000', '首页', 'home', 'menu', NULL, '/home', 'layout.base$view.home', 'mdi:home', TRUE, 1, 1),
('20000000-0000-0000-0000-000000000000', '用户管理', 'user', 'menu', NULL, '/user', 'layout.base', 'mdi:account-group', TRUE, 2, 1),
('30000000-0000-0000-0000-000000000000', '内容管理', 'content', 'menu', NULL, '/content', 'layout.base', 'mdi:file-document-outline', TRUE, 3, 1),
('40000000-0000-0000-0000-000000000000', '运营管理', 'operations', 'menu', NULL, '/operations', 'layout.base', 'carbon:activity', TRUE, 4, 1),
('50000000-0000-0000-0000-000000000000', '客服管理', 'support', 'menu', NULL, '/support', 'layout.base', 'mdi:headset', TRUE, 5, 1),
('60000000-0000-0000-0000-000000000000', '系统管理', 'admin', 'menu', NULL, '/admin', 'layout.base', 'mdi:shield-account', TRUE, 6, 1),
('70000000-0000-0000-0000-000000000000', '存储管理', 'storage', 'menu', NULL, '/storage', 'layout.base', 'mdi:cloud-upload', TRUE, 7, 1),
('80000000-0000-0000-0000-000000000000', '系统设置', 'settings', 'menu', NULL, '/settings', 'layout.base', 'mdi:cog', TRUE, 8, 1);

-- 用户管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('20000000-0000-0000-0000-000000000001', '用户列表', 'user_manage', 'menu', '20000000-0000-0000-0000-000000000000', '/user/manage', 'view.user_manage', 'carbon:user-multiple', TRUE, 1, 1),
('20000000-0000-0000-0000-000000000002', '用户审核', 'user_approval', 'menu', '20000000-0000-0000-0000-000000000000', '/user/approval', 'view.user_approval', 'carbon:task', TRUE, 2, 1);

-- 内容管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('30000000-0000-0000-0000-000000000001', '内容分类', 'content_category', 'menu', '30000000-0000-0000-0000-000000000000', '/content/category', 'view.content_category', 'carbon:folder', TRUE, 1, 1),
('30000000-0000-0000-0000-000000000002', '内容列表', 'content_list', 'menu', '30000000-0000-0000-0000-000000000000', '/content/list', 'view.content_list', 'carbon:document', TRUE, 2, 1),
('30000000-0000-0000-0000-000000000003', 'Banner管理', 'content_banner', 'menu', '30000000-0000-0000-0000-000000000000', '/content/banner', 'view.content_banner', 'carbon:image', TRUE, 3, 1);

-- 运营管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('40000000-0000-0000-0000-000000000001', '操作日志', 'operations_log', 'menu', '40000000-0000-0000-0000-000000000000', '/operations/log', 'view.operations_log', 'carbon:document', TRUE, 1, 1);

-- 客服管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('50000000-0000-0000-0000-000000000001', '发送邮件', 'support_send_email', 'menu', '50000000-0000-0000-0000-000000000000', '/support/send-email', 'view.support_send_email', 'carbon:email', TRUE, 1, 1);

-- 系统管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('60000000-0000-0000-0000-000000000001', '管理员列表', 'admin_list', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/list', 'view.admin_list', 'carbon:user', TRUE, 1, 1),
('60000000-0000-0000-0000-000000000002', '角色管理', 'admin_role', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/role', 'view.admin_role', 'carbon:user-role', TRUE, 2, 1),
('60000000-0000-0000-0000-000000000003', '权限管理', 'admin_permission', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/permission', 'view.admin_permission', 'carbon:locked', TRUE, 3, 1);

-- 存储管理子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('70000000-0000-0000-0000-000000000001', '存储配置', 'storage_config', 'menu', '70000000-0000-0000-0000-000000000000', '/storage/config', 'view.storage_config', 'carbon:cloud-upload', TRUE, 1, 1),
('70000000-0000-0000-0000-000000000002', '上传记录', 'storage_records', 'menu', '70000000-0000-0000-0000-000000000000', '/storage/records', 'view.storage_records', 'carbon:document', TRUE, 2, 1);

-- 系统设置子菜单
INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, show_in_menu, sort_order, status) VALUES
('80000000-0000-0000-0000-000000000001', '语言设置', 'settings_language', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/language', 'view.settings_language', 'carbon:language', TRUE, 1, 1),
('80000000-0000-0000-0000-000000000002', '邮件配置', 'settings_email', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/email', 'view.settings_email', 'carbon:email', TRUE, 2, 1),
('80000000-0000-0000-0000-000000000003', '用户设置', 'settings_user', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/user', 'view.settings_user', 'carbon:user-settings', TRUE, 3, 1);

-- ============================================================
-- Part 12: 为超级管理员分配所有权限
-- ============================================================

INSERT INTO wf_admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM wf_admin_permissions;

-- ============================================================
-- Part 13: 默认语言配置
-- ============================================================

INSERT INTO wf_languages (code, name, native_name, icon, status, is_default, sort_order) VALUES
('zh-CN', '简体中文', '简体中文', 'emojione:flag-for-china', 1, TRUE, 1),
('zh-TW', '繁體中文', '繁體中文', 'emojione:flag-for-taiwan', 1, FALSE, 2),
('en-US', 'English', 'English', 'emojione:flag-for-united-states', 1, FALSE, 3),
('en-GB', 'English (UK)', 'English (UK)', 'emojione:flag-for-united-kingdom', 1, FALSE, 4),
('ja-JP', '日本語', '日本語', 'emojione:flag-for-japan', 1, FALSE, 5),
('ko-KR', '한국어', '한국어', 'emojione:flag-for-south-korea', 1, FALSE, 6),
('fr-FR', 'Français', 'Français', 'emojione:flag-for-france', 1, FALSE, 7),
('de-DE', 'Deutsch', 'Deutsch', 'emojione:flag-for-germany', 1, FALSE, 8),
('es-ES', 'Español', 'Español', 'emojione:flag-for-spain', 1, FALSE, 9),
('es-MX', 'Español (México)', 'Español (México)', 'emojione:flag-for-mexico', 1, FALSE, 10),
('it-IT', 'Italiano', 'Italiano', 'emojione:flag-for-italy', 1, FALSE, 11),
('pt-BR', 'Português (Brasil)', 'Português (Brasil)', 'emojione:flag-for-brazil', 1, FALSE, 12),
('pt-PT', 'Português', 'Português', 'emojione:flag-for-portugal', 1, FALSE, 13),
('ru-RU', 'Русский', 'Русский', 'emojione:flag-for-russia', 1, FALSE, 14),
('ar-SA', 'العربية', 'العربية', 'emojione:flag-for-saudi-arabia', 1, FALSE, 15),
('th-TH', 'ไทย', 'ไทย', 'emojione:flag-for-thailand', 1, FALSE, 16),
('vi-VN', 'Tiếng Việt', 'Tiếng Việt', 'emojione:flag-for-vietnam', 1, FALSE, 17),
('id-ID', 'Bahasa Indonesia', 'Bahasa Indonesia', 'emojione:flag-for-indonesia', 1, FALSE, 18),
('ms-MY', 'Bahasa Melayu', 'Bahasa Melayu', 'emojione:flag-for-malaysia', 1, FALSE, 19),
('tr-TR', 'Türkçe', 'Türkçe', 'emojione:flag-for-turkey', 1, FALSE, 20);

-- ============================================================
-- Part 14: 默认Banner分组
-- ============================================================

INSERT INTO wf_banner_groups (name, code, description, width, height, status, sort_order) VALUES
('首页顶部', 'home_top', '首页顶部Banner', 1200, 400, 1, 1),
('首页中部', 'home_middle', '首页中部Banner', 800, 200, 1, 2),
('登录页面', 'login_page', '登录页面背景', 1920, 1080, 1, 3),
('侧边栏', 'sidebar', '侧边栏Banner', 300, 250, 1, 4),
('弹窗广告', 'popup', '弹窗广告Banner', 600, 400, 1, 5);

-- ============================================================
-- Part 15: 默认邮件模板
-- ============================================================

INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status) VALUES
('注册验证码', 'verification_code', '【战争熔炉】您的验证码', 'html', 
'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
<h1 style="color: #fff; margin: 0; font-size: 28px;">战争熔炉</h1>
</div>
<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
<p style="color: #333; font-size: 16px; line-height: 1.8;">您好！</p>
<p style="color: #333; font-size: 16px; line-height: 1.8;">您正在进行邮箱验证，验证码为：</p>
<div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
<span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{code}}</span>
</div>
<p style="color: #999; font-size: 14px; line-height: 1.8;">验证码有效期为10分钟，请尽快完成验证。</p>
<p style="color: #999; font-size: 14px; line-height: 1.8;">如果您没有进行此操作，请忽略此邮件。</p>
</div>
<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
</div>
</div>',
'用户注册或绑定邮箱时发送的验证码邮件',
'{"code": {"description": "验证码", "example": "123456"}}', 1),

('密码重置', 'password_reset', '【战争熔炉】密码重置请求', 'html',
'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
<h1 style="color: #fff; margin: 0; font-size: 28px;">战争熔炉</h1>
</div>
<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
<p style="color: #333; font-size: 16px; line-height: 1.8;">您好！</p>
<p style="color: #333; font-size: 16px; line-height: 1.8;">我们收到了重置您账户密码的请求。请使用以下验证码完成密码重置：</p>
<div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
<span style="font-size: 24px; font-weight: bold; color: #667eea; word-break: break-all;">{{token}}</span>
</div>
<p style="color: #999; font-size: 14px; line-height: 1.8;">此验证码有效期为30分钟。</p>
<p style="color: #999; font-size: 14px; line-height: 1.8;">如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
</div>
<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
</div>
</div>',
'用户忘记密码时发送的重置验证码邮件',
'{"token": {"description": "重置令牌", "example": "abc123def456"}}', 1),

('欢迎邮件', 'welcome', '【战争熔炉】欢迎加入', 'html',
'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
<h1 style="color: #fff; margin: 0; font-size: 28px;">欢迎加入战争熔炉</h1>
</div>
<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
<p style="color: #333; font-size: 16px; line-height: 1.8;">亲爱的 <strong>{{name}}</strong>，</p>
<p style="color: #333; font-size: 16px; line-height: 1.8;">欢迎加入战争熔炉！我们很高兴您成为我们的一员。</p>
<p style="color: #333; font-size: 16px; line-height: 1.8; margin-top: 30px;">祝您游戏愉快！</p>
</div>
<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
</div>
</div>',
'新用户注册成功后发送的欢迎邮件',
'{"name": {"description": "用户昵称", "example": "玩家123"}}', 1),

('系统通知', 'notice', '【战争熔炉】系统通知', 'html',
'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
<h1 style="color: #fff; margin: 0; font-size: 28px;">战争熔炉</h1>
</div>
<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
<h2 style="color: #333; font-size: 20px; margin-top: 0;">{{title}}</h2>
<div style="color: #333; font-size: 16px; line-height: 1.8;">{{content}}</div>
</div>
<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
</div>
</div>',
'系统通知邮件，用于发送各类系统消息',
'{"title": {"description": "通知标题"}, "content": {"description": "通知内容"}}', 1),

('绑定邮箱验证', 'bind_email', '【战争熔炉】绑定邮箱验证', 'html',
'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
<h1 style="color: #fff; margin: 0; font-size: 28px;">战争熔炉</h1>
</div>
<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
<p style="color: #333; font-size: 16px; line-height: 1.8;">您好！</p>
<p style="color: #333; font-size: 16px; line-height: 1.8;">您正在绑定邮箱地址，验证码为：</p>
<div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
<span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">{{code}}</span>
</div>
<p style="color: #999; font-size: 14px; line-height: 1.8;">验证码有效期为10分钟，请尽快完成验证。</p>
<p style="color: #999; font-size: 14px; line-height: 1.8;">如果您没有进行此操作，请忽略此邮件。</p>
</div>
<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
</div>
</div>',
'用户绑定或更换邮箱时发送的验证码邮件',
'{"code": {"description": "验证码", "example": "123456"}}', 1);

-- ============================================================
-- Part 16: 默认系统设置
-- ============================================================

INSERT INTO wf_system_settings (key, value, description) VALUES
('require_registration_approval', 'false', '用户注册是否需要审核'),
('require_identity_verification', 'false', '用户注册是否需要证件核实');

-- ============================================================
-- 完成
-- ============================================================
