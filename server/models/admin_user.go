// Package models 提供数据模型定义
//
// 本文件定义管理员用户模型及相关数据库操作方法
package models

import (
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
)

// AdminUser 管理员用户模型
type AdminUser struct {
	ID          string      `json:"id"`
	Username    string      `json:"username"`
	Password    string      `json:"-"`
	Nickname    string      `json:"nickname"`
	Email       string      `json:"email"`
	Phone       string      `json:"phone"`
	Avatar      string      `json:"avatar"`
	Status      int         `json:"status"`
	LastLoginAt *time.Time  `json:"lastLoginAt"`
	LastLoginIP string      `json:"lastLoginIp"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`
	DeletedAt   *time.Time  `json:"-"`
	Roles       []AdminRole `json:"roles,omitempty"`
}

// TableName 返回表名
func (AdminUser) TableName() string {
	return config.GetTableName("admin_users")
}

// Create 创建用户
//
// 插入新用户记录到数据库
func (u *AdminUser) Create(db *sql.DB) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, username, password_hash, nickname, email, phone, avatar, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, config.GetTableName("admin_users"))
	now := time.Now()
	_, err := db.Exec(query, u.ID, u.Username, u.Password, u.Nickname, u.Email, u.Phone, u.Avatar, u.Status, now, now)
	if err != nil {
		return err
	}
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

// Update 更新用户
//
// 更新用户信息
func (u *AdminUser) Update(db *sql.DB) error {
	query := fmt.Sprintf(`
		UPDATE %s 
		SET nickname = $1, email = $2, phone = $3, avatar = $4, status = $5, updated_at = $6
		WHERE id = $7
	`, config.GetTableName("admin_users"))
	now := time.Now()
	_, err := db.Exec(query, u.Nickname, u.Email, u.Phone, u.Avatar, u.Status, now, u.ID)
	if err != nil {
		return err
	}
	u.UpdatedAt = now
	return nil
}

// Delete 删除用户
//
// 软删除用户记录
func (u *AdminUser) Delete(db *sql.DB) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = $1 WHERE id = $2`, config.GetTableName("admin_users"))
	now := time.Now()
	_, err := db.Exec(query, now, u.ID)
	return err
}

// FindByID 根据ID查找用户
//
// 返回指定ID的用户信息
func (AdminUser) FindByID(db *sql.DB, id string) (*AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_users"))
	user := &AdminUser{}
	var lastLoginAt sql.NullTime
	var nickname, email, phone, avatar, lastLoginIP sql.NullString
	err := db.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.Password, &nickname,
		&email, &phone, &avatar, &user.Status,
		&lastLoginAt, &lastLoginIP, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	user.Nickname = nickname.String
	user.Email = email.String
	user.Phone = phone.String
	user.Avatar = avatar.String
	user.LastLoginIP = lastLoginIP.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	return user, nil
}

// FindByUsername 根据用户名查找用户
//
// 返回指定用户名的用户信息
func (AdminUser) FindByUsername(db *sql.DB, username string) (*AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE username = $1 AND deleted_at IS NULL
	`, config.GetTableName("admin_users"))
	user := &AdminUser{}
	var lastLoginAt sql.NullTime
	var nickname, email, phone, avatar, lastLoginIP sql.NullString
	err := db.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.Password, &nickname,
		&email, &phone, &avatar, &user.Status,
		&lastLoginAt, &lastLoginIP, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	user.Nickname = nickname.String
	user.Email = email.String
	user.Phone = phone.String
	user.Avatar = avatar.String
	user.LastLoginIP = lastLoginIP.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	return user, nil
}

// ExistsByUsername 检查用户名是否存在
//
// 返回用户名是否已被使用
func (AdminUser) ExistsByUsername(db *sql.DB, username string) bool {
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE username = $1 AND deleted_at IS NULL`, config.GetTableName("admin_users"))
	var count int
	db.QueryRow(query, username).Scan(&count)
	return count > 0
}

// ListAll 获取所有用户列表
//
// 返回所有未删除的用户
func (AdminUser) ListAll(db *sql.DB) ([]AdminUser, error) {
	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
	`, config.GetTableName("admin_users"))
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		var lastLoginAt sql.NullTime
		var nickname, email, phone, avatar, lastLoginIP sql.NullString
		err := rows.Scan(
			&user.ID, &user.Username, &user.Password, &nickname,
			&email, &phone, &avatar, &user.Status,
			&lastLoginAt, &lastLoginIP, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		user.Nickname = nickname.String
		user.Email = email.String
		user.Phone = phone.String
		user.Avatar = avatar.String
		user.LastLoginIP = lastLoginIP.String
		if lastLoginAt.Valid {
			user.LastLoginAt = &lastLoginAt.Time
		}
		users = append(users, user)
	}
	return users, nil
}

