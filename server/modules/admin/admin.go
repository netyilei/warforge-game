package admin

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"

	"warforge-server/database"
	"warforge-server/models"

	"github.com/google/uuid"
	"github.com/heroiclabs/nakama-common/runtime"
	"golang.org/x/crypto/bcrypt"
)

func generateUUID() string {
	return uuid.New().String()
}

func jsonMarshal(v interface{}) (string, error) {
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "")
	err := encoder.Encode(v)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func checkAuth(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return "", false
	}
	return userID, true
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

	if err := initializer.RegisterRpc("admin_get_user_roles", adminGetUserRoles); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_update_user_roles", adminUpdateUserRoles); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_create_user", adminCreateUser); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_update_user", adminUpdateUser); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("admin_delete_user", adminDeleteUser); err != nil {
		return err
	}

	logger.Info("Admin Module Loaded!")
	return nil
}

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) error {
	if err := database.InitGORM(db); err != nil {
		logger.Error("Failed to initialize GORM: %v", err)
		return err
	}
	logger.Info("GORM initialized successfully")
	return nil
}

func adminLogin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req LoginRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request format"}`, nil
	}

	gormDB := database.GetDB()
	user, err := models.AdminUser{}.FindByUsername(gormDB, req.Username)
	if err != nil {
		return `{"error":"User not found"}`, nil
	}

	if user.Status != 1 {
		return `{"error":"Account is disabled"}`, nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return `{"error":"Invalid password"}`, nil
	}

	expiresAt := int64(86400)
	token, _, err := nk.AuthenticateTokenGenerate(user.ID, "", expiresAt, map[string]string{"type": "admin"})
	if err != nil {
		return `{"error":"Failed to generate token"}`, nil
	}

	models.AdminUser{}.UpdateLastLogin(gormDB, user.ID)

	response := LoginResponse{
		Token:        token,
		RefreshToken: token,
	}

	data, _ := jsonMarshal(response)
	return data, nil
}

func adminLogout(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"success":true}`, nil
}

func adminChangePassword(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request format"}`, nil
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		return `{"error":"Password is required"}`, nil
	}

	if len(req.NewPassword) < 6 {
		return `{"error":"New password must be at least 6 characters"}`, nil
	}

	gormDB := database.GetDB()
	user, err := models.AdminUser{}.FindByID(gormDB, userID)
	if err != nil {
		return `{"error":"User not found"}`, nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return `{"error":"Old password is incorrect"}`, nil
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return `{"error":"Failed to hash password"}`, nil
	}

	if err := (models.AdminUser{}).UpdatePassword(gormDB, userID, string(newHashedPassword)); err != nil {
		return `{"error":"Failed to update password"}`, nil
	}

	return `{"success":true}`, nil
}

func adminGetUserInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	gormDB := database.GetDB()
	user, err := models.AdminUser{}.FindByID(gormDB, userID)
	if err != nil {
		return `{"error":"User not found"}`, nil
	}

	nickname := user.Nickname
	if nickname == "" {
		nickname = user.Username
	}

	roles, _ := models.AdminUser{}.GetRoleCodes(gormDB, userID)
	buttons, _ := models.AdminUser{}.GetButtonCodes(gormDB, userID)

	response := UserInfoResponse{
		UserID:   userID,
		UserName: nickname,
		Roles:    roles,
		Buttons:  buttons,
	}

	data, _ := jsonMarshal(response)
	return data, nil
}

func adminGetPermissions(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	gormDB := database.GetDB()
	permissions, err := models.AdminPermission{}.GetByUserID(gormDB, userID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}

	data, _ := jsonMarshal(permissions)
	return data, nil
}

func adminGetRoles(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	gormDB := database.GetDB()
	roles, err := models.AdminRole{}.ListAll(gormDB)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}

	data, _ := jsonMarshal(roles)
	return data, nil
}

func adminGetUsers(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	gormDB := database.GetDB()
	users, err := models.AdminUser{}.ListAll(gormDB)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}

	data, _ := jsonMarshal(users)
	return data, nil
}

func adminGetUserRoles(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}
	if req.UserID == "" {
		return `{"error":"User ID is required"}`, nil
	}

	gormDB := database.GetDB()
	roleIDs, err := models.AdminUser{}.GetRoleIDs(gormDB, req.UserID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}

	data, _ := jsonMarshal(roleIDs)
	return data, nil
}

