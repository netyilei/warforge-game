// Package models 提供数据模型定义
//
// 本文件定义管理员关联表模型
package models

import (
	"time"
	"warforge-server/config"
)

// AdminUserRole 用户角色关联表
type AdminUserRole struct {
	UserID    string    `json:"userId"`
	RoleID    string    `json:"roleId"`
	CreatedAt time.Time `json:"createdAt"`
}

// TableName 返回表名
func (AdminUserRole) TableName() string {
	return config.GetTableName("admin_user_roles")
}

// AdminRolePermission 角色权限关联表
type AdminRolePermission struct {
	RoleID       string    `json:"roleId"`
	PermissionID string    `json:"permissionId"`
	CreatedAt    time.Time `json:"createdAt"`
}

// TableName 返回表名
func (AdminRolePermission) TableName() string {
	return config.GetTableName("admin_role_permissions")
}
