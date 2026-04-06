package webadmin

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"warforge-server/config"
	"warforge-server/database"
	webadminRouter "warforge-server/internal/interfaces/http/webadmin/router"

	"github.com/gin-gonic/gin"
)

func NewServer() *http.Server {
	cfg := config.AppConfig
	if cfg == nil || !cfg.WebAdmin.Enabled {
		return nil
	}

	database.EnsureDB()
	database.EnsureRedis()

	gin.SetMode(gin.ReleaseMode)
	router := webadminRouter.SetupRouter()

	addr := ":" + strconv.Itoa(cfg.WebAdmin.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	return server
}

func StopServer(server *http.Server) {
	if server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}
}
