package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"strings"
	"time"

	"warforge-server/database"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/pkg/utils"

	"github.com/gin-gonic/gin"
)

type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func OperationLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/v1/auth/login") || strings.HasPrefix(path, "/api/v1/auth/refresh-token") ||
			strings.HasPrefix(path, "/api/v2/auth") {
			c.Next()
			return
		}

		start := time.Now()

		blw := &responseWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()

		if statusCode >= 400 {
			return
		}

		userID, _ := c.Get("userID")
		username, _ := c.Get("username")

		if userID == nil || username == nil {
			return
		}

		action := getActionFromMethod(c.Request.Method)
		targetType, targetID := getTargetFromPath(path)

		details := buildDetails(c, latency, statusCode)

		go func() {
			defer func() {
				if r := recover(); r != nil {
					slog.Error("Operation log panic", "error", r)
				}
			}()

			db := database.MustGetDB()
			repo := adminpersistence.NewOperationLogRepository(db)

			log := admindomain.NewOperationLog(utils.GenerateUUID(), username.(string), action)
			uid := userID.(string)
			log.SetUserID(&uid)
			log.SetTargetType(targetType)
			log.SetTargetID(targetID)
			log.SetDetails(details)
			log.SetIP(c.ClientIP())
			log.SetUserAgent(c.Request.UserAgent())

			if err := repo.Save(context.Background(), log); err != nil {
				slog.Error("Failed to save operation log", "error", err)
			}
		}()
	}
}

func getActionFromMethod(method string) string {
	switch method {
	case "POST":
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	case "GET":
		return "view"
	default:
		return method
	}
}

func getTargetFromPath(path string) (string, string) {
	parts := strings.Split(strings.Trim(path, "/"), "/")

	if len(parts) < 3 {
		return "unknown", ""
	}

	targetType := parts[2]
	targetID := ""

	if len(parts) > 3 {
		targetID = parts[3]
	}

	targetType = strings.TrimSuffix(targetType, "s")

	switch targetType {
	case "categorie":
		targetType = "category"
	case "content":
		targetType = "content"
	case "banner-group":
		targetType = "banner_group"
	case "banner":
		targetType = "banner"
	case "language":
		targetType = "language"
	case "admin":
		targetType = "admin"
	case "role":
		targetType = "role"
	case "permission":
		targetType = "permission"
	case "menu":
		targetType = "menu"
	case "operation-log":
		targetType = "operation_log"
	case "storage-config":
		targetType = "storage_config"
	case "upload-record":
		targetType = "upload_record"
	case "email-config":
		targetType = "email_config"
	case "email-template":
		targetType = "email_template"
	case "system-config":
		targetType = "system_config"
	case "setting":
		targetType = "setting"
	case "support":
		targetType = "support"
	}

	return targetType, targetID
}

func buildDetails(c *gin.Context, latency time.Duration, statusCode int) string {
	details := map[string]interface{}{
		"method":     c.Request.Method,
		"path":       c.Request.URL.Path,
		"query":      c.Request.URL.RawQuery,
		"status":     statusCode,
		"latency_ms": latency.Milliseconds(),
	}

	if c.Request.Method != "GET" && c.Request.Body != nil {
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err == nil && len(bodyBytes) > 0 {
			var bodyMap map[string]interface{}
			if json.Unmarshal(bodyBytes, &bodyMap) == nil {
				if _, ok := bodyMap["password"]; ok {
					bodyMap["password"] = "******"
				}
				details["body"] = bodyMap
			}
		}
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	}

	jsonBytes, _ := json.Marshal(details)
	return string(jsonBytes)
}
