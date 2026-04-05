// Package models 提供数据模型定义
//
// 本文件定义管理员权限模型及相关数据库操作方法
package models

import (
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
)

// AdminPermission 管理员权限模型
type AdminPermission struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Code       string     `json:"code"`
	Type       string     `json:"type"`
	ParentID   *string    `json:"parentId"`
	Path       *string    `json:"path"`
	Component  *string    `json:"component"`
	Icon       *string    `json:"icon"`
	Href       *string    `json:"href"`
	ShowInMenu bool       `json:"showInMenu"`
	SortOrder  int        `json:"sortOrder"`
	Status     int        `json:"status"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	DeletedAt  *time.Time `json:"-"`
}

// TableName 返回表名
func (AdminPermission) TableName() string {
	return config.GetTableName("admin_permissions")
}

// Create 创建权限
//
// 插入新权限记录到数据库
func (p *AdminPermission) Create(db *sql.DB) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`, config.GetTableName("admin_permissions"))
	now := time.Now()
	_, err := db.Exec(query, p.ID, p.Name, p.Code, p.Type, p.ParentID, p.Path, p.Component, p.Icon, p.Href, p.ShowInMenu, p.SortOrder, p.Status, now, now)
	if err != nil {
		return err
	}
	p.CreatedAt = now
	p.UpdatedAt = now
	return nil
}

// Update 更新权限
//
// 更新权限信息
func (p *AdminPermission) Update(db *sql.DB) error {
	query := fmt.Sprintf(`
		UPDATE %s 
		SET name = $1, code = $2, type = $3, parent_id = $4, path = $5, component = $6, icon = $7, href = $8, show_in_menu = $9, sort_order = $10, status = $11, updated_at = $12
		WHERE id = $13
	`, config.GetTableName("admin_permissions"))
	now := time.Now()
	_, err := db.Exec(query, p.Name, p.Code, p.Type, p.ParentID, p.Path, p.Component, p.Icon, p.Href, p.ShowInMenu, p.SortOrder, p.Status, now, p.ID)
	if err != nil {
		return err
	}
	p.UpdatedAt = now
	return nil
}

