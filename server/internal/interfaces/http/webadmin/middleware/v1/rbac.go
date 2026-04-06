package v1

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"warforge-server/database"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

type APIPathConfig struct {
	Path    string   `json:"path"`
	Methods []string `json:"methods"`
}

var (
	skipAuthPaths = map[string]bool{
		"/api/v1/auth/login":         true,
		"/api/v1/auth/refresh-token": true,
	}

	skipRBACPaths = map[string]bool{
		"/api/v1/auth/logout":          true,
		"/api/v1/auth/user-info":       true,
		"/api/v1/auth/change-password": true,
		"/api/v1/auth/profile":         true,
		"/api/v1/auth/routes":          true,
		"/api/v1/menus":                true,
	}
)

func RBAC() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := c.Request.Method

		if skipAuthPaths[path] {
			c.Next()
			return
		}

		if skipRBACPaths[path] {
			c.Next()
			return
		}

		userID, exists := c.Get("userID")
		if !exists {
			response.Unauthorized(c, "未登录")
			c.Abort()
			return
		}

		hasPermission, err := checkAPIPermission(c.Request.Context(), userID.(string), path, method)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "权限检查失败")
			c.Abort()
			return
		}

		if !hasPermission {
			response.Forbidden(c, "没有权限访问该接口")
			c.Abort()
			return
		}

		c.Next()
	}
}

func checkAPIPermission(ctx context.Context, userID, requestPath, requestMethod string) (bool, error) {
	db := database.MustGetDB()

	query := `
		SELECT DISTINCT p.api_paths
		FROM wf_admin_permissions p
		INNER JOIN wf_admin_role_permissions rp ON p.id = rp.permission_id
		INNER JOIN wf_admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.status = 1 AND p.deleted_at IS NULL AND p.api_paths IS NOT NULL AND p.api_paths::text != '[]'
	`

	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var apiPathsJSON string
		if err := rows.Scan(&apiPathsJSON); err != nil {
			continue
		}

		var configs []APIPathConfig
		if err := json.Unmarshal([]byte(apiPathsJSON), &configs); err != nil {
			continue
		}

		for _, cfg := range configs {
			if matchPath(cfg.Path, requestPath) && containsMethod(cfg.Methods, requestMethod) {
				return true, nil
			}
		}
	}

	return false, nil
}

func matchPath(pattern, path string) bool {
	if pattern == path {
		return true
	}

	regexPattern := strings.ReplaceAll(regexp.QuoteMeta(pattern), `\*`, `[^/]+`)
	regexPattern = `^` + regexPattern + `$`

	matched, _ := regexp.MatchString(regexPattern, path)
	return matched
}

func containsMethod(methods []string, method string) bool {
	for _, m := range methods {
		if m == "*" || strings.EqualFold(m, method) {
			return true
		}
	}
	return false
}
