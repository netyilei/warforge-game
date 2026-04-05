// Package webadmin 提供管理后台 Web 服务
//
// 本文件定义管理后台中间件，包括：
// - 认证中间件
// - 权限验证中间件
// - 操作日志中间件
package webadmin

import (
	"strings"
	"time"
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/jwtutil"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 认证中间件
//
// 验证请求中的 JWT Token，解析出用户信息
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

// PermissionMiddleware 权限验证中间件
//
// 验证用户是否有指定的权限代码
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

// OperationLogMiddleware 操作日志中间件
//
// 记录所有写操作（POST/PUT/DELETE）到操作日志表
// 根据请求方法和路径自动推断操作类型和目标类型
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

		action := inferAction(method)
		targetType := inferTargetType(c.Request.URL.Path)
		if targetType == "" {
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
			Action:     action,
			TargetType: targetType,
			TargetID:   extractTargetID(c),
			Details:    buildDetails(c, start),
			IP:         c.ClientIP(),
			UserAgent:  c.Request.UserAgent(),
		}

		db := database.MustGetDB()
		log.Create(db)
	}
}

// inferAction 根据请求方法推断操作类型
func inferAction(method string) string {
	switch method {
	case "POST":
		return "create"
	case "PUT":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return method
	}
}

// inferTargetType 根据请求路径推断目标类型
//
// 从路径中提取资源名称，例如：
// - /api-v1/admin -> admin_user
// - /api-v1/roles -> role
// - /api-v1/content/categories -> category
func inferTargetType(path string) string {
	path = strings.TrimPrefix(path, "/api-v1/")

	parts := strings.Split(path, "/")
	if len(parts) == 0 {
		return ""
	}

	resource := parts[0]
	switch resource {
	case "admin":
		return "admin_user"
	case "roles":
		return "role"
	case "permissions":
		return "permission"
	case "languages":
		return "language"
	case "banner-groups":
		return "banner_group"
	case "banners":
		return "banner"
	case "content":
		if len(parts) > 1 && parts[1] == "categories" {
			return "category"
		}
		return "content"
	case "storage":
		if len(parts) > 1 && parts[1] == "config" {
			return "storage_config"
		}
		return "storage"
	default:
		return resource
	}
}

// extractTargetID 从请求中提取目标 ID
//
// 优先从路径参数中获取，其次从查询参数中获取
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

// buildDetails 构建操作详情字符串
//
// 包含请求方法、路径和耗时
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