// List 分页获取用户列表
//
// 返回分页用户列表和总数
func (AdminUser) List(db *sql.DB, page, pageSize int) ([]AdminUser, int, error) {
	offset := (page - 1) * pageSize

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE deleted_at IS NULL`, config.GetTableName("admin_users"))
	var total int
	db.QueryRow(countQuery).Scan(&total)

	query := fmt.Sprintf(`
		SELECT id, username, password_hash, nickname, email, phone, avatar, status, 
			   last_login_at, last_login_ip, created_at, updated_at
		FROM %s 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, config.GetTableName("admin_users"))
	rows, err := db.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		var lastLoginAt sql.NullTime
		var nickname, email, phone, avatar, lastLoginIP sql.NullString
		err := rows.Scan(
			&user.ID, &user.Username, &user.Password, &nickname,
			&email, &phone, &avatar, &user.Status,
			&lastLoginAt, &lastLoginIP, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		user.Nickname = nickname.String
		user.Email = email.String
		user.Phone = phone.String
		user.Avatar = avatar.String
		user.LastLoginIP = lastLoginIP.String
		if lastLoginAt.Valid {
			user.LastLoginAt = &lastLoginAt.Time
		}
		users = append(users, user)
	}
	return users, total, nil
}

// UpdatePassword 更新密码
//
// 更新用户密码哈希
func (AdminUser) UpdatePassword(db *sql.DB, id, passwordHash string) error {
	query := fmt.Sprintf(`UPDATE %s SET password_hash = $1, updated_at = $2 WHERE id = $3`, config.GetTableName("admin_users"))
	_, err := db.Exec(query, passwordHash, time.Now(), id)
	return err
}

// UpdateLastLogin 更新最后登录时间
//
// 记录用户最后登录时间
func (AdminUser) UpdateLastLogin(db *sql.DB, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET last_login_at = $1, updated_at = $2 WHERE id = $3`, config.GetTableName("admin_users"))
	now := time.Now()
	_, err := db.Exec(query, now, now, id)
	return err
}

// GetRoleIDs 获取用户角色ID列表
//
// 返回用户关联的所有角色ID
func (AdminUser) GetRoleIDs(db *sql.DB, userID string) ([]string, error) {
	query := fmt.Sprintf(`SELECT role_id FROM %s WHERE user_id = $1`, config.GetTableName("admin_user_roles"))
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roleIDs []string
	for rows.Next() {
		var roleID string
		if err := rows.Scan(&roleID); err != nil {
			return nil, err
		}
		roleIDs = append(roleIDs, roleID)
	}
	return roleIDs, nil
}

// GetRoles 获取用户角色列表
//
// 返回用户关联的所有角色信息
func (AdminUser) GetRoles(db *sql.DB, userID string) ([]AdminRole, error) {
	query := fmt.Sprintf(`
		SELECT r.id, r.name, r.code, r.description, r.status, r.created_at, r.updated_at
		FROM %s r
		INNER JOIN %s ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.deleted_at IS NULL
	`, config.GetTableName("admin_roles"), config.GetTableName("admin_user_roles"))
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []AdminRole
	for rows.Next() {
		var role AdminRole
		err := rows.Scan(
			&role.ID, &role.Name, &role.Code, &role.Description,
			&role.Status, &role.CreatedAt, &role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// SetRoles 设置用户角色
//
// 替换用户的所有角色关联
func (AdminUser) SetRoles(db *sql.DB, userID string, roleIDs []string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(fmt.Sprintf(`DELETE FROM %s WHERE user_id = $1`, config.GetTableName("admin_user_roles")), userID); err != nil {
		return err
	}

	for _, roleID := range roleIDs {
		_, err := tx.Exec(fmt.Sprintf(`INSERT INTO %s (user_id, role_id) VALUES ($1, $2)`, config.GetTableName("admin_user_roles")), userID, roleID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetRoleCodes 获取用户角色代码列表
//
// 返回用户关联的所有有效角色代码
func (AdminUser) GetRoleCodes(db *sql.DB, userID string) ([]string, error) {
	query := fmt.Sprintf(`
		SELECT r.code
		FROM %s r
		INNER JOIN %s ur ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND r.status = 1 AND r.deleted_at IS NULL
	`, config.GetTableName("admin_roles"), config.GetTableName("admin_user_roles"))
	rows, err := db.Query(query, userID)
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

// GetButtonCodes 获取用户按钮权限代码列表
//
// 返回用户拥有的所有按钮权限代码
func (AdminUser) GetButtonCodes(db *sql.DB, userID string) ([]string, error) {
	query := fmt.Sprintf(`
		SELECT DISTINCT p.code
		FROM %s p
		INNER JOIN %s rp ON p.id = rp.permission_id
		INNER JOIN %s ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1 AND p.type = 'button' AND p.status = 1 AND p.deleted_at IS NULL
	`, config.GetTableName("admin_permissions"), config.GetTableName("admin_role_permissions"), config.GetTableName("admin_user_roles"))
	rows, err := db.Query(query, userID)
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
