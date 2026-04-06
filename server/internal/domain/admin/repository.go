package admin

import (
	"context"

	"warforge-server/internal/domain/shared"
)

type AdminUserFilter struct {
	Search   string
	Status   *AdminUserStatus
	Page     int
	PageSize int
}

type AdminUserRepository interface {
	FindByID(ctx context.Context, id string) (*AdminUser, error)
	FindByUsername(ctx context.Context, username string) (*AdminUser, error)
	ExistsByUsername(ctx context.Context, username string) (bool, error)
	Save(ctx context.Context, user *AdminUser) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter AdminUserFilter) (*shared.QueryResult[*AdminUser], error)
	ListAll(ctx context.Context) ([]*AdminUser, error)
	UpdatePassword(ctx context.Context, id, passwordHash string) error
	UpdateLastLogin(ctx context.Context, id string) error
	GetRoles(ctx context.Context, userID string) ([]*AdminRole, error)
	SetRoles(ctx context.Context, userID string, roleIDs []string) error
	GetRoleCodes(ctx context.Context, userID string) ([]string, error)
	GetMenuCodes(ctx context.Context, userID string) ([]string, error)
	GetButtonCodes(ctx context.Context, userID string) ([]string, error)
}

type AdminRoleRepository interface {
	FindByID(ctx context.Context, id string) (*AdminRole, error)
	FindByCode(ctx context.Context, code string) (*AdminRole, error)
	Save(ctx context.Context, role *AdminRole) error
	Delete(ctx context.Context, id string) error
	ListAll(ctx context.Context) ([]*AdminRole, error)
	ListActive(ctx context.Context) ([]*AdminRole, error)
	GetPermissions(ctx context.Context, roleID string) ([]string, error)
	SetPermissions(ctx context.Context, roleID string, permissionIDs []string) error
}

type AdminPermissionRepository interface {
	FindByID(ctx context.Context, id string) (*AdminPermission, error)
	FindByCode(ctx context.Context, code string) (*AdminPermission, error)
	Save(ctx context.Context, perm *AdminPermission) error
	Delete(ctx context.Context, id string) error
	ListAll(ctx context.Context) ([]*AdminPermission, error)
	ListActive(ctx context.Context) ([]*AdminPermission, error)
	GetByParentID(ctx context.Context, parentID string) ([]*AdminPermission, error)
	GetByUserID(ctx context.Context, userID string) ([]*AdminPermission, error)
	GetMenusByUserID(ctx context.Context, userID string) ([]*MenuPermission, error)
	CheckRouteAccess(ctx context.Context, userID, routePath string) (bool, error)
	CheckPermission(ctx context.Context, userID, permissionCode string) (bool, error)
	GetMenuPermissionsByMenuID(ctx context.Context, menuID string) ([]*MenuPermissionDTO, error)
	SetMenuPermissionsByMenuID(ctx context.Context, menuID string, permissions []*MenuPermissionDTO) error
}

type AdminSettingRepository interface {
	FindByKey(ctx context.Context, key string) (*AdminSetting, error)
	ListAll(ctx context.Context) ([]*AdminSetting, error)
	Save(ctx context.Context, setting *AdminSetting) error
	BatchSave(ctx context.Context, settings []*AdminSetting) error
}

type OperationLogRepository interface {
	FindByID(ctx context.Context, id string) (*OperationLog, error)
	List(ctx context.Context, filter OperationLogFilter) (*shared.QueryResult[*OperationLog], error)
	Save(ctx context.Context, log *OperationLog) error
}

var (
	ErrAdminUserNotFound      = shared.NewDomainError("admin user not found", "ADMIN_USER_NOT_FOUND")
	ErrAdminUserAlreadyExists = shared.NewDomainError("admin user already exists", "ADMIN_USER_ALREADY_EXISTS")
	ErrAdminRoleNotFound      = shared.NewDomainError("admin role not found", "ADMIN_ROLE_NOT_FOUND")
	ErrAdminRoleAlreadyExists = shared.NewDomainError("admin role already exists", "ADMIN_ROLE_ALREADY_EXISTS")
	ErrAdminPermNotFound      = shared.NewDomainError("admin permission not found", "ADMIN_PERM_NOT_FOUND")
	ErrAdminPermAlreadyExists = shared.NewDomainError("admin permission already exists", "ADMIN_PERM_ALREADY_EXISTS")
	ErrUsernameExists         = shared.NewDomainError("username already exists", "USERNAME_EXISTS")
	ErrRoleCodeExists         = shared.NewDomainError("role code already exists", "ROLE_CODE_EXISTS")
	ErrPermissionCodeExists   = shared.NewDomainError("permission code already exists", "PERMISSION_CODE_EXISTS")
)
