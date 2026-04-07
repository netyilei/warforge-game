package migrations

import (
	"database/sql"
	"fmt"
	"log"
	"sort"
	"sync"

	"warforge-server/config"
)

type Manager struct {
	db         *sql.DB
	config     *config.MigrationConfig
	migrations []Migration
	mu         sync.Mutex
}

func NewManager(db *sql.DB, cfg *config.MigrationConfig) *Manager {
	return &Manager{
		db:         db,
		config:     cfg,
		migrations: make([]Migration, 0),
	}
}

func (m *Manager) Register(migration Migration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.migrations = append(m.migrations, migration)
}

func (m *Manager) Run() error {
	if !m.config.AutoRun {
		log.Println("[Migration] 自动迁移已禁用，跳过迁移")
		return nil
	}

	log.Println("[Migration] 开始执行数据库迁移...")

	if err := m.createMigrationTable(); err != nil {
		return fmt.Errorf("创建迁移记录表失败: %w", err)
	}

	sort.Slice(m.migrations, func(i, j int) bool {
		return m.migrations[i].Version() < m.migrations[j].Version()
	})

	for _, migration := range m.migrations {
		if err := m.runMigration(migration); err != nil {
			return fmt.Errorf("执行迁移 %s 失败: %w", migration.Version(), err)
		}
	}

	log.Println("[Migration] 数据库迁移完成")
	return nil
}

func (m *Manager) createMigrationTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS wf_schema_migrations (
			version VARCHAR(50) PRIMARY KEY,
			module VARCHAR(50) NOT NULL,
			executed_at TIMESTAMP DEFAULT NOW()
		)
	`
	_, err := m.db.Exec(query)
	return err
}

func (m *Manager) isMigrationExecuted(version string) (bool, error) {
	var count int
	err := m.db.QueryRow(
		"SELECT COUNT(*) FROM wf_schema_migrations WHERE version = $1",
		version,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (m *Manager) recordMigration(version, module string) error {
	_, err := m.db.Exec(
		"INSERT INTO wf_schema_migrations (version, module) VALUES ($1, $2)",
		version,
		module,
	)
	return err
}

func (m *Manager) runMigration(migration Migration) error {
	executed, err := m.isMigrationExecuted(migration.Version())
	if err != nil {
		return err
	}

	if executed {
		log.Printf("[Migration] 迁移 %s (%s) 已执行，跳过", migration.Version(), migration.Module())
		return nil
	}

	log.Printf("[Migration] 执行迁移 %s (%s)...", migration.Version(), migration.Module())

	if err := migration.Up(m.db); err != nil {
		return err
	}

	if m.config.AutoSeed {
		if err := migration.Seed(m.db); err != nil {
			log.Printf("[Migration] 迁移 %s 默认数据插入失败: %v", migration.Version(), err)
		}
	}

	if err := m.recordMigration(migration.Version(), migration.Module()); err != nil {
		return err
	}

	log.Printf("[Migration] 迁移 %s (%s) 完成", migration.Version(), migration.Module())
	return nil
}

func TableExists(db *sql.DB, tableName string) (bool, error) {
	var exists bool
	err := db.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)
	`, tableName).Scan(&exists)
	return exists, err
}

func ColumnExists(db *sql.DB, tableName, columnName string) (bool, error) {
	var exists bool
	err := db.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_schema = 'public' 
			AND table_name = $1
			AND column_name = $2
		)
	`, tableName, columnName).Scan(&exists)
	return exists, err
}

func IndexExists(db *sql.DB, tableName, indexName string) (bool, error) {
	var exists bool
	err := db.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM pg_indexes 
			WHERE schemaname = 'public' 
			AND tablename = $1
			AND indexname = $2
		)
	`, tableName, indexName).Scan(&exists)
	return exists, err
}

func AddColumnIfNotExists(db *sql.DB, tableName, columnName, columnDef string) error {
	exists, err := ColumnExists(db, tableName, columnName)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnDef)
	_, err = db.Exec(query)
	return err
}

func CreateIndexIfNotExists(db *sql.DB, indexName, tableName, columns string) error {
	exists, err := IndexExists(db, tableName, indexName)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	query := fmt.Sprintf("CREATE INDEX IF NOT EXISTS %s ON %s (%s)", indexName, tableName, columns)
	_, err = db.Exec(query)
	return err
}
