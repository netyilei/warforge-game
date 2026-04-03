package admin

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
	"golang.org/x/crypto/bcrypt"
)

type AdminUser struct {
	ID          string     `json:"id"`
	Username    string     `json:"username"`
	Nickname    string     `json:"nickname"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	Avatar      string     `json:"avatar"`
	Status      int        `json:"status"`
	LastLoginAt *time.Time `json:"lastLoginAt"`
	LastLoginIP string     `json:"lastLoginIp"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type Role struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Status      int    `json:"status"`
	SortOrder   int    `json:"sortOrder"`
}

type Permission struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Code      string `json:"code"`
	Type      string `json:"type"`
	ParentID  string `json:"parentId"`
	Path      string `json:"path"`
	Component string `json:"component"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sortOrder"`
	Status    int    `json:"status"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

type UserInfoResponse struct {
	UserID   string   `json:"userId"`
	UserName string   `json:"userName"`
	Roles    []string `json:"roles"`
	Buttons  []string `json:"buttons"`
}

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Admin Module Loading...")

	if err := initializer.RegisterRpc("admin_login", adminLogin); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_logout", adminLogout); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_change_password", adminChangePassword); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_get_user_info", adminGetUserInfo); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_get_permissions", adminGetPermissions); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_get_roles", adminGetRoles); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_get_users", adminGetUsers); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_get_routes", adminGetRoutes); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_check_route", adminCheckRoute); err != nil {
		return err
	}

	logger.Info("Admin Module Loaded!")
	return nil
}

func adminLogin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req LoginRequest
	var payloadBytes []byte

	switch v := interface{}(payload).(type) {
	case string:
		payloadBytes = []byte(v)
	case []byte:
		payloadBytes = v
	default:
		return `{"error":"Unsupported payload type"}`, nil
	}

	if err := json.Unmarshal(payloadBytes, &req); err != nil {
		return `{"error":"Invalid request format"}`, nil
	}

	var id, username, passwordHash string
	var status int
	query := `SELECT id, username, password_hash, status FROM admin_users WHERE username = $1 AND deleted_at IS NULL`
	err := db.QueryRow(query, req.Username).Scan(&id, &username, &passwordHash, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			return `{"error":"User not found"}`, nil
		}
		return `{"error":"Database error"}`, nil
	}

	if status != 1 {
		return `{"error":"Account is disabled"}`, nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return `{"error":"Invalid password"}`, nil
	}

	expiresAt := time.Now().Add(24 * time.Hour).Unix()
	token, _, err := nk.AuthenticateTokenGenerate(id, "", expiresAt, map[string]string{"type": "admin"})
	if err != nil {
		return `{"error":"Failed to generate token"}`, nil
	}

	refreshToken := token

	_, err = db.Exec(`UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`, id)
	if err != nil {
		logger.Warn("Failed to update last login time: %v", err)
	}

	response := LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
	}

	data, _ := json.Marshal(response)
	return string(data), nil
}

func adminLogout(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return `{"success":true}`, nil
	}

	logger.Info("Admin user logged out: %s", userID)

	return `{"success":true}`, nil
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

func adminChangePassword(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return `{"error":"Unauthorized"}`, nil
	}

	var req ChangePasswordRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request format"}`, nil
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		return `{"error":"Password is required"}`, nil
	}

	if len(req.NewPassword) < 6 {
		return `{"error":"New password must be at least 6 characters"}`, nil
	}

	var currentPasswordHash string
	query := `SELECT password_hash FROM admin_users WHERE id = $1 AND deleted_at IS NULL`
	err := db.QueryRow(query, userID).Scan(&currentPasswordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return `{"error":"User not found"}`, nil
		}
		return `{"error":"Database error"}`, nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(req.OldPassword)); err != nil {
		return `{"error":"Old password is incorrect"}`, nil
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return `{"error":"Failed to hash password"}`, nil
	}

	updateQuery := `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	_, err = db.Exec(updateQuery, string(newHashedPassword), userID)
	if err != nil {
		return `{"error":"Failed to update password"}`, nil
	}

	logger.Info("Admin user changed password: %s", userID)

	return `{"success":true}`, nil
}

func adminGetUserInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return `{"error":"Unauthorized"}`, nil
	}

	var username, nickname string
	query := `SELECT username, COALESCE(nickname, username) FROM admin_users WHERE id = $1 AND deleted_at IS NULL`
	err := db.QueryRow(query, userID).Scan(&username, &nickname)
	if err != nil {
		if err == sql.ErrNoRows {
			return `{"error":"User not found"}`, nil
		}
		return `{"error":"Database error"}`, nil
	}

	rolesQuery := `
		SELECT r.code FROM admin_roles r
		INNER JOIN admin_user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.deleted_at IS NULL AND r.status = 1
	`
	rows, err := db.Query(rolesQuery, userID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			continue
		}
		roles = append(roles, code)
	}

	buttonsQuery := `
		SELECT DISTINCT p.code FROM admin_permissions p
		INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id
		INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'button' AND p.status = 1
	`
	buttonRows, err := db.Query(buttonsQuery, userID)
	if err == nil {
		defer buttonRows.Close()
		var buttons []string
		for buttonRows.Next() {
			var code string
			if err := buttonRows.Scan(&code); err != nil {
				continue
			}
			buttons = append(buttons, code)
		}
	}

	response := UserInfoResponse{
		UserID:   userID,
		UserName: nickname,
		Roles:    roles,
		Buttons:  []string{},
	}

	data, _ := json.Marshal(response)
	return string(data), nil
}

func adminGetPermissions(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return `{"error":"Unauthorized"}`, nil
	}

	query := `
		SELECT DISTINCT p.id, p.name, p.code, p.type, COALESCE(p.parent_id::text, ''), 
		       p.path, p.component, p.icon, p.sort_order, p.status
		FROM admin_permissions p
		INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id
		INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.status = 1
		ORDER BY p.sort_order
	`
	rows, err := db.Query(query, userID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}
	defer rows.Close()

	var permissions []Permission
	for rows.Next() {
		var p Permission
		if err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Type, &p.ParentID,
			&p.Path, &p.Component, &p.Icon, &p.SortOrder, &p.Status); err != nil {
			continue
		}
		permissions = append(permissions, p)
	}

	data, _ := json.Marshal(permissions)
	return string(data), nil
}

func adminGetRoles(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	query := `SELECT id, name, code, description, status, sort_order 
	          FROM admin_roles WHERE deleted_at IS NULL ORDER BY sort_order`
	rows, err := db.Query(query)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var r Role
		if err := rows.Scan(&r.ID, &r.Name, &r.Code, &r.Description, &r.Status, &r.SortOrder); err != nil {
			continue
		}
		roles = append(roles, r)
	}

	data, _ := json.Marshal(roles)
	return string(data), nil
}

func adminGetUsers(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	query := `SELECT id, username, COALESCE(nickname, username), COALESCE(email, ''), 
	          COALESCE(phone, ''), COALESCE(avatar, ''), status, created_at
	          FROM admin_users WHERE deleted_at IS NULL ORDER BY created_at DESC`
	rows, err := db.Query(query)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id, username, nickname, email, phone, avatar string
		var status int
		var createdAt time.Time
		if err := rows.Scan(&id, &username, &nickname, &email, &phone, &avatar, &status, &createdAt); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":        id,
			"username":  username,
			"nickname":  nickname,
			"email":     email,
			"phone":     phone,
			"avatar":    avatar,
			"status":    status,
			"createdAt": createdAt,
		})
	}

	data, _ := json.Marshal(users)
	return string(data), nil
}

type RouteItem struct {
	Name      string      `json:"name"`
	Path      string      `json:"path"`
	Component string      `json:"component"`
	Meta      RouteMeta   `json:"meta"`
	Children  []RouteItem `json:"children,omitempty"`
}

type RouteMeta struct {
	Title      string `json:"title"`
	Icon       string `json:"icon,omitempty"`
	Order      int    `json:"order,omitempty"`
	HideInMenu bool   `json:"hideInMenu,omitempty"`
}

type dbPermission struct {
	ID        string
	Name      string
	Code      string
	Type      string
	ParentID  string
	Path      string
	Component string
	Icon      string
	SortOrder int
}

func adminGetRoutes(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return `{"error":"Unauthorized"}`, nil
	}

	query := `
		SELECT DISTINCT p.id, p.name, p.code, p.type, COALESCE(p.parent_id::text, ''), 
		       p.path, p.component, p.icon, p.sort_order
		FROM admin_permissions p
		INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id
		INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.status = 1 AND p.type = 'menu'
		ORDER BY p.sort_order
	`
	rows, err := db.Query(query, userID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}
	defer rows.Close()

	var permissions []dbPermission
	for rows.Next() {
		var p dbPermission
		if err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Type, &p.ParentID,
			&p.Path, &p.Component, &p.Icon, &p.SortOrder); err != nil {
			continue
		}
		permissions = append(permissions, p)
	}

	routes := buildRouteTree(permissions, "")

	// 过滤掉前端不存在的路由，只保留存在的路由
	// 目前前端只实现了 home（仪表盘）页面
	var filteredRoutes []RouteItem
	for _, r := range routes {
		if r.Component == "view.home" {
			filteredRoutes = append(filteredRoutes, r)
		}
	}

	// 如果没有可用路由，默认添加 home 路由
	if len(filteredRoutes) == 0 {
		filteredRoutes = []RouteItem{
			{
				Name:      "home",
				Path:      "/home",
				Component: "layout.base$view.home",
				Meta: RouteMeta{
					Title: "仪表盘",
					Icon:  "mdi:monitor-dashboard",
					Order: 1,
				},
			},
		}
	}

	response := map[string]interface{}{
		"routes": filteredRoutes,
		"home":   "home",
	}

	data, _ := json.Marshal(response)
	return string(data), nil
}

func buildRouteTree(permissions []dbPermission, parentID string) []RouteItem {
	var routes []RouteItem

	for _, p := range permissions {
		if p.ParentID == parentID {
			route := RouteItem{
				Name:      p.Code,
				Path:      p.Path,
				Component: p.Component,
				Meta: RouteMeta{
					Title: p.Name,
					Icon:  p.Icon,
					Order: p.SortOrder,
				},
			}

			children := buildRouteTree(permissions, p.ID)
			if len(children) > 0 {
				route.Children = children
			}

			routes = append(routes, route)
		}
	}

	return routes
}

func adminCheckRoute(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return "false", nil
	}

	var req struct {
		RouteName string `json:"routeName"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return "false", nil
	}

	query := `
		SELECT COUNT(1) FROM admin_permissions p
		INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id
		INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.code = $2 AND p.status = 1
	`
	var count int
	err := db.QueryRow(query, userID, req.RouteName).Scan(&count)
	if err != nil {
		return "false", nil
	}

	if count > 0 {
		return "true", nil
	}
	return "false", nil
}
