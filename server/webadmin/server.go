// Package webadmin 提供管理后台 Web 服务
//
// 本包实现管理后台的 HTTP API 服务，包括：
// - 认证管理（登录、登出、密码修改）
// - 用户管理
// - 角色管理
// - 权限管理
// - 系统设置
//
// 设计原则：
// - 服务启动时确保数据库和 Redis 连接可用
// - Handler 不关心数据库连接状态，直接使用 database.MustGetDB()
// - 使用统一响应格式（Success、Error 等）
package webadmin

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"warforge-server/config"
	"warforge-server/database"

	"github.com/gin-gonic/gin"
)

// StartServer 启动 Web Admin 服务
//
// 启动前会检查数据库和 Redis 连接是否可用
// 如果连接不可用，服务将无法启动
func StartServer() *http.Server {
	cfg := config.AppConfig
	if cfg == nil || !cfg.WebAdmin.Enabled {
		return nil
	}

	database.EnsureDB()
	database.EnsureRedis()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())

	registerRoutes(router)

	addr := ":" + strconv.Itoa(cfg.WebAdmin.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return
		}
	}()

	return server
}

// StopServer 停止 Web Admin 服务
func StopServer(server *http.Server) {
	if server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}
}

// corsMiddleware CORS 中间件
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
