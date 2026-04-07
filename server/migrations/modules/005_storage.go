package modules

import (
	"database/sql"
	"fmt"

	"warforge-server/config"
	"warforge-server/migrations"
)

type StorageMigration struct {
	*migrations.BaseMigration
}

func NewStorageMigration() *StorageMigration {
	return &StorageMigration{
		BaseMigration: migrations.NewBaseMigration("005", "storage"),
	}
}

func (m *StorageMigration) Up(db *sql.DB) error {
	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "storage_configs",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(100) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					driver VARCHAR(20) NOT NULL,
					bucket VARCHAR(100) NOT NULL,
					endpoint VARCHAR(255),
					region VARCHAR(50),
					access_key VARCHAR(255),
					secret_key VARCHAR(255),
					custom_url VARCHAR(255),
					public_domain VARCHAR(255),
					is_default BOOLEAN DEFAULT FALSE,
					status SMALLINT DEFAULT 1,
					sort_order INT DEFAULT 0,
					max_file_size BIGINT DEFAULT 0,
					allowed_types VARCHAR(500) DEFAULT '',
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("storage_configs")),
		},
		{
			name: "upload_records",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL,
					user_type VARCHAR(20) DEFAULT 'admin',
					original_name VARCHAR(255) NOT NULL,
					file_path VARCHAR(500) NOT NULL,
					file_size BIGINT NOT NULL,
					mime_type VARCHAR(100),
					storage_id UUID,
					upload_type VARCHAR(50),
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("upload_records")),
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
		{"idx_wf_storage_configs_code", "storage_configs", "code"},
		{"idx_wf_storage_configs_status", "storage_configs", "status"},
		{"idx_wf_storage_configs_default", "storage_configs", "is_default"},
		{"idx_wf_upload_records_uploader", "upload_records", "uploader_id"},
		{"idx_wf_upload_records_type", "upload_records", "upload_type"},
		{"idx_wf_upload_records_created", "upload_records", "created_at"},
	}

	for _, idx := range indexes {
		tableName := config.GetTableName(idx.table)
		if err := migrations.CreateIndexIfNotExists(db, idx.name, tableName, idx.columns); err != nil {
			return fmt.Errorf("创建索引 %s 失败: %w", idx.name, err)
		}
	}

	return nil
}

func (m *StorageMigration) Seed(db *sql.DB) error {
	return nil
}

func init() {
	migrations.Register(NewStorageMigration())
}
