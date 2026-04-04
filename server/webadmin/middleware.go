package webadmin

import (
	"strings"
	"time"
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/jwtutil"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenStr = authHeader[7:]
		}

		claims, err := jwtutil.ValidateToken(tokenStr)
		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

func PermissionMiddleware(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		gormDB := database.GetDB()
		hasPermission, _ := models.AdminPermission{}.CheckPermission(gormDB, userID.(string), permission)
		if !hasPermission {
			c.JSON(403, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}

type actionConfig struct {
	action     string
	targetType string
}

var routeActionMap = map[string]actionConfig{
	"POST /api-v1/admin-users":             {"create", "admin_user"},
	"PUT /api-v1/admin-users":              {"update", "admin_user"},
	"DELETE /api-v1/admin-users":           {"delete", "admin_user"},
	"POST /api-v1/roles":                   {"create", "role"},
	"PUT /api-v1/roles":                    {"update", "role"},
	"DELETE /api-v1/roles":                 {"delete", "role"},
	"POST /api-v1/permissions":             {"create", "permission"},
	"PUT /api-v1/permissions":              {"update", "permission"},
	"DELETE /api-v1/permissions":           {"delete", "permission"},
	"POST /api-v1/languages":               {"create", "language"},
	"PUT /api-v1/languages":                {"update", "language"},
	"DELETE /api-v1/languages":             {"delete", "language"},
	"POST /api-v1/banners":                 {"create", "banner"},
	"PUT /api-v1/banners":                  {"update", "banner"},
	"DELETE /api-v1/banners":               {"delete", "banner"},
	"POST /api-v1/banner-positions":        {"create", "banner_position"},
	"PUT /api-v1/banner-positions":         {"update", "banner_position"},
	"DELETE /api-v1/banner-positions":      {"delete", "banner_position"},
	"POST /api-v1/categories":              {"create", "category"},
	"PUT /api-v1/categories":               {"update", "category"},
	"DELETE /api-v1/categories":            {"delete", "category"},
	"POST /api-v1/contents":                {"create", "content"},
	"PUT /api-v1/contents":                 {"update", "content"},
	"DELETE /api-v1/contents":              {"delete", "content"},
	"POST /api-v1/storage-configs":         {"create", "storage_config"},
	"PUT /api-v1/storage-configs":          {"update", "storage_config"},
	"DELETE /api-v1/storage-configs":       {"delete", "storage_config"},
	"POST /api-v1/storage-configs/default": {"set_default", "storage_config"},
}

func OperationLogMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		method := c.Request.Method
		if method != "POST" && method != "PUT" && method != "DELETE" {
			return
		}

		statusCode := c.Writer.Status()
		if statusCode < 200 || statusCode >= 300 {
			return
		}

		path := c.Request.URL.Path
		routeKey := method + " " + path

		config, ok := routeActionMap[routeKey]
		if !ok {
			for key, cfg := range routeActionMap {
				if strings.HasPrefix(routeKey, key) {
					config = cfg
					ok = true
					break
				}
			}
		}

		if !ok {
			return
		}

		userID, _ := c.Get("userID")
		username, _ := c.Get("username")

		var userIDPtr *string
		if userID != nil {
			uid := userID.(string)
			userIDPtr = &uid
		}

		usernameStr := ""
		if username != nil {
			usernameStr = username.(string)
		}

		log := &models.OperationLog{
			UserID:     userIDPtr,
			Username:   usernameStr,
			Action:     config.action,
			TargetType: config.targetType,
			TargetID:   extractTargetID(c),
			Details:    buildDetails(c, start),
			IP:         c.ClientIP(),
			UserAgent:  c.Request.UserAgent(),
		}

		db := database.GetDB()
		if db != nil {
			log.Create(db)
		}
	}
}

func extractTargetID(c *gin.Context) string {
	id := c.Param("id")
	if id != "" {
		return id
	}

	id = c.Query("id")
	if id != "" {
		return id
	}

	return ""
}

func buildDetails(c *gin.Context, start time.Time) string {
	var details strings.Builder
	details.WriteString(c.Request.Method)
	details.WriteString(" ")
	details.WriteString(c.Request.URL.Path)
	details.WriteString(" (")
	details.WriteString(time.Since(start).String())
	details.WriteString(")")

	return details.String()
}
