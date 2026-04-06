package admin

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
	"warforge-server/internal/domain/admin"
)

type PermissionRepository struct {
	db *sql.DB
}

func NewPermissionRepository(db *sql.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) FindByID(ctx context.Context, id string) (*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, COALESCE(api_paths::text, '[]'), created_at, updated_at
		FROM %s 
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_permissions"))

	return r.scanPermission(r.db.QueryRowContext(ctx, query, id))
}

func (r *PermissionRepository) FindByCode(ctx context.Context, code string) (*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, COALESCE(api_paths::text, '[]'), created_at, updated_at
		FROM %s 
		WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_permissions"))

	return r.scanPermission(r.db.QueryRowContext(ctx, query, code))
}

func (r *PermissionRepository) scanPermission(row *sql.Row) (*admin.AdminPermission, error) {
	var id, name, code, permType string
	var parentID, path, component, icon, href sql.NullString
	var showInMenu bool
	var status, sortOrder int
	var apiPaths string
	var createdAt, updatedAt time.Time

	err := row.Scan(
		&id, &name, &code, &permType, &parentID,
		&path, &component, &icon, &href, &showInMenu, &sortOrder, &status,
		&apiPaths, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, admin.ErrAdminPermNotFound
		}
		return nil, err
	}

	perm := admin.NewAdminPermission(id, name, code, admin.PermissionType(permType))
	if parentID.Valid {
		perm.SetParentID(&parentID.String)
	}
	if path.Valid {
		perm.SetPath(&path.String)
	}
	if component.Valid {
		perm.SetComponent(&component.String)
	}
	if icon.Valid {
		perm.SetIcon(&icon.String)
	}
	if href.Valid {
		perm.SetHref(&href.String)
	}
	perm.SetShowInMenu(showInMenu)
	perm.SetSortOrder(sortOrder)
	perm.SetStatus(admin.AdminPermissionStatus(status))
	perm.SetAPIPaths(apiPaths)
	return perm, nil
}

func (r *PermissionRepository) Save(ctx context.Context, perm *admin.AdminPermission) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, api_paths, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, code = $3, type = $4, parent_id = $5, path = $6, component = $7, icon = $8, href = $9,
			show_in_menu = $10, sort_order = $11, status = $12, api_paths = $13, updated_at = $15
	`, config.GetTableName("admin_permissions"))

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query,
		perm.ID(), perm.Name(), perm.Code(), string(perm.Type()),
		perm.ParentID(), perm.Path(), perm.Component(), perm.Icon(), perm.Href(),
		perm.ShowInMenu(), perm.SortOrder(), int(perm.Status()), perm.APIPaths(),
		now, now,
	)
	return err
}

func (r *PermissionRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = $1 WHERE id = $2`, config.GetTableName("admin_permissions"))
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *PermissionRepository) ListAll(ctx context.Context) ([]*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, COALESCE(api_paths::text, '[]'), created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))

	return r.listPermissions(ctx, query)
}

func (r *PermissionRepository) ListActive(ctx context.Context) ([]*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, COALESCE(api_paths::text, '[]'), created_at, updated_at
		FROM %s 
		WHERE status = 1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))

	return r.listPermissions(ctx, query)
}

