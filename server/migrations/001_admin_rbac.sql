-- Admin Users Table
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

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_status ON admin_users(status);

-- Roles Table
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

CREATE INDEX idx_admin_roles_code ON admin_roles(code);
CREATE INDEX idx_admin_roles_status ON admin_roles(status);

-- Permissions Table
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

CREATE INDEX idx_admin_permissions_code ON admin_permissions(code);
CREATE INDEX idx_admin_permissions_type ON admin_permissions(type);
CREATE INDEX idx_admin_permissions_parent_id ON admin_permissions(parent_id);

-- User-Role Association Table
CREATE TABLE IF NOT EXISTS admin_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_admin_user_roles_user_id ON admin_user_roles(user_id);
CREATE INDEX idx_admin_user_roles_role_id ON admin_user_roles(role_id);

-- Role-Permission Association Table
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_admin_role_permissions_role_id ON admin_role_permissions(role_id);
CREATE INDEX idx_admin_role_permissions_permission_id ON admin_role_permissions(permission_id);

-- Operation Logs Table
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

CREATE INDEX idx_admin_operation_logs_user_id ON admin_operation_logs(user_id);
CREATE INDEX idx_admin_operation_logs_action ON admin_operation_logs(action);
CREATE INDEX idx_admin_operation_logs_created_at ON admin_operation_logs(created_at);

-- Insert Default Super Admin Role
INSERT INTO admin_roles (id, name, code, description, status, sort_order)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Super Admin',
    'super_admin',
    'Super administrator with all permissions',
    1,
    0
) ON CONFLICT (code) DO NOTHING;

-- Insert Default Admin User (password: admin123)
-- Password hash using bcrypt with cost 10
INSERT INTO admin_users (id, username, password_hash, salt, nickname, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.eG1H2DkKsQPmPLF9y.',
    '',
    'Administrator',
    1
) ON CONFLICT (username) DO NOTHING;

-- Assign Super Admin Role to Default Admin
INSERT INTO admin_user_roles (user_id, role_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert Default Menu Permissions
INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, status) VALUES
-- Dashboard
('10000000-0000-0000-0000-000000000001', 'Dashboard', 'dashboard', 'menu', NULL, '/dashboard', 'view.dashboard', 'carbon:dashboard', 1, 1),

-- System Management
('20000000-0000-0000-0000-000000000001', 'System', 'system', 'menu', NULL, '/system', 'layout.base', 'carbon:settings', 2, 1),
('20000000-0000-0000-0000-000000000002', 'User Management', 'system:user', 'menu', '20000000-0000-0000-0000-000000000001', '/system/user', 'view.system_user', 'carbon:user-multiple', 1, 1),
('20000000-0000-0000-0000-000000000003', 'Role Management', 'system:role', 'menu', '20000000-0000-0000-0000-000000000001', '/system/role', 'view.system_role', 'carbon:user-role', 2, 1),
('20000000-0000-0000-0000-000000000004', 'Permission Management', 'system:permission', 'menu', '20000000-0000-0000-0000-000000000001', '/system/permission', 'view.system_permission', 'carbon:locked', 3, 1),
('20000000-0000-0000-0000-000000000005', 'Operation Logs', 'system:log', 'menu', '20000000-0000-0000-0000-000000000001', '/system/log', 'view.system_log', 'carbon:document', 4, 1),

-- Game Management
('30000000-0000-0000-0000-000000000001', 'Game Management', 'game', 'menu', NULL, '/game', 'layout.base', 'carbon:game-console', 3, 1),
('30000000-0000-0000-0000-000000000002', 'Game Config', 'game:config', 'menu', '30000000-0000-0000-0000-000000000001', '/game/config', 'view.game_config', 'carbon:settings-adjust', 1, 1),
('30000000-0000-0000-0000-000000000003', 'Room Management', 'game:room', 'menu', '30000000-0000-0000-0000-000000000001', '/game/room', 'view.game_room', 'carbon:events', 2, 1),
('30000000-0000-0000-0000-000000000004', 'Match Management', 'game:match', 'menu', '30000000-0000-0000-0000-000000000001', '/game/match', 'view.game_match', 'carbon:trophy', 3, 1),

-- Robot Management
('40000000-0000-0000-0000-000000000001', 'Robot Management', 'robot', 'menu', NULL, '/robot', 'layout.base', 'carbon:bot', 4, 1),
('40000000-0000-0000-0000-000000000002', 'Robot List', 'robot:list', 'menu', '40000000-0000-0000-0000-000000000001', '/robot/list', 'view.robot_list', 'carbon:list', 1, 1),
('40000000-0000-0000-0000-000000000003', 'Robot Config', 'robot:config', 'menu', '40000000-0000-0000-0000-000000000001', '/robot/config', 'view.robot_config', 'carbon:settings', 2, 1),

-- Player Management
('50000000-0000-0000-0000-000000000001', 'Player Management', 'player', 'menu', NULL, '/player', 'layout.base', 'carbon:user-profile', 5, 1),
('50000000-0000-0000-0000-000000000002', 'Player List', 'player:list', 'menu', '50000000-0000-0000-0000-000000000001', '/player/list', 'view.player_list', 'carbon:list', 1, 1),
('50000000-0000-0000-0000-000000000003', 'Player Wallet', 'player:wallet', 'menu', '50000000-0000-0000-0000-000000000001', '/player/wallet', 'view.player_wallet', 'carbon:wallet', 2, 1),

-- Statistics
('60000000-0000-0000-0000-000000000001', 'Statistics', 'statistics', 'menu', NULL, '/statistics', 'layout.base', 'carbon:chart-bar', 6, 1),
('60000000-0000-0000-0000-000000000002', 'Game Statistics', 'statistics:game', 'menu', '60000000-0000-0000-0000-000000000001', '/statistics/game', 'view.statistics_game', 'carbon:chart-line', 1, 1),
('60000000-0000-0000-0000-000000000003', 'Player Statistics', 'statistics:player', 'menu', '60000000-0000-0000-0000-000000000001', '/statistics/player', 'view.statistics_player', 'carbon:chart-area', 2, 1)
ON CONFLICT (code) DO NOTHING;

-- Assign All Permissions to Super Admin Role
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM admin_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;
