package admin

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
	"warforge-server/internal/domain/admin"
	"warforge-server/internal/domain/shared"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*admin.AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_users"))

	var lastLoginAt sql.NullTime
	var nickname, email, phone, avatar, lastLoginIP sql.NullString
	var status int
	var createdAt, updatedAt time.Time
	var username, password string

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &username, &password, &nickname,
		&email, &phone, &avatar, &status,
		&lastLoginAt, &lastLoginIP, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, admin.ErrAdminUserNotFound
		}
		return nil, err
	}

	user := admin.NewAdminUser(id, username, password)
	user.SetNickname(nickname.String)
	user.SetEmail(email.String)
	user.SetPhone(phone.String)
	user.SetAvatar(avatar.String)
	user.SetStatus(admin.AdminUserStatus(status))
	if lastLoginAt.Valid {
		user.SetLastLoginAt(&lastLoginAt.Time)
	}
	user.SetLastLoginIP(lastLoginIP.String)

	return user, nil
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*admin.AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE username = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_users"))

	var lastLoginAt sql.NullTime
	var nickname, email, phone, avatar, lastLoginIP sql.NullString
	var status int
	var createdAt, updatedAt time.Time
	var id, password string

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&id, &username, &password, &nickname,
		&email, &phone, &avatar, &status,
		&lastLoginAt, &lastLoginIP, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, admin.ErrAdminUserNotFound
		}
		return nil, err
	}

	user := admin.NewAdminUser(id, username, password)
	user.SetNickname(nickname.String)
	user.SetEmail(email.String)
	user.SetPhone(phone.String)
	user.SetAvatar(avatar.String)
	user.SetStatus(admin.AdminUserStatus(status))
	if lastLoginAt.Valid {
		user.SetLastLoginAt(&lastLoginAt.Time)
	}
	user.SetLastLoginIP(lastLoginIP.String)

	return user, nil
}

func (r *UserRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE username = $1 AND deleted_at IS NULL`, config.GetTableName("admin_users"))
	var count int
	err := r.db.QueryRowContext(ctx, query, username).Scan(&count)
	return count > 0, err
}

func (r *UserRepository) Save(ctx context.Context, user *admin.AdminUser) error {
	now := time.Now()
	query := fmt.Sprintf(`
		INSERT INTO %s (id, username, password_hash, nickname, email, phone, avatar, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (id) DO UPDATE SET
			nickname = $4, email = $5, phone = $6, avatar = $7, status = $8, updated_at = $10
	`, config.GetTableName("admin_users"))

	_, err := r.db.ExecContext(ctx, query,
		user.ID(), user.Username(), user.Password(),
		user.Nickname(), user.Email(), user.Phone(), user.Avatar(),
		int(user.Status()), now, now,
	)
	return err
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = $1 WHERE id = $2`, config.GetTableName("admin_users"))
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *UserRepository) List(ctx context.Context, filter admin.AdminUserFilter) (*shared.QueryResult[*admin.AdminUser], error) {
	offset := (filter.Page - 1) * filter.PageSize
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 10
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE deleted_at IS NULL`, config.GetTableName("admin_users"))
	var total int
	r.db.QueryRowContext(ctx, countQuery).Scan(&total)

	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, config.GetTableName("admin_users"))

	rows, err := r.db.QueryContext(ctx, query, filter.PageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*admin.AdminUser
	for rows.Next() {
		var lastLoginAt sql.NullTime
		var nickname, email, phone, avatar, lastLoginIP sql.NullString
		var status int
		var createdAt, updatedAt time.Time
		var id, username, password string

		err := rows.Scan(
			&id, &username, &password, &nickname,
			&email, &phone, &avatar, &status,
			&lastLoginAt, &lastLoginIP, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		user := admin.NewAdminUser(id, username, password)
		user.SetNickname(nickname.String)
		user.SetEmail(email.String)
		user.SetPhone(phone.String)
		user.SetAvatar(avatar.String)
		user.SetStatus(admin.AdminUserStatus(status))
		if lastLoginAt.Valid {
			user.SetLastLoginAt(&lastLoginAt.Time)
		}
		user.SetLastLoginIP(lastLoginIP.String)
		users = append(users, user)
	}

	return &shared.QueryResult[*admin.AdminUser]{
		Items:    users,
		Total:    int64(total),
		Page:     filter.Page,
		PageSize: filter.PageSize,
	}, nil
}

func (r *UserRepository) ListAll(ctx context.Context) ([]*admin.AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
	`, config.GetTableName("admin_users"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*admin.AdminUser
	for rows.Next() {
		var lastLoginAt sql.NullTime
		var nickname, email, phone, avatar, lastLoginIP sql.NullString
		var status int
		var createdAt, updatedAt time.Time
		var id, username, password string

		err := rows.Scan(
			&id, &username, &password, &nickname,
			&email, &phone, &avatar, &status,
			&lastLoginAt, &lastLoginIP, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		user := admin.NewAdminUser(id, username, password)
		user.SetNickname(nickname.String)
		user.SetEmail(email.String)
		user.SetPhone(phone.String)
		user.SetAvatar(avatar.String)
		user.SetStatus(admin.AdminUserStatus(status))
		if lastLoginAt.Valid {
			user.SetLastLoginAt(&lastLoginAt.Time)
		}
		user.SetLastLoginIP(lastLoginIP.String)
		users = append(users, user)
	}

	return users, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	query := fmt.Sprintf(`UPDATE %s SET password_hash = $1, updated_at = $2 WHERE id = $3`, config.GetTableName("admin_users"))
	_, err := r.db.ExecContext(ctx, query, passwordHash, time.Now(), id)
	return err
}

func (r *UserRepository) UpdateLastLogin(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET last_login_at = $1, updated_at = $2 WHERE id = $3`, config.GetTableName("admin_users"))
	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, now, now, id)
	return err
}

func (r *UserRepository) GetRoles(ctx context.Context, userID string) ([]*admin.AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT r.id, r.name, r.code, r.description, r.status, r.sort_order, r.created_at, r.updated_at
		FROM %s r
		INNER JOIN %s ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.deleted_at IS NULL
	`, config.GetTableName("admin_roles"), config.GetTableName("admin_user_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*admin.AdminRole
	for rows.Next() {
		var status, sortOrder int
		var createdAt, updatedAt time.Time
		var id, name, code, description string

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

func (r *UserRepository) SetRoles(ctx context.Context, userID string, roleIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, fmt.Sprintf(`DELETE FROM %s WHERE user_id = $1`, config.GetTableName("admin_user_roles")), userID); err != nil {
		return err
	}

	for _, roleID := range roleIDs {
		_, err := tx.ExecContext(ctx, fmt.Sprintf(`INSERT INTO %s (user_id, role_id) VALUES ($1, $2)`, config.GetTableName("admin_user_roles")), userID, roleID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *UserRepository) GetRoleCodes(ctx context.Context, userID string) ([]string, error) {
	query := fmt.Sprintf(`
		SELECT r.code
		FROM %s r
		INNER JOIN %s ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.status = 1 AND r.deleted_at IS NULL
	`, config.GetTableName("admin_roles"), config.GetTableName("admin_user_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, nil
}

func (r *UserRepository) GetMenuCodes(ctx context.Context, userID string) ([]string, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.code
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'menu' AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, nil
}

func (r *UserRepository) GetButtonCodes(ctx context.Context, userID string) ([]string, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.code
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'button' AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, nil
}
