-- ============================================================
-- WarForge Admin Complete Migration Script
-- ============================================================

-- Part 1: Core Tables

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    status SMALLINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_code ON admin_roles(code);
CREATE INDEX IF NOT EXISTS idx_admin_roles_status ON admin_roles(status);

CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    parent_id UUID,
    path VARCHAR(255),
    component VARCHAR(255),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_code ON admin_permissions(code);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_type ON admin_permissions(type);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_parent_id ON admin_permissions(parent_id);

CREATE TABLE IF NOT EXISTS admin_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user_id ON admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role_id ON admin_user_roles(role_id);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role_id ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_permission_id ON admin_role_permissions(permission_id);

CREATE TABLE IF NOT EXISTS admin_operation_logs (
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

CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_user_id ON admin_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_action ON admin_operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_created_at ON admin_operation_logs(created_at);

CREATE TABLE IF NOT EXISTS admin_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS languages (
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

CREATE INDEX IF NOT EXISTS idx_languages_code ON languages(code);
CREATE INDEX IF NOT EXISTS idx_languages_status ON languages(status);

CREATE TABLE IF NOT EXISTS admin_banner_positions (
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

CREATE INDEX IF NOT EXISTS idx_admin_banner_positions_code ON admin_banner_positions(code);

CREATE TABLE IF NOT EXISTS admin_banners (
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

CREATE INDEX IF NOT EXISTS idx_admin_banners_position_id ON admin_banners(position_id);
CREATE INDEX IF NOT EXISTS idx_admin_banners_status ON admin_banners(status);

CREATE TABLE IF NOT EXISTS content_categories (
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

CREATE INDEX IF NOT EXISTS idx_content_categories_parent_id ON content_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_code ON content_categories(code);

CREATE TABLE IF NOT EXISTS storage_configs (
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

CREATE INDEX IF NOT EXISTS idx_storage_configs_is_default ON storage_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_storage_configs_status ON storage_configs(status);

CREATE TABLE IF NOT EXISTS upload_records (
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

CREATE INDEX IF NOT EXISTS idx_upload_records_storage_id ON upload_records(storage_id);
CREATE INDEX IF NOT EXISTS idx_upload_records_user ON upload_records(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_records_created_at ON upload_records(created_at);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Part 2: Default Data

INSERT INTO admin_roles (id, name, code, description, status, sort_order)
VALUES ('00000000-0000-0000-0000-000000000001', 'Super Admin', 'super_admin', 'Super administrator with all permissions', 1, 0)
ON CONFLICT (code) DO NOTHING;

INSERT INTO admin_users (id, username, password_hash, salt, nickname, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.eG1H2DkKsQPmPLF9y.', '', 'Administrator', 1)
ON CONFLICT (username) DO NOTHING;

INSERT INTO admin_user_roles (user_id, role_id)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Part 3: Menu Permissions

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('10000000-0000-0000-0000-000000000000', 'Dashboard', 'home', 'menu', NULL, '/home', 'layout.base$view.home', 'mdi:home', 1, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('70000000-0000-0000-0000-000000000001', 'User Management', 'user', 'menu', NULL, '/user', 'layout.base', 'mdi:account-group', 2, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('70000000-0000-0000-0000-000000000002', 'User List', 'user_manage', 'menu', '70000000-0000-0000-0000-000000000001', '/user/manage', 'view.user_manage', 'carbon:user-multiple', 1, 1),
('70000000-0000-0000-0000-000000000003', 'User Approval', 'user_approval', 'menu', '70000000-0000-0000-0000-000000000001', '/user/approval', 'view.user_approval', 'carbon:task', 2, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('70000000-0000-0000-0000-000000000100', 'System Management', 'admin', 'menu', NULL, '/admin', 'layout.base', 'mdi:shield-account', 3, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('20000000-0000-0000-0000-000000000002', 'Admin List', 'admin_list', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/list', 'view.admin_list', 'carbon:user', 1, 1),
('20000000-0000-0000-0000-000000000003', 'Role Management', 'admin_role', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/role', 'view.admin_role', 'carbon:user-role', 2, 1),
('20000000-0000-0000-0000-000000000004', 'Permission Management', 'admin_permission', 'menu', '70000000-0000-0000-0000-000000000100', '/admin/permission', 'view.admin_permission', 'carbon:locked', 3, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('60000000-0000-0000-0000-000000000001', 'Content Management', 'content', 'menu', NULL, '/content', 'layout.base', 'mdi:file-document-outline', 4, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('60000000-0000-0000-0000-000000000002', 'Category Management', 'content_category', 'menu', '60000000-0000-0000-0000-000000000001', '/content/category', 'view.content_category', NULL, 1, 1),
('60000000-0000-0000-0000-000000000003', 'Content List', 'content_list', 'menu', '60000000-0000-0000-0000-000000000001', '/content/list', 'view.content_list', NULL, 2, 1),
('60000000-0000-0000-0000-000000000004', 'Banner Management', 'content_banner', 'menu', '60000000-0000-0000-0000-000000000001', '/content/banner', 'view.content_banner', NULL, 3, 1),
('60000000-0000-0000-0000-000000000005', 'Banner Position', 'content_banner-position', 'menu', '60000000-0000-0000-0000-000000000001', '/content/banner-position', 'view.content_banner-position', NULL, 4, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('85000000-0000-0000-0000-000000000001', 'Storage', 'storage', 'menu', NULL, '/storage', 'layout.base', 'mdi:cloud-upload', 5, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('80000000-0000-0000-0000-000000000003', 'Storage Config', 'storage_config', 'menu', '85000000-0000-0000-0000-000000000001', '/storage/config', 'view.storage_config', 'carbon:cloud-upload', 1, 1),
('90000000-0000-0000-0000-000000000002', 'Upload Records', 'storage_records', 'menu', '85000000-0000-0000-0000-000000000001', '/storage/records', 'view.storage_records', 'carbon:document', 2, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('90000000-0000-0000-0000-000000000001', 'Operations', 'operations', 'menu', NULL, '/operations', 'layout.base', 'carbon:activity', 6, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('90000000-0000-0000-0000-000000000003', 'Backend Logs', 'operations_log', 'menu', '90000000-0000-0000-0000-000000000001', '/operations/log', 'view.operations_log', 'carbon:document', 1, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('80000000-0000-0000-0000-000000000000', 'Settings', 'settings', 'menu', NULL, '/settings', 'layout.base', 'mdi:cog', 7, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
('80000000-0000-0000-0000-000000000001', 'Language Settings', 'settings_language', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/language', 'view.settings_language', NULL, 1, 1),
('80000000-0000-0000-0000-000000000002', 'User Settings', 'settings_user', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/user', 'view.settings_user', NULL, 2, 1)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- Part 4: Assign Permissions to Super Admin

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM admin_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Part 5: Default Languages

INSERT INTO languages (code, name, native_name, icon, status, is_default, sort_order) VALUES
('zh-CN', 'Chinese (Simplified)', '简体中文', 'emojione:flag-for-china', 1, TRUE, 1),
('zh-TW', 'Chinese (Traditional)', '繁體中文', 'emojione:flag-for-taiwan', 1, FALSE, 2),
('en-US', 'English (US)', 'English', 'emojione:flag-for-united-states', 1, FALSE, 3),
('en-GB', 'English (UK)', 'English (UK)', 'emojione:flag-for-united-kingdom', 1, FALSE, 4),
('ja-JP', 'Japanese', '日本語', 'emojione:flag-for-japan', 1, FALSE, 5),
('ko-KR', 'Korean', '한국어', 'emojione:flag-for-south-korea', 1, FALSE, 6),
('fr-FR', 'French', 'Français', 'emojione:flag-for-france', 1, FALSE, 7),
('de-DE', 'German', 'Deutsch', 'emojione:flag-for-germany', 1, FALSE, 8),
('es-ES', 'Spanish (Spain)', 'Español', 'emojione:flag-for-spain', 1, FALSE, 9),
('es-MX', 'Spanish (Mexico)', 'Español (México)', 'emojione:flag-for-mexico', 1, FALSE, 10),
('it-IT', 'Italian', 'Italiano', 'emojione:flag-for-italy', 1, FALSE, 11),
('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)', 'emojione:flag-for-brazil', 1, FALSE, 12),
('pt-PT', 'Portuguese (Portugal)', 'Português', 'emojione:flag-for-portugal', 1, FALSE, 13),
('ru-RU', 'Russian', 'Русский', 'emojione:flag-for-russia', 1, FALSE, 14),
('ar-SA', 'Arabic', 'العربية', 'emojione:flag-for-saudi-arabia', 1, FALSE, 15),
('th-TH', 'Thai', 'ไทย', 'emojione:flag-for-thailand', 1, FALSE, 16),
('vi-VN', 'Vietnamese', 'Tiếng Việt', 'emojione:flag-for-vietnam', 1, FALSE, 17),
('id-ID', 'Indonesian', 'Bahasa Indonesia', 'emojione:flag-for-indonesia', 1, FALSE, 18),
('ms-MY', 'Malay', 'Bahasa Melayu', 'emojione:flag-for-malaysia', 1, FALSE, 19),
('tr-TR', 'Turkish', 'Türkçe', 'emojione:flag-for-turkey', 1, FALSE, 20)
ON CONFLICT (code) DO NOTHING;

-- Part 6: Default Banner Positions

INSERT INTO admin_banner_positions (code, name, description, width, height, status, sort_order) VALUES
('home_top', 'Home Top', 'Home top banner', 1200, 400, 1, 1),
('home_middle', 'Home Middle', 'Home middle banner', 800, 200, 1, 2),
('login_page', 'Login Page', 'Login page background', 1920, 1080, 1, 3),
('sidebar', 'Sidebar', 'Sidebar banner', 300, 250, 1, 4),
('popup', 'Popup', 'Popup banner', 600, 400, 1, 5)
ON CONFLICT (code) DO NOTHING;
