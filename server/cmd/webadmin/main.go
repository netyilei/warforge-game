package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"

	"warforge-server/config"
	"warforge-server/database"
	webadminRouter "warforge-server/internal/interfaces/http/webadmin/router"
	"warforge-server/pkg/logger"
)

func main() {
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("[FATAL] Failed to load config: %v", err)
	}

	logConfig := logger.DefaultConfig()
	if cfg.Log.Level == "debug" {
		logConfig.Level = -4
	}
	appLogger := logger.NewLogger(logConfig)

	dbDSN := fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.Sslmode,
	)

	db, err := sql.Open("postgres", dbDSN)
	if err != nil {
		log.Fatalf("[FATAL] Failed to open database: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("[FATAL] Failed to ping database: %v", err)
	}

	database.InitDB(db)
	appLogger.Info("Connected to database")

	if cfg.Redis.Host != "" {
		redisClient := redis.NewClient(&redis.Options{
			Addr:     cfg.Redis.Host + ":" + strconv.Itoa(cfg.Redis.Port),
			Password: cfg.Redis.Password,
			DB:       cfg.Redis.DB,
		})

		if err := redisClient.Ping(ctx).Err(); err != nil {
			appLogger.Warn("Redis connection failed: %v, continuing without Redis", err)
		} else {
			appLogger.Info("Connected to Redis")
		}
	}

	database.EnsureDB()
	database.EnsureRedis()

	gin.SetMode(gin.ReleaseMode)
	engine := webadminRouter.SetupRouter()

	srv := &http.Server{
		Addr:    ":" + strconv.Itoa(cfg.WebAdmin.Port),
		Handler: engine,
	}

	go func() {
		appLogger.Info("Starting webadmin server on port %d", cfg.WebAdmin.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	appLogger.Info("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	appLogger.Info("Server exited")
}