func (r *PermissionRepository) listPermissions(ctx context.Context, query string) ([]*admin.AdminPermission, error) {
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []*admin.AdminPermission
	for rows.Next() {
		var id, name, code, permType string
		var parentID, path, component, icon, href sql.NullString
		var showInMenu bool
		var status, sortOrder int
		var apiPaths string
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &name, &code, &permType, &parentID,
			&path, &component, &icon, &href, &showInMenu, &sortOrder, &status,
			&apiPaths, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		perm := admin.NewAdminPermission(id, name, code, admin.PermissionType(permType))
		if parentID.Valid {
			perm.SetParentID(&parentID.String)
		}
		if path.Valid {
			perm.SetPath(&path.String)
		}
		if component.Valid {
			perm.SetComponent(&component.String)
		}
		if icon.Valid {
			perm.SetIcon(&icon.String)
		}
		if href.Valid {
			perm.SetHref(&href.String)
		}
		perm.SetShowInMenu(showInMenu)
		perm.SetSortOrder(sortOrder)
		perm.SetStatus(admin.AdminPermissionStatus(status))
		perm.SetAPIPaths(apiPaths)
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

func (r *PermissionRepository) GetByParentID(ctx context.Context, parentID string) ([]*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, parent_id, path, component, icon, href, show_in_menu, sort_order, status, created_at, updated_at
		FROM %s 
		WHERE parent_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))

	rows, err := r.db.QueryContext(ctx, query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPermissions(rows)
}

func (r *PermissionRepository) scanPermissions(rows *sql.Rows) ([]*admin.AdminPermission, error) {
	var permissions []*admin.AdminPermission
	for rows.Next() {
		var id, name, code, permType string
		var parentID, path, component, icon, href sql.NullString
		var showInMenu bool
		var status, sortOrder int
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &name, &code, &permType, &parentID,
			&path, &component, &icon, &href, &showInMenu, &sortOrder, &status,
			&createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		perm := admin.NewAdminPermission(id, name, code, admin.PermissionType(permType))
		if parentID.Valid {
			perm.SetParentID(&parentID.String)
		}
		if path.Valid {
			perm.SetPath(&path.String)
		}
		if component.Valid {
			perm.SetComponent(&component.String)
		}
		if icon.Valid {
			perm.SetIcon(&icon.String)
		}
		if href.Valid {
			perm.SetHref(&href.String)
		}
		perm.SetShowInMenu(showInMenu)
		perm.SetSortOrder(sortOrder)
		perm.SetStatus(admin.AdminPermissionStatus(status))
		permissions = append(permissions, perm)
	}
	return permissions, nil
}

func (r *PermissionRepository) GetByUserID(ctx context.Context, userID string) ([]*admin.AdminPermission, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, p.component, p.icon, p.href, p.show_in_menu, p.sort_order, p.status, p.created_at, p.updated_at
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.status = 1 AND p.deleted_at IS NULL
		ORDER BY p.sort_order
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPermissions(rows)
}

func (r *PermissionRepository) GetMenusByUserID(ctx context.Context, userID string) ([]*admin.MenuPermission, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.id, p.name, p.code, p.type, p.parent_id, p.path, p.component, p.icon, p.href, p.show_in_menu, p.sort_order
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON ur.role_id = rp.role_id
		INNER JOIN %s r ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'menu' AND r.status = 1 AND p.deleted_at IS NULL
		ORDER BY p.sort_order ASC
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"), config.GetTableName("admin_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []*admin.MenuPermission
	for rows.Next() {
		var p admin.MenuPermission
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
		permissions = append(permissions, &p)
	}

	return permissions, nil
}

func (r *PermissionRepository) CheckRouteAccess(ctx context.Context, userID, routePath string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.path = $2 AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))

	var count int
	err := r.db.QueryRowContext(ctx, query, userID, routePath).Scan(&count)
	return count > 0, err
}

func (r *PermissionRepository) CheckPermission(ctx context.Context, userID, permissionCode string) (bool, error) {
	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.code = $2 AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))

	var count int
	err := r.db.QueryRowContext(ctx, query, userID, permissionCode).Scan(&count)
	return count > 0, err
}

func (r *PermissionRepository) GetMenuPermissionsByMenuID(ctx context.Context, menuID string) ([]*admin.MenuPermissionDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, type, COALESCE(parent_id::text, '') as parent_id, 
			   COALESCE(path, '') as path, COALESCE(component, '') as component, 
			   COALESCE(icon, '') as icon, sort_order, status
		FROM %s WHERE parent_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_permissions"))

	rows, err := r.db.QueryContext(ctx, query, menuID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []*admin.MenuPermissionDTO
	for rows.Next() {
		var p admin.MenuPermissionDTO
		if err := rows.Scan(&p.ID, &p.Name, &p.Code, &p.Type, &p.ParentID, &p.Path, &p.Component, &p.Icon, &p.SortOrder, &p.Status); err != nil {
			continue
		}
		permissions = append(permissions, &p)
	}
	return permissions, nil
}

func (r *PermissionRepository) SetMenuPermissionsByMenuID(ctx context.Context, menuID string, permissions []*admin.MenuPermissionDTO) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	deleteQuery := fmt.Sprintf(`DELETE FROM %s WHERE parent_id = $1`, config.GetTableName("admin_permissions"))
	if _, err := tx.ExecContext(ctx, deleteQuery, menuID); err != nil {
		return err
	}

	for _, p := range permissions {
		insertQuery := fmt.Sprintf(`
			INSERT INTO %s (id, name, code, type, parent_id, path, component, icon, sort_order, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`, config.GetTableName("admin_permissions"))

		now := time.Now()
		if _, err := tx.ExecContext(ctx, insertQuery, p.ID, p.Name, p.Code, p.Type, p.ParentID, p.Path, p.Component, p.Icon, p.SortOrder, p.Status, now, now); err != nil {
			return err
		}
	}

	return tx.Commit()
}
