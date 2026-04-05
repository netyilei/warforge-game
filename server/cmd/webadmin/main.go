// Package main 提供 Web Admin API 服务入口
//
// 本文件是 Web Admin API 服务的独立入口点，负责：
// - 加载配置
// - 初始化数据库连接
// - 初始化 Redis 连接
// - 启动 Gin HTTP API 服务
package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"warforge-server/config"
	"warforge-server/database"
	"warforge-server/migrations"
	"warforge-server/webadmin"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	cfg, err := config.LoadConfig("./config/config.yaml")
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		return
	}

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.Sslmode,
	)

	sqlDB, err := sql.Open("pgx", dsn)
	if err != nil {
		fmt.Printf("Failed to open database: %v\n", err)
		return
	}
	defer sqlDB.Close()

	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := sqlDB.Ping(); err != nil {
		fmt.Printf("Failed to ping database: %v\n", err)
		return
	}

	database.InitDB(sqlDB)

	if err := migrations.Run(sqlDB); err != nil {
		fmt.Printf("Failed to run migrations: %v\n", err)
	}

	if cfg.Redis.Host != "" {
		if err := database.InitRedis(cfg.Redis.Host, cfg.Redis.Port, cfg.Redis.Password, cfg.Redis.DB); err != nil {
			fmt.Printf("Failed to init Redis: %v\n", err)
		}
	}

	server := webadmin.NewServer()
	if server == nil {
		fmt.Println("Web Admin server is disabled")
		return
	}

	fmt.Printf("Web Admin API server started on port %d\n", cfg.WebAdmin.Port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("Server error: %v\n", err)
	}
}
