package migrations

import (
	"database/sql"
	"log"

	"warforge-server/config"
)

var (
	globalManager *Manager
	registry      = make(map[string]Migration)
)

func InitGlobalManager(db interface{}, cfg interface{}) {
	var sqlDB *sql.DB
	var migCfg *config.MigrationConfig

	switch v := db.(type) {
	case *sql.DB:
		sqlDB = v
	default:
		log.Printf("[Migration] Warning: unsupported database type: %T", db)
		return
	}

	switch v := cfg.(type) {
	case *config.MigrationConfig:
		migCfg = v
	default:
		log.Printf("[Migration] Warning: unsupported config type: %T", cfg)
		return
	}

	globalManager = NewManager(sqlDB, migCfg)

	for version, migration := range registry {
		globalManager.Register(migration)
		log.Printf("[Migration] Registered migration: %s", version)
	}
}

func Register(migration Migration) {
	if migration == nil {
		return
	}

	version := migration.Version()
	if _, exists := registry[version]; exists {
		log.Printf("[Migration] Warning: migration version %s already registered", version)
		return
	}

	registry[version] = migration

	if globalManager != nil {
		globalManager.Register(migration)
	}
}

func RunGlobal() error {
	if globalManager == nil {
		log.Println("[Migration] Warning: global manager not initialized")
		return nil
	}
	return globalManager.Run()
}

func AutoRegister(migrations ...Migration) {
	for _, m := range migrations {
		Register(m)
	}
}

func GetRegisteredMigrations() []Migration {
	result := make([]Migration, 0, len(registry))
	for _, m := range registry {
		result = append(result, m)
	}
	return result
}
