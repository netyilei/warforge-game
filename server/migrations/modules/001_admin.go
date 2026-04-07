package modules

import (
	"database/sql"
	"fmt"

	"warforge-server/config"
	"warforge-server/migrations"
)

type AdminMigration struct {
	*migrations.BaseMigration
}

func NewAdminMigration() *AdminMigration {
	return &AdminMigration{
		BaseMigration: migrations.NewBaseMigration("001", "admin"),
	}
}

func (m *AdminMigration) Up(db *sql.DB) error {
	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "admin_users",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					username VARCHAR(50) UNIQUE NOT NULL,
					password_hash VARCHAR(255) NOT NULL,
					nickname VARCHAR(100),
					email VARCHAR(255),
					phone VARCHAR(20),
					avatar VARCHAR(500),
					status SMALLINT DEFAULT 1,
					last_login_at TIMESTAMP,
					last_login_ip VARCHAR(50),
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("admin_users")),
		},
		{
			name: "admin_roles",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(50) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					description VARCHAR(255),
					status SMALLINT DEFAULT 1,
					sort_order INT DEFAULT 0,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("admin_roles")),
		},
		{
			name: "admin_permissions",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(50) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					type VARCHAR(20) NOT NULL,
					parent_id UUID,
					path VARCHAR(255),
					component VARCHAR(255),
					icon VARCHAR(100),
					href VARCHAR(255),
					api_paths JSONB,
					sort_order INT DEFAULT 0,
					show_in_menu BOOLEAN DEFAULT TRUE,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP,
					CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES %s(id) ON DELETE SET NULL
				)
			`, config.GetTableName("admin_permissions"), config.GetTableName("admin_permissions")),
		},
		{
			name: "admin_user_roles",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL,
					role_id UUID NOT NULL,
					created_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(user_id, role_id)
				)
			`, config.GetTableName("admin_user_roles")),
		},
		{
			name: "admin_role_permissions",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					role_id UUID NOT NULL,
					permission_id UUID NOT NULL,
					created_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(role_id, permission_id)
				)
			`, config.GetTableName("admin_role_permissions")),
		},
		{
			name: "admin_operation_logs",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL,
					username VARCHAR(50),
					action VARCHAR(100) NOT NULL,
					target_type VARCHAR(50),
					target_id VARCHAR(100),
					details JSONB,
					ip VARCHAR(50),
					user_agent VARCHAR(500),
					created_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("admin_operation_logs")),
		},
		{
			name: "admin_settings",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					key VARCHAR(100) PRIMARY KEY,
					value TEXT,
					description VARCHAR(255),
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("admin_settings")),
		},
	}

	for _, table := range tables {
		tableName := config.GetTableName(table.name)
		exists, err := migrations.TableExists(db, tableName)
		if err != nil {
			return fmt.Errorf("检查表 %s 是否存在失败: %w", tableName, err)
		}

		if !exists {
			if _, err := db.Exec(table.sql); err != nil {
				return fmt.Errorf("创建表 %s 失败: %w", tableName, err)
			}
		}
	}

	indexes := []struct {
		name    string
		table   string
		columns string
	}{
		{"idx_wf_admin_users_status", "admin_users", "status"},
		{"idx_wf_admin_roles_status", "admin_roles", "status"},
		{"idx_wf_admin_permissions_parent", "admin_permissions", "parent_id"},
		{"idx_wf_admin_permissions_status", "admin_permissions", "status"},
		{"idx_wf_admin_permissions_type", "admin_permissions", "type"},
		{"idx_wf_admin_user_roles_user", "admin_user_roles", "user_id"},
		{"idx_wf_admin_user_roles_role", "admin_user_roles", "role_id"},
		{"idx_wf_admin_role_permissions_role", "admin_role_permissions", "role_id"},
		{"idx_wf_admin_role_permissions_permission", "admin_role_permissions", "permission_id"},
		{"idx_wf_admin_operation_logs_user", "admin_operation_logs", "user_id"},
		{"idx_wf_admin_operation_logs_created", "admin_operation_logs", "created_at"},
	}

	for _, idx := range indexes {
		tableName := config.GetTableName(idx.table)
		if err := migrations.CreateIndexIfNotExists(db, idx.name, tableName, idx.columns); err != nil {
			return fmt.Errorf("创建索引 %s 失败: %w", idx.name, err)
		}
	}

	return nil
}

func (m *AdminMigration) Seed(db *sql.DB) error {
	queries := []string{
		fmt.Sprintf(`
			INSERT INTO %s (id, username, password_hash, nickname, status)
			VALUES (
				'00000000-0000-0000-0000-000000000001',
				'admin',
				'$2a$10$ZDwlwlcTZI9V9WrPORoTVeKQs/Z1lJixGzRbEnIAvO6MHbCNWq5Fa',
				'管理员',
				1
			) ON CONFLICT (id) DO UPDATE SET
				password_hash = EXCLUDED.password_hash,
				nickname = EXCLUDED.nickname,
				status = EXCLUDED.status
		`, config.GetTableName("admin_users")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, description, status, sort_order)
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
				status = EXCLUDED.status
		`, config.GetTableName("admin_roles")),
		fmt.Sprintf(`
			INSERT INTO %s (user_id, role_id)
			VALUES (
				'00000000-0000-0000-0000-000000000001',
				'a0000000-0000-0000-0000-000000000001'
			) ON CONFLICT DO NOTHING
		`, config.GetTableName("admin_user_roles")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status)
			VALUES 
				('10000000-0000-0000-0000-000000000000', '首页', 'home', 'menu', NULL, '/home', 'layout.base$view.home', 'mdi:home', 1, 1),
				('30000000-0000-0000-0000-000000000000', '内容管理', 'content', 'menu', NULL, '/content', 'layout.base', 'mdi:file-document-outline', 2, 1),
				('40000000-0000-0000-0000-000000000000', '其他', 'operations', 'menu', NULL, '/operations', 'layout.base', 'mdi:cog-outline', 3, 1),
				('50000000-0000-0000-0000-000000000000', '客服管理', 'support', 'menu', NULL, '/support', 'layout.base', 'mdi:headset', 4, 1),
				('60000000-0000-0000-0000-000000000000', '管理员', 'admin', 'menu', NULL, '/admin', 'layout.base', 'mdi:shield-account', 5, 1),
				('70000000-0000-0000-0000-000000000000', '存储管理', 'storage', 'menu', NULL, '/storage', 'layout.base', 'mdi:cloud-upload', 6, 1),
				('80000000-0000-0000-0000-000000000000', '系统设置', 'settings', 'menu', NULL, '/settings', 'layout.base', 'mdi:cog', 7, 1)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('30000000-0000-0000-0000-000000000001', '内容分类', 'content_category', 'menu', '30000000-0000-0000-0000-000000000000', '/content/category', 'view.content_category', 'carbon:folder', 1, 1, '[{"path": "/api/v2/categories", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/categories/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb),
				('30000000-0000-0000-0000-000000000002', '内容列表', 'content_list', 'menu', '30000000-0000-0000-0000-000000000000', '/content/list', 'view.content_list', 'carbon:document', 2, 1, '[{"path": "/api/v2/contents", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/contents/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb),
				('30000000-0000-0000-0000-000000000003', 'Banner管理', 'content_banner', 'menu', '30000000-0000-0000-0000-000000000000', '/content/banner', 'view.content_banner', 'carbon:image', 3, 1, '[{"path": "/api/v2/banner-groups", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/banner-groups/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v2/banners", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/banners/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('40000000-0000-0000-0000-000000000001', '操作日志', 'operations_log', 'menu', '40000000-0000-0000-0000-000000000000', '/operations/log', 'view.operations_log', 'carbon:recently-viewed', 1, 1, '[{"path": "/api/v1/operation-logs", "methods": ["GET"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('50000000-0000-0000-0000-000000000001', '发送邮件', 'support_send-email', 'menu', '50000000-0000-0000-0000-000000000000', '/support/send-email', 'view.support_send-email', 'carbon:email', 1, 1, '[{"path": "/api/v1/support/email", "methods": ["POST"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('60000000-0000-0000-0000-000000000001', '管理员列表', 'admin_list', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/list', 'view.admin_list', 'carbon:user-avatar', 1, 1, '[{"path": "/api/v1/admins", "methods": ["GET", "POST"]}, {"path": "/api/v1/admins/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/admins/*/roles", "methods": ["GET", "PUT"]}]'::jsonb),
				('60000000-0000-0000-0000-000000000002', '角色管理', 'admin_role', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/role', 'view.admin_role', 'carbon:user-role', 2, 1, '[{"path": "/api/v1/roles", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/roles/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/roles/*/permissions", "methods": ["GET", "PUT"]}]'::jsonb),
				('60000000-0000-0000-0000-000000000003', '权限管理', 'admin_permission', 'menu', '60000000-0000-0000-0000-000000000000', '/admin/permission', 'view.admin_permission', 'carbon:locked', 3, 1, '[{"path": "/api/v1/permissions", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/permissions/tree", "methods": ["GET"]}, {"path": "/api/v1/permissions/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/permissions/sort", "methods": ["PUT"]}, {"path": "/api/v1/permissions/*/move", "methods": ["PUT"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('70000000-0000-0000-0000-000000000001', '存储配置', 'storage_config', 'menu', '70000000-0000-0000-0000-000000000000', '/storage/config', 'view.storage_config', 'carbon:cloud', 1, 1, '[{"path": "/api/v1/storage-configs", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/storage-configs/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/storage-configs/*/default", "methods": ["PUT"]}, {"path": "/api/v1/storage-configs/drivers", "methods": ["GET"]}]'::jsonb),
				('70000000-0000-0000-0000-000000000002', '上传记录', 'storage_records', 'menu', '70000000-0000-0000-0000-000000000000', '/storage/records', 'view.storage_records', 'carbon:document', 2, 1, '[{"path": "/api/v1/upload-records", "methods": ["GET"]}, {"path": "/api/v1/upload-records/*", "methods": ["DELETE"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, api_paths)
			VALUES 
				('80000000-0000-0000-0000-000000000001', '语言设置', 'settings_language', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/language', 'view.settings_language', 'carbon:language', 1, 1, '[{"path": "/api/v2/languages", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v2/languages/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v2/languages/supported", "methods": ["GET", "PUT"]}, {"path": "/api/v2/languages/*/default", "methods": ["PUT"]}]'::jsonb),
				('80000000-0000-0000-0000-000000000002', '邮件配置', 'settings_email', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/email', 'view.settings_email', 'carbon:email', 2, 1, '[{"path": "/api/v1/email-configs", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/email-configs/*", "methods": ["GET", "PUT", "DELETE"]}, {"path": "/api/v1/email-configs/test", "methods": ["POST"]}, {"path": "/api/v1/email-templates", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/email-templates/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb),
				('80000000-0000-0000-0000-000000000003', '用户设置', 'settings_user', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/user', 'view.settings_user', 'carbon:user-settings', 3, 1, '[{"path": "/api/v1/settings", "methods": ["GET", "PUT"]}]'::jsonb),
				('80000000-0000-0000-0000-000000000004', '系统配置', 'settings_system', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/system', 'view.settings_system', 'carbon:settings', 4, 1, '[{"path": "/api/v1/system-configs", "methods": ["GET", "POST", "PUT", "DELETE"]}, {"path": "/api/v1/system-configs/*", "methods": ["GET", "PUT", "DELETE"]}]'::jsonb),
				('80000000-0000-0000-0000-000000000005', '基础设置', 'settings_general', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/general', 'view.settings_general', 'carbon:settings-adjust', 5, 1, '[{"path": "/api/v1/settings", "methods": ["GET", "PUT"]}]'::jsonb)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				parent_id = EXCLUDED.parent_id,
				path = EXCLUDED.path,
				component = EXCLUDED.component,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order,
				api_paths = EXCLUDED.api_paths
		`, config.GetTableName("admin_permissions")),
		fmt.Sprintf(`
			INSERT INTO %s (role_id, permission_id)
			SELECT 'a0000000-0000-0000-0000-000000000001', id FROM %s
			ON CONFLICT DO NOTHING
		`, config.GetTableName("admin_role_permissions"), config.GetTableName("admin_permissions")),
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("插入默认数据失败: %w", err)
		}
	}

	return nil
}

func init() {
	migrations.Register(NewAdminMigration())
}