func adminUpdateUserRoles(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		UserID  string   `json:"userId"`
		RoleIDs []string `json:"roleIds"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}
	if req.UserID == "" {
		return `{"error":"User ID is required"}`, nil
	}

	gormDB := database.GetDB()
	if err := (models.AdminUser{}).SetRoles(gormDB, req.UserID, req.RoleIDs); err != nil {
		return `{"error":"Failed to update roles"}`, nil
	}

	return `{"success":true}`, nil
}

func adminCreateUser(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		Username string   `json:"username"`
		Password string   `json:"password"`
		Nickname string   `json:"nickname"`
		Email    string   `json:"email"`
		Phone    string   `json:"phone"`
		Status   int      `json:"status"`
		Roles    []string `json:"roles"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}
	if req.Username == "" || req.Password == "" {
		return `{"error":"Username and password are required"}`, nil
	}

	gormDB := database.GetDB()
	if (models.AdminUser{}).ExistsByUsername(gormDB, req.Username) {
		return `{"error":"Username already exists"}`, nil
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return `{"error":"Failed to hash password"}`, nil
	}

	user := &models.AdminUser{
		ID:       generateUUID(),
		Username: req.Username,
		Password: string(passwordHash),
		Nickname: req.Nickname,
		Email:    req.Email,
		Phone:    req.Phone,
		Status:   req.Status,
	}

	if err := user.Create(gormDB); err != nil {
		return `{"error":"Failed to create user"}`, nil
	}

	if len(req.Roles) > 0 {
		models.AdminUser{}.SetRoles(gormDB, user.ID, req.Roles)
	}

	return `{"success":true,"userId":"` + user.ID + `"}`, nil
}

func adminUpdateUser(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		ID       string   `json:"id"`
		Nickname string   `json:"nickname"`
		Email    string   `json:"email"`
		Phone    string   `json:"phone"`
		Status   int      `json:"status"`
		Password string   `json:"password"`
		Roles    []string `json:"roles"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}
	if req.ID == "" {
		return `{"error":"User ID is required"}`, nil
	}

	gormDB := database.GetDB()
	user, err := models.AdminUser{}.FindByID(gormDB, req.ID)
	if err != nil {
		return `{"error":"User not found"}`, nil
	}

	user.Nickname = req.Nickname
	user.Email = req.Email
	user.Phone = req.Phone
	user.Status = req.Status

	if req.Password != "" {
		passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return `{"error":"Failed to hash password"}`, nil
		}
		user.Password = string(passwordHash)
	}

	if err := user.Update(gormDB); err != nil {
		return `{"error":"Failed to update user"}`, nil
	}

	if req.Roles != nil {
		models.AdminUser{}.SetRoles(gormDB, req.ID, req.Roles)
	}

	return `{"success":true}`, nil
}

func adminDeleteUser(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	_, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	var req struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}
	if req.ID == "" {
		return `{"error":"User ID is required"}`, nil
	}

	gormDB := database.GetDB()
	user, err := models.AdminUser{}.FindByID(gormDB, req.ID)
	if err != nil {
		return `{"error":"User not found"}`, nil
	}

	if err := user.Delete(gormDB); err != nil {
		return `{"error":"Failed to delete user"}`, nil
	}

	return `{"success":true}`, nil
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

func adminGetRoutes(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := checkAuth(ctx)
	if !ok {
		return `{"error":"Unauthorized"}`, nil
	}

	gormDB := database.GetDB()
	permissions, err := models.AdminPermission{}.GetMenusByUserID(gormDB, userID)
	if err != nil {
		return `{"error":"Database error"}`, nil
	}

	routes := buildRouteTree(permissions, "")
	data, _ := jsonMarshal(routes)
	return data, nil
}

func buildRouteTree(permissions []models.PermissionDTO, parentID string) []RouteItem {
	var routes []RouteItem
	for _, p := range permissions {
		if p.ParentID == parentID {
			route := RouteItem{
				Name: p.Code,
				Path: p.Path,
				Meta: RouteMeta{
					Title: p.Name,
					Icon:  p.Icon,
					Order: p.SortOrder,
				},
			}
			if p.Component != "" {
				route.Component = p.Component
			}
			route.Children = buildRouteTree(permissions, p.ID)
			routes = append(routes, route)
		}
	}
	return routes
}

func adminCheckRoute(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := checkAuth(ctx)
	if !ok {
		return "false", nil
	}

	var req struct {
		Route string `json:"route"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return "false", nil
	}

	gormDB := database.GetDB()
	hasAccess, _ := models.AdminPermission{}.CheckRouteAccess(gormDB, userID, req.Route)
	if hasAccess {
		return "true", nil
	}
	return "false", nil
}
