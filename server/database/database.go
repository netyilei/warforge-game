// Package database 提供数据库连接管理
//
// 本文件实现数据库连接管理，包括：
// - SQL 数据库连接（由 Nakama 提供）
// - Redis 连接（供独立 webadmin 服务使用）
// - Redis Key 定义（供独立 webadmin 服务使用）
//
// 设计原则：
// - 数据库连接是服务的基础依赖，启动时必须确保连接成功
// - Handler 不应关心数据库连接状态，直接使用 MustGetDB()
// - 运行时数据库断开由 Recovery 中间件统一处理
package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

// DB SQL 数据库实例（由 Nakama 提供）
var DB *sql.DB

// RedisClient Redis 客户端实例
var RedisClient *redis.Client

// InitDB 初始化 SQL 数据库连接
//
// 保存 Nakama 提供的 SQL 连接
func InitDB(sqlDB *sql.DB) {
	DB = sqlDB
}

// GetDB 获取 SQL 数据库实例
//
// 返回数据库实例，可能为 nil
func GetDB() *sql.DB {
	return DB
}

// MustGetDB 获取 SQL 数据库实例（必须可用）
//
// 如果数据库不可用则 panic，适用于服务启动时检查
// Handler 中使用此方法，由 Recovery 中间件捕获 panic
func MustGetDB() *sql.DB {
	if DB == nil {
		panic("database connection not initialized")
	}
	return DB
}

// CheckDB 检查数据库连接是否可用
//
// 返回数据库连接状态和错误信息
func CheckDB() error {
	if DB == nil {
		return fmt.Errorf("database connection is nil")
	}
	ctx := context.Background()
	return DB.PingContext(ctx)
}

// EnsureDB 确保数据库连接可用
//
// 如果数据库不可用则记录错误并退出程序
// 应在服务启动时调用
func EnsureDB() {
	if DB == nil {
		log.Fatal("[FATAL] Database connection is nil, service cannot start")
	}
	ctx := context.Background()
	if err := DB.PingContext(ctx); err != nil {
		log.Fatalf("[FATAL] Database ping failed: %v, service cannot start", err)
	}
	log.Println("[INFO] Database connection verified")
}

// InitRedis 初始化 Redis 连接
//
// 连接到 Redis 服务器
func InitRedis(host string, port int, password string, db int) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", host, port),
		Password: password,
		DB:       db,
	})

	ctx := context.Background()
	return RedisClient.Ping(ctx).Err()
}

// GetRedis 获取 Redis 客户端实例
func GetRedis() *redis.Client {
	return RedisClient
}

// MustGetRedis 获取 Redis 客户端实例（必须可用）
//
// 如果 Redis 不可用则 panic
func MustGetRedis() *redis.Client {
	if RedisClient == nil {
		panic("redis connection not initialized")
	}
	return RedisClient
}

// EnsureRedis 确保 Redis 连接可用
//
// 如果 Redis 不可用则记录错误并退出程序
// 应在服务启动时调用
func EnsureRedis() {
	if RedisClient == nil {
		log.Println("[WARN] Redis connection is nil, continuing without Redis")
		return
	}
	ctx := context.Background()
	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("[WARN] Redis ping failed: %v, continuing without Redis", err)
		return
	}
	log.Println("[INFO] Redis connection verified")
}

// GetEnvOrDefault 获取环境变量或返回默认值
func GetEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
