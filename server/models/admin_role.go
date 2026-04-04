// Package models 提供数据模型定义
//
// 本文件定义管理员角色模型及相关数据库操作方法
package models

import (
	"database/sql"
	"time"
)

// AdminRole 管理员角色模型
type AdminRole struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Code        string     `json:"code"`
	Description string     `json:"description"`
	Status      int        `json:"status"`
	SortOrder   int        `json:"sortOrder"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"-"`
}

// TableName 返回表名
func (AdminRole) TableName() string {
	return "admin_roles"
}

// Create 创建角色
//
// 插入新角色记录到数据库
func (r *AdminRole) Create(db *sql.DB) error {
	query := `
		INSERT INTO admin_roles (id, name, code, description, status, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	now := time.Now()
	_, err := db.Exec(query, r.ID, r.Name, r.Code, r.Description, r.Status, r.SortOrder, now, now)
	if err != nil {
		return err
	}
	r.CreatedAt = now
	r.UpdatedAt = now
	return nil
}

// Update 更新角色
//
// 更新角色信息
func (r *AdminRole) Update(db *sql.DB) error {
	query := `
		UPDATE admin_roles 
		SET name = $1, code = $2, description = $3, status = $4, sort_order = $5, updated_at = $6
		WHERE id = $7
	`
	now := time.Now()
	_, err := db.Exec(query, r.Name, r.Code, r.Description, r.Status, r.SortOrder, now, r.ID)
	if err != nil {
		return err
	}
	r.UpdatedAt = now
	return nil
}

// Delete 删除角色
//
// 软删除角色记录
func (r *AdminRole) Delete(db *sql.DB) error {
	query := `UPDATE admin_roles SET deleted_at = $1 WHERE id = $2`
	now := time.Now()
	_, err := db.Exec(query, now, r.ID)
	return err
}

// FindByID 根据ID查找角色
//
// 返回指定ID的角色信息
func (AdminRole) FindByID(db *sql.DB, id string) (*AdminRole, error) {
	query := `
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM admin_roles 
		WHERE id = $1 AND deleted_at IS NULL
	`
	role := &AdminRole{}
	err := db.QueryRow(query, id).Scan(
		&role.ID, &role.Name, &role.Code, &role.Description,
		&role.Status, &role.SortOrder, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return role, nil
}

// ListAll 获取所有角色列表
//
// 返回所有未删除的角色
func (AdminRole) ListAll(db *sql.DB) ([]AdminRole, error) {
	query := `
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM admin_roles 
		WHERE deleted_at IS NULL
		ORDER BY sort_order
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []AdminRole
	for rows.Next() {
		var role AdminRole
		err := rows.Scan(
			&role.ID, &role.Name, &role.Code, &role.Description,
			&role.Status, &role.SortOrder, &role.CreatedAt, &role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// List 获取有效角色列表
//
// 返回所有状态为有效的角色
func (AdminRole) ListActive(db *sql.DB) ([]AdminRole, error) {
	query := `
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM admin_roles 
		WHERE status = 1 AND deleted_at IS NULL
		ORDER BY sort_order
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []AdminRole
	for rows.Next() {
		var role AdminRole
		err := rows.Scan(
			&role.ID, &role.Name, &role.Code, &role.Description,
			&role.Status, &role.SortOrder, &role.CreatedAt, &role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// GetByCode 根据代码获取角色
//
// 返回指定代码的角色信息
func (AdminRole) GetByCode(db *sql.DB, code string) (*AdminRole, error) {
	query := `
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM admin_roles 
		WHERE code = $1 AND deleted_at IS NULL
	`
	role := &AdminRole{}
	err := db.QueryRow(query, code).Scan(
		&role.ID, &role.Name, &role.Code, &role.Description,
		&role.Status, &role.SortOrder, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return role, nil
}

// GetPermissions 获取角色权限ID列表
//
// 返回角色关联的所有权限ID
func (AdminRole) GetPermissions(db *sql.DB, roleID string) ([]string, error) {
	query := `SELECT permission_id FROM admin_role_permissions WHERE role_id = $1`
	rows, err := db.Query(query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissionIDs []string
	for rows.Next() {
		var permID string
		if err := rows.Scan(&permID); err != nil {
			return nil, err
		}
		permissionIDs = append(permissionIDs, permID)
	}
	return permissionIDs, nil
}

// UpdatePermissions 更新角色权限
//
// 替换角色的所有权限关联
func (AdminRole) UpdatePermissions(db *sql.DB, roleID string, permissionIDs []string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 删除旧的权限关联
	if _, err := tx.Exec(`DELETE FROM admin_role_permissions WHERE role_id = $1`, roleID); err != nil {
		return err
	}

	// 插入新的权限关联
	for _, permID := range permissionIDs {
		_, err := tx.Exec(`INSERT INTO admin_role_permissions (role_id, permission_id) VALUES ($1, $2)`, roleID, permID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
