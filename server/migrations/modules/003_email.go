package modules

import (
	"database/sql"
	"fmt"

	"warforge-server/config"
	"warforge-server/migrations"
)

type EmailMigration struct {
	*migrations.BaseMigration
}

func NewEmailMigration() *EmailMigration {
	return &EmailMigration{
		BaseMigration: migrations.NewBaseMigration("003", "email"),
	}
}

func (m *EmailMigration) Up(db *sql.DB) error {
	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "email_configs",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
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
				)
			`, config.GetTableName("email_configs")),
		},
		{
			name: "email_templates",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
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
				)
			`, config.GetTableName("email_templates")),
		},
		{
			name: "email_logs",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					task_id VARCHAR(100),
					to_email VARCHAR(255) NOT NULL,
					subject VARCHAR(255),
					source VARCHAR(50),
					status VARCHAR(20) NOT NULL,
					error_message TEXT,
					retry_count INT DEFAULT 0,
					created_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("email_logs")),
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
		{"idx_wf_email_configs_code", "email_configs", "code"},
		{"idx_wf_email_configs_status", "email_configs", "status"},
		{"idx_wf_email_configs_default", "email_configs", "is_default"},
		{"idx_wf_email_templates_code", "email_templates", "code"},
		{"idx_wf_email_templates_status", "email_templates", "status"},
		{"idx_wf_email_logs_task", "email_logs", "task_id"},
		{"idx_wf_email_logs_status", "email_logs", "status"},
		{"idx_wf_email_logs_created", "email_logs", "created_at"},
	}

	for _, idx := range indexes {
		tableName := config.GetTableName(idx.table)
		if err := migrations.CreateIndexIfNotExists(db, idx.name, tableName, idx.columns); err != nil {
			return fmt.Errorf("创建索引 %s 失败: %w", idx.name, err)
		}
	}

	return nil
}

func (m *EmailMigration) Seed(db *sql.DB) error {
	queries := []string{
		fmt.Sprintf(`
			INSERT INTO %s (name, code, subject, content_type, content, description, variables, status)
			VALUES 
				(
					'验证码邮件',
					'verification_code',
					'您的验证码',
					'html',
					'<p>您的验证码是：<strong>{{.Code}}</strong></p><p>有效期 {{.ExpireMinutes}} 分钟</p>',
					'用户验证码邮件模板',
					'{"Code": "验证码", "ExpireMinutes": "过期时间(分钟)"}',
					1
				),
				(
					'密码重置邮件',
					'password_reset',
					'重置密码',
					'html',
					'<p>点击链接重置密码：<a href="{{.ResetLink}}">{{.ResetLink}}</a></p><p>有效期 {{.ExpireMinutes}} 分钟</p>',
					'密码重置邮件模板',
					'{"ResetLink": "重置链接", "ExpireMinutes": "过期时间(分钟)"}',
					1
				),
				(
					'欢迎邮件',
					'welcome',
					'欢迎加入',
					'html',
					'<p>亲爱的 {{.Username}}，欢迎加入我们！</p>',
					'新用户欢迎邮件模板',
					'{"Username": "用户名"}',
					1
				),
				(
					'通知邮件',
					'notice',
					'系统通知',
					'html',
					'<p>{{.Content}}</p>',
					'系统通知邮件模板',
					'{"Content": "通知内容"}',
					1
				),
				(
					'绑定邮箱',
					'bind_email',
					'绑定邮箱验证',
					'html',
					'<p>您的验证码是：<strong>{{.Code}}</strong></p><p>有效期 {{.ExpireMinutes}} 分钟</p>',
					'绑定邮箱验证码模板',
					'{"Code": "验证码", "ExpireMinutes": "过期时间(分钟)"}',
					1
				)
			ON CONFLICT (code) DO NOTHING
		`, config.GetTableName("email_templates")),
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("插入默认数据失败: %w", err)
		}
	}

	return nil
}

func init() {
	migrations.Register(NewEmailMigration())
}