// Delete 删除权限
//
// 软删除权限记录
func (p *AdminPermission) Delete(db *sql.DB) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = $1 WHERE id = $2`, config.GetTableName("admin_permissions"))
	now := time.Now()
	_, err := db.Exec(query, now, p.ID)
	return err
}

// FindByID 根据ID查找权限
//
// 返回指定ID的权限信息
func (AdminPermission) FindByID(db *sql.DB, id string) (*AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_permissions"))
	perm := &AdminPermission{}
	var parentID, path, component, icon, href sql.NullString
	err := db.QueryRow(query, id).Scan(
		&perm.ID, &perm.Name, &perm.Code, &perm.Type, &parentID,
		&path, &component, &icon, &href, &perm.ShowInMenu, &perm.SortOrder, &perm.Status,
		&perm.CreatedAt, &perm.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if parentID.Valid {
		perm.ParentID = &parentID.String
	}
	if path.Valid {
		perm.Path = &path.String
	}
	if component.Valid {
		perm.Component = &component.String
	}
	if icon.Valid {
		perm.Icon = &icon.String
	}
	if href.Valid {
		perm.Href = &href.String
	}
	return perm, nil
}

// GetByCode 根据代码获取权限
//
// 返回指定代码的权限信息
func (AdminPermission) GetByCode(db *sql.DB, code string) (*AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_permissions"))
	perm := &AdminPermission{}
	var parentID, path, component, icon, href sql.NullString
	err := db.QueryRow(query, code).Scan(
		&perm.ID, &perm.Name, &perm.Code, &perm.Type, &parentID,
		&path, &component, &icon, &href, &perm.ShowInMenu, &perm.SortOrder, &perm.Status,
		&perm.CreatedAt, &perm.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if parentID.Valid {
		perm.ParentID = &parentID.String
	}
	if path.Valid {
		perm.Path = &path.String
	}
	if component.Valid {
		perm.Component = &component.String
	}
	if icon.Valid {
		perm.Icon = &icon.String
	}
	if href.Valid {
		perm.Href = &href.String
	}
	return perm, nil
}

// List 获取有效权限列表
//
// 返回所有状态为有效的权限
func (AdminPermission) List(db *sql.DB) ([]AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE status = 1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []AdminPermission
	for rows.Next() {
		var perm AdminPermission
		var parentID, path, component, icon, href sql.NullString
		err := rows.Scan(
			&perm.ID, &perm.Name, &perm.Code, &perm.Type, &parentID,
			&path, &component, &icon, &href, &perm.ShowInMenu, &perm.SortOrder, &perm.Status,
			&perm.CreatedAt, &perm.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if parentID.Valid {
			perm.ParentID = &parentID.String
		}
		if path.Valid {
			perm.Path = &path.String
		}
		if component.Valid {
			perm.Component = &component.String
		}
		if icon.Valid {
			perm.Icon = &icon.String
		}
		if href.Valid {
			perm.Href = &href.String
		}
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

// ListAll 获取所有权限列表（包括禁用的）
//
// 返回所有未删除的权限
func (AdminPermission) ListAll(db *sql.DB) ([]AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []AdminPermission
	for rows.Next() {
		var perm AdminPermission
		var parentID, path, component, icon, href sql.NullString
		err := rows.Scan(
			&perm.ID, &perm.Name, &perm.Code, &perm.Type, &parentID,
			&path, &component, &icon, &href, &perm.ShowInMenu, &perm.SortOrder, &perm.Status,
			&perm.CreatedAt, &perm.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if parentID.Valid {
			perm.ParentID = &parentID.String
		}
		if path.Valid {
			perm.Path = &path.String
		}
		if component.Valid {
			perm.Component = &component.String
		}
		if icon.Valid {
			perm.Icon = &icon.String
		}
		if href.Valid {
			perm.Href = &href.String
		}
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

// PermissionDTO 权限数据传输对象
type PermissionDTO struct {
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

// GetByUserID 根据用户ID获取权限列表
//
// 返回用户拥有的所有权限
func (AdminPermission) GetByUserID(db *sql.DB, userID string) ([]PermissionDTO, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.name, p.code, p.type, COALESCE(p.parent_id::text, '') as parent_id, 
			   p.path, p.component, p.icon, p.sort_order, p.status
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.status = 1 AND p.deleted_at IS NULL
		ORDER BY p.sort_order
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []PermissionDTO
	for rows.Next() {
		var perm PermissionDTO
		err := rows.Scan(
			&perm.ID, &perm.Name, &perm.Code, &perm.Type, &perm.ParentID,
			&perm.Path, &perm.Component, &perm.Icon, &perm.SortOrder, &perm.Status,
		)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

// CheckRouteAccess 检查用户路由访问权限
//
// 返回用户是否有访问指定路由的权限
func (AdminPermission) CheckRouteAccess(db *sql.DB, userID, routePath string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.path = $2 AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))
	var count int
	err := db.QueryRow(query, userID, routePath).Scan(&count)
	return count > 0, err
}

// CheckPermission 检查用户权限
//
// 返回用户是否有指定的权限代码
func (AdminPermission) CheckPermission(db *sql.DB, userID, permissionCode string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.code = $2 AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))
	var count int
	err := db.QueryRow(query, userID, permissionCode).Scan(&count)
	return count > 0, err
}

// MenuPermission 菜单权限结构
type MenuPermission struct {
	ID         string
	Name       string
	Code       string
	Type       string
	ParentID   *string
	Path       *string
	Component  *string
	Icon       *string
	Href       *string
	ShowInMenu bool
	SortOrder  int
}

// GetMenusByUserID 获取用户菜单权限
//
// 返回用户拥有的所有菜单权限（带层级结构）
func (AdminPermission) GetMenusByUserID(db *sql.DB, userID string) ([]MenuPermission, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, p.component, p.icon, p.href, p.show_in_menu, p.sort_order
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON ur.role_id = rp.role_id
		INNER JOIN %s r ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'menu' AND r.status = 1 AND p.deleted_at IS NULL
		ORDER BY p.sort_order ASC
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"), config.GetTableName("admin_roles"))

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []MenuPermission
	for rows.Next() {
		var p MenuPermission
		var parentID, path, component, icon, href sql.NullString
		err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Type, &parentID, &path, &component, &icon, &href, &p.ShowInMenu, &p.SortOrder)
		if err != nil {
			continue
		}
		if parentID.Valid {
			p.ParentID = &parentID.String
		}
		if path.Valid {
			p.Path = &path.String
		}
		if component.Valid {
			p.Component = &component.String
		}
		if icon.Valid {
			p.Icon = &icon.String
		}
		if href.Valid {
			p.Href = &href.String
		}
		permissions = append(permissions, p)
	}

	return permissions, nil
}

// GetAllMenusByUserID 获取用户所有菜单权限（包括show_in_menu为false的）
func (AdminPermission) GetAllMenusByUserID(db *sql.DB, userID string) ([]MenuPermission, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, p.component, p.icon, p.href, p.show_in_menu, p.sort_order
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON ur.role_id = rp.role_id
		INNER JOIN %s r ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'menu' AND r.status = 1 AND p.deleted_at IS NULL
		ORDER BY p.sort_order ASC
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"), config.GetTableName("admin_roles"))

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []MenuPermission
	for rows.Next() {
		var p MenuPermission
		var parentID, path, component, icon, href sql.NullString
		err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Type, &parentID, &path, &component, &icon, &href, &p.ShowInMenu, &p.SortOrder)
		if err != nil {
			continue
		}
		if parentID.Valid {
			p.ParentID = &parentID.String
		}
		if path.Valid {
			p.Path = &path.String
		}
		if component.Valid {
			p.Component = &component.String
		}
		if icon.Valid {
			p.Icon = &icon.String
		}
		if href.Valid {
			p.Href = &href.String
		}
		permissions = append(permissions, p)
	}

	return permissions, nil
}

// GetChildren 获取子权限
func (AdminPermission) GetChildren(db *sql.DB, parentID string) ([]AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE parent_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))
	rows, err := db.Query(query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []AdminPermission
	for rows.Next() {
		var perm AdminPermission
		var parentIDNull, path, component, icon, href sql.NullString
		err := rows.Scan(
			&perm.ID, &perm.Name, &perm.Code, &perm.Type, &parentIDNull,
			&path, &component, &icon, &href, &perm.ShowInMenu, &perm.SortOrder, &perm.Status,
			&perm.CreatedAt, &perm.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if parentIDNull.Valid {
			perm.ParentID = &parentIDNull.String
		}
		if path.Valid {
			perm.Path = &path.String
		}
		if component.Valid {
			perm.Component = &component.String
		}
		if icon.Valid {
			perm.Icon = &icon.String
		}
		if href.Valid {
			perm.Href = &href.String
		}
		permissions = append(permissions, perm)
	}
	return permissions, nil
}
