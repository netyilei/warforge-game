package migrations

import (
	"database/sql"
	"log"
)

func Run(db *sql.DB) error {
	migrations := []struct {
		name string
		sql  string
	}{
		{
			name: "create_email_configs",
			sql: `
				CREATE TABLE IF NOT EXISTS wf_email_configs (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(100) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					protocol VARCHAR(20) NOT NULL DEFAULT 'smtp',
					host VARCHAR(255) NOT NULL,
					port INT NOT NULL,
					username VARCHAR(255) NOT NULL,
					password VARCHAR(255),
					from_name VARCHAR(100),
					from_email VARCHAR(255) NOT NULL,
					is_default BOOLEAN DEFAULT FALSE,
					status SMALLINT DEFAULT 1,
					sort_order INT DEFAULT 0,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_wf_email_configs_code ON wf_email_configs(code);
				CREATE INDEX IF NOT EXISTS idx_wf_email_configs_status ON wf_email_configs(status);
				CREATE INDEX IF NOT EXISTS idx_wf_email_configs_is_default ON wf_email_configs(is_default);
			`,
		},
		{
			name: "create_email_templates",
			sql: `
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
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_wf_email_templates_code ON wf_email_templates(code);
				CREATE INDEX IF NOT EXISTS idx_wf_email_templates_status ON wf_email_templates(status);
			`,
		},
		{
			name: "add_email_config_encryption",
			sql: `
				ALTER TABLE wf_email_configs ADD COLUMN IF NOT EXISTS encryption VARCHAR(20) DEFAULT 'tls';
				UPDATE wf_email_configs SET encryption = 'tls' WHERE encryption IS NULL;
			`,
		},
		{
			name: "add_email_menu",
			sql: `
				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000004', '邮件配置', 'settings_email', 'menu', '80000000-0000-0000-0000-000000000000', '/settings/email', 'view.settings_email', 'mdi:email', 4, true, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE code = 'settings_email');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000010', '查看邮箱配置', 'email_config_view', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 1, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000010');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000011', '创建邮箱配置', 'email_config_create', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 2, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000011');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000012', '编辑邮箱配置', 'email_config_edit', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 3, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000012');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000013', '删除邮箱配置', 'email_config_delete', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 4, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000013');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000020', '查看邮件模板', 'email_template_view', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 5, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000020');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000021', '创建邮件模板', 'email_template_create', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 6, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000021');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000022', '编辑邮件模板', 'email_template_edit', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 7, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000022');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000023', '删除邮件模板', 'email_template_delete', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 8, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000023');

				INSERT INTO wf_admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
				SELECT '80000000-0000-0000-0000-000000000030', '发送测试邮件', 'email_send_test', 'button', '80000000-0000-0000-0000-000000000004', NULL, NULL, NULL, 9, false, 1
				WHERE NOT EXISTS (SELECT 1 FROM wf_admin_permissions WHERE id = '80000000-0000-0000-0000-000000000030');
			`,
		},
		{
			name: "insert_default_email_templates",
			sql: `
				INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status)
				SELECT 
					'注册验证码', 
					'verification_code', 
					'【战争熔炉】您的验证码', 
					'html',
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
					'{"code": {"description": "验证码", "example": "123456"}, "email": {"description": "用户邮箱", "example": "user@example.com"}}',
					1
				WHERE NOT EXISTS (SELECT 1 FROM wf_email_templates WHERE code = 'verification_code');

				INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status)
				SELECT 
					'密码重置', 
					'password_reset', 
					'【战争熔炉】密码重置请求', 
					'html',
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
					'{"token": {"description": "重置令牌", "example": "abc123def456"}, "email": {"description": "用户邮箱", "example": "user@example.com"}}',
					1
				WHERE NOT EXISTS (SELECT 1 FROM wf_email_templates WHERE code = 'password_reset');

				INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status)
				SELECT 
					'欢迎邮件', 
					'welcome', 
					'【战争熔炉】欢迎加入', 
					'html',
					'<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
	<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
		<h1 style="color: #fff; margin: 0; font-size: 28px;">欢迎加入战争熔炉</h1>
	</div>
	<div style="background: #fff; padding: 40px 30px; border: 1px solid #eee; border-top: none;">
		<p style="color: #333; font-size: 16px; line-height: 1.8;">亲爱的 <strong>{{name}}</strong>，</p>
		<p style="color: #333; font-size: 16px; line-height: 1.8;">欢迎加入战争熔炉！我们很高兴您成为我们的一员。</p>
		<p style="color: #333; font-size: 16px; line-height: 1.8;">在这里，您将体验到：</p>
		<ul style="color: #333; font-size: 16px; line-height: 2;">
			<li>精彩刺激的战斗体验</li>
			<li>丰富的游戏内容</li>
			<li>热情友好的玩家社区</li>
		</ul>
		<p style="color: #333; font-size: 16px; line-height: 1.8; margin-top: 30px;">祝您游戏愉快！</p>
	</div>
	<div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
		<p style="color: #999; font-size: 12px; margin: 0;">此邮件由系统自动发送，请勿直接回复</p>
	</div>
</div>',
					'新用户注册成功后发送的欢迎邮件',
					'{"name": {"description": "用户昵称", "example": "玩家123"}, "game_name": {"description": "游戏名称", "example": "战争熔炉"}}',
					1
				WHERE NOT EXISTS (SELECT 1 FROM wf_email_templates WHERE code = 'welcome');

				INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status)
				SELECT 
					'系统通知', 
					'notice', 
					'【战争熔炉】系统通知', 
					'html',
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
					'{"title": {"description": "通知标题", "example": "维护通知"}, "content": {"description": "通知内容", "example": "服务器将于今晚维护..."}}',
					1
				WHERE NOT EXISTS (SELECT 1 FROM wf_email_templates WHERE code = 'notice');

				INSERT INTO wf_email_templates (name, code, subject, content_type, content, description, variables, status)
				SELECT 
					'绑定邮箱验证', 
					'bind_email', 
					'【战争熔炉】绑定邮箱验证', 
					'html',
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
					'{"code": {"description": "验证码", "example": "123456"}, "email": {"description": "用户邮箱", "example": "user@example.com"}}',
					1
				WHERE NOT EXISTS (SELECT 1 FROM wf_email_templates WHERE code = 'bind_email');
			`,
		},
		{
			name: "assign_email_permissions_to_super_admin",
			sql: `
				INSERT INTO wf_admin_role_permissions (role_id, permission_id)
				SELECT '00000000-0000-0000-0000-000000000001', id FROM wf_admin_permissions 
				WHERE code IN ('settings_email', 'email_config_view', 'email_config_create', 'email_config_edit', 'email_config_delete', 'email_template_view', 'email_template_create', 'email_template_edit', 'email_template_delete', 'email_send_test')
				AND NOT EXISTS (
					SELECT 1 FROM wf_admin_role_permissions 
					WHERE role_id = '00000000-0000-0000-0000-000000000001' 
					AND permission_id = wf_admin_permissions.id
				);
			`,
		},
		{
			name: "create_content_tables",
			sql: `
				CREATE TABLE IF NOT EXISTS wf_content_categories (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(100) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					icon VARCHAR(255),
					parent_id UUID,
					content_type VARCHAR(50) DEFAULT 'article',
					description VARCHAR(500),
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_wf_content_categories_code ON wf_content_categories(code);
				CREATE INDEX IF NOT EXISTS idx_wf_content_categories_parent ON wf_content_categories(parent_id);

				CREATE TABLE IF NOT EXISTS wf_contents (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					category_id UUID NOT NULL,
					author_id UUID,
					cover_image VARCHAR(500),
					is_marquee BOOLEAN DEFAULT FALSE,
					is_popup BOOLEAN DEFAULT FALSE,
					start_time TIMESTAMP,
					end_time TIMESTAMP,
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP
				);
				CREATE INDEX IF NOT EXISTS idx_wf_contents_category ON wf_contents(category_id);
				CREATE INDEX IF NOT EXISTS idx_wf_contents_status ON wf_contents(status);

				CREATE TABLE IF NOT EXISTS wf_content_translations (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					content_id UUID NOT NULL,
					lang VARCHAR(10) NOT NULL,
					title VARCHAR(255) NOT NULL,
					summary TEXT,
					content TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					UNIQUE(content_id, lang)
				);
				CREATE INDEX IF NOT EXISTS idx_wf_content_translations_content ON wf_content_translations(content_id);
				CREATE INDEX IF NOT EXISTS idx_wf_content_translations_lang ON wf_content_translations(lang);
			`,
		},
	}

	for _, m := range migrations {
		_, err := db.Exec(m.sql)
		if err != nil {
			log.Printf("[WARN] Migration '%s' failed (may already exist): %v", m.name, err)
		} else {
			log.Printf("[INFO] Migration '%s' completed", m.name)
		}
	}

	return nil
}
