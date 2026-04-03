package models

import (
	"time"
)

type AdminUserRole struct {
	UserID    string    `gorm:"primaryKey;type:VARCHAR(36)" json:"userId"`
	RoleID    string    `gorm:"primaryKey;type:VARCHAR(36)" json:"roleId"`
	CreatedAt time.Time `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"createdAt"`
}

func (AdminUserRole) TableName() string {
	return "admin_user_roles"
}

type AdminRolePermission struct {
	RoleID       string    `gorm:"primaryKey;type:VARCHAR(36)" json:"roleId"`
	PermissionID string    `gorm:"primaryKey;type:VARCHAR(36)" json:"permissionId"`
	CreatedAt    time.Time `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"createdAt"`
}

func (AdminRolePermission) TableName() string {
	return "admin_role_permissions"
}
