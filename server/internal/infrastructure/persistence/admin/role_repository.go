package admin

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
	"warforge-server/internal/domain/admin"
)

type RoleRepository struct {
	db *sql.DB
}

func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) FindByID(ctx context.Context, id string) (*admin.AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM %s 
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_roles"))

	var status, sortOrder int
	var name, code, description string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &name, &code, &description,
		&status, &sortOrder, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, admin.ErrAdminRoleNotFound
		}
		return nil, err
	}

	role := admin.NewAdminRole(id, name, code)
	role.SetDescription(description)
	role.SetStatus(admin.AdminRoleStatus(status))
	role.SetSortOrder(sortOrder)
	return role, nil
}

func (r *RoleRepository) FindByCode(ctx context.Context, code string) (*admin.AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM %s 
		WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_roles"))

	var status, sortOrder int
	var id, name, description string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&id, &name, &code, &description,
		&status, &sortOrder, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, admin.ErrAdminRoleNotFound
		}
		return nil, err
	}

	role := admin.NewAdminRole(id, name, code)
	role.SetDescription(description)
	role.SetStatus(admin.AdminRoleStatus(status))
	role.SetSortOrder(sortOrder)
	return role, nil
}

func (r *RoleRepository) Save(ctx context.Context, role *admin.AdminRole) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, description, status, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, code = $3, description = $4, status = $5, sort_order = $6, updated_at = $8
	`, config.GetTableName("admin_roles"))

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query,
		role.ID(), role.Name(), role.Code(),
		role.Description(), int(role.Status()), role.SortOrder(),
		now, now,
	)
	return err
}

func (r *RoleRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = $1 WHERE id = $2`, config.GetTableName("admin_roles"))
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *RoleRepository) ListAll(ctx context.Context) ([]*admin.AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_roles"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*admin.AdminRole
	for rows.Next() {
		var status, sortOrder int
		var id, name, code, description string
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &name, &code, &description,
			&status, &sortOrder, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		role := admin.NewAdminRole(id, name, code)
		role.SetDescription(description)
		role.SetStatus(admin.AdminRoleStatus(status))
		role.SetSortOrder(sortOrder)
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *RoleRepository) ListActive(ctx context.Context) ([]*admin.AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, status, sort_order, created_at, updated_at
		FROM %s 
		WHERE status = 1 AND deleted_at IS NULL
		ORDER BY sort_order
	`, config.GetTableName("admin_roles"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*admin.AdminRole
	for rows.Next() {
		var status, sortOrder int
		var id, name, code, description string
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &name, &code, &description,
			&status, &sortOrder, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		role := admin.NewAdminRole(id, name, code)
		role.SetDescription(description)
		role.SetStatus(admin.AdminRoleStatus(status))
		role.SetSortOrder(sortOrder)
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *RoleRepository) GetPermissions(ctx context.Context, roleID string) ([]string, error) {
	query := fmt.Sprintf(`SELECT permission_id FROM %s WHERE role_id = $1`, config.GetTableName("admin_role_permissions"))
	rows, err := r.db.QueryContext(ctx, query, roleID)
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

func (r *RoleRepository) SetPermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`DELETE FROM %s WHERE role_id = $1`, config.GetTableName("admin_role_permissions")), roleID); err != nil {
		return err
	}

	for _, permID := range permissionIDs {
		_, err := tx.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (role_id, permission_id) VALUES ($1, $2)`, config.GetTableName("admin_role_permissions")), roleID, permID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
