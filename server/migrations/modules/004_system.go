package modules

import (
	"database/sql"
	"fmt"

	"warforge-server/config"
	"warforge-server/migrations"
)

type SystemMigration struct {
	*migrations.BaseMigration
}

func NewSystemMigration() *SystemMigration {
	return &SystemMigration{
		BaseMigration: migrations.NewBaseMigration("004", "system"),
	}
}

func (m *SystemMigration) Up(db *sql.DB) error {
	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "system_configs",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					key VARCHAR(100) PRIMARY KEY,
					value JSONB,
					description VARCHAR(255),
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`, config.GetTableName("system_configs")),
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

	return nil
}

func (m *SystemMigration) Seed(db *sql.DB) error {
	return nil
}

func init() {
	migrations.Register(NewSystemMigration())
}
