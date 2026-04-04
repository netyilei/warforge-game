// Package database 提供数据库连接管理
//
// 本文件实现数据库连接管理，包括：
// - SQL 数据库连接（由 Nakama 提供）
// - Redis 连接（供独立 webadmin 服务使用）
// - Redis Key 定义（供独立 webadmin 服务使用）
package database

import (
	"context"
	"database/sql"
	"fmt"

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
func GetDB() *sql.DB {
	return DB
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
