// Package models 提供数据模型定义
//
// 本文件定义用户档案模型及相关数据库操作方法
package models

import (
	"database/sql"
	"errors"
	"time"
)

// UserProfile 用户档案模型
type UserProfile struct {
	ID             string     `json:"id"`
	UserID         string     `json:"userId"`
	Nickname       string     `json:"nickname"`
	Avatar         string     `json:"avatar"`
	Phone          string     `json:"phone"`
	Email          string     `json:"email"`
	RealName       string     `json:"realName"`
	IDCard         string     `json:"-"`
	IDCardVerified bool       `json:"idCardVerified"`
	Status         int        `json:"status"`
	ApprovalStatus int        `json:"approvalStatus"`
	ApprovalNote   string     `json:"approvalNote"`
	ApprovedBy     string     `json:"approvedBy"`
	ApprovedAt     *time.Time `json:"approvedAt"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

const (
	ApprovalStatusPending  = 0
	ApprovalStatusApproved = 1
	ApprovalStatusRejected = 2
)

const (
	UserStatusActive   = 1
	UserStatusDisabled = 0
)

// TableName 返回表名
func (UserProfile) TableName() string {
	return "user_profiles"
}

// Create 创建用户档案
//
// 插入新用户档案记录到数据库
func (p *UserProfile) Create(db *sql.DB) error {
	query := `
		INSERT INTO user_profiles (id, user_id, nickname, avatar, phone, email, real_name, id_card, id_card_verified, status, approval_status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	now := time.Now()
	_, err := db.Exec(query, p.ID, p.UserID, p.Nickname, p.Avatar, p.Phone, p.Email, p.RealName, p.IDCard, p.IDCardVerified, p.Status, p.ApprovalStatus, now, now)
	if err != nil {
		return err
	}
	p.CreatedAt = now
	p.UpdatedAt = now
	return nil
}

// Update 更新用户档案
//
// 更新用户档案信息
func (p *UserProfile) Update(db *sql.DB) error {
	query := `
		UPDATE user_profiles 
		SET nickname = $1, avatar = $2, phone = $3, email = $4, real_name = $5, 
		    id_card = $6, id_card_verified = $7, status = $8, approval_status = $9,
		    approval_note = $10, approved_by = $11, approved_at = $12, updated_at = $13
		WHERE id = $14
	`
	now := time.Now()
	_, err := db.Exec(query, p.Nickname, p.Avatar, p.Phone, p.Email, p.RealName, p.IDCard, p.IDCardVerified, p.Status, p.ApprovalStatus, p.ApprovalNote, p.ApprovedBy, p.ApprovedAt, now, p.ID)
	if err != nil {
		return err
	}
	p.UpdatedAt = now
	return nil
}

// FindByUserID 根据用户ID查找档案
//
// 返回指定用户ID的档案信息
func (UserProfile) FindByUserID(db *sql.DB, userID string) (*UserProfile, error) {
	query := `
		SELECT id, user_id, nickname, avatar, phone, email, real_name, id_card, id_card_verified, 
			   status, approval_status, approval_note, approved_by, approved_at, created_at, updated_at
		FROM user_profiles 
		WHERE user_id = $1
	`
	profile := &UserProfile{}
	var approvedAt sql.NullTime
	var nickname, avatar, phone, email, realName, idCard, approvalNote, approvedBy sql.NullString
	err := db.QueryRow(query, userID).Scan(
		&profile.ID, &profile.UserID, &nickname, &avatar, &phone, &email, &realName, &idCard,
		&profile.IDCardVerified, &profile.Status, &profile.ApprovalStatus, &approvalNote, &approvedBy,
		&approvedAt, &profile.CreatedAt, &profile.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	profile.Nickname = nickname.String
	profile.Avatar = avatar.String
	profile.Phone = phone.String
	profile.Email = email.String
	profile.RealName = realName.String
	profile.IDCard = idCard.String
	profile.ApprovalNote = approvalNote.String
	profile.ApprovedBy = approvedBy.String
	if approvedAt.Valid {
		profile.ApprovedAt = &approvedAt.Time
	}
	return profile, nil
}

// FindOrCreateByUserID 查找或创建用户档案
//
// 如果档案不存在则创建新档案
func (UserProfile) FindOrCreateByUserID(db *sql.DB, userID string) (*UserProfile, error) {
	profile, err := UserProfile{}.FindByUserID(db, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			profile = &UserProfile{
				ID:             generateUUID(),
				UserID:         userID,
				Status:         UserStatusActive,
				ApprovalStatus: ApprovalStatusPending,
			}
			if err := profile.Create(db); err != nil {
				return nil, err
			}
			return profile, nil
		}
		return nil, err
	}
	return profile, nil
}

// UserListDTO 用户列表数据传输对象
type UserListDTO struct {
	ID             string     `json:"id"`
	UserID         string     `json:"userId"`
	Username       string     `json:"username"`
	Nickname       string     `json:"nickname"`
	Avatar         string     `json:"avatar"`
	Phone          string     `json:"phone"`
	Email          string     `json:"email"`
	Status         int        `json:"status"`
	ApprovalStatus int        `json:"approvalStatus"`
	CreatedAt      time.Time  `json:"createdAt"`
	LastLoginAt    *time.Time `json:"lastLoginAt"`
}

// ListAll 分页获取用户列表
//
// 返回分页用户列表和总数
func (UserProfile) ListAll(db *sql.DB, page, pageSize int) ([]UserListDTO, int, error) {
	offset := (page - 1) * pageSize

	countQuery := `SELECT COUNT(*) FROM user_profiles`
	var total int
	db.QueryRow(countQuery).Scan(&total)

	query := `
		SELECT id, user_id, nickname, avatar, phone, email, status, approval_status, created_at
		FROM user_profiles
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := db.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []UserListDTO
	for rows.Next() {
		var user UserListDTO
		var nickname, avatar, phone, email sql.NullString
		err := rows.Scan(
			&user.ID, &user.UserID, &nickname, &avatar, &phone, &email,
			&user.Status, &user.ApprovalStatus, &user.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		user.Nickname = nickname.String
		user.Avatar = avatar.String
		user.Phone = phone.String
		user.Email = email.String
		users = append(users, user)
	}
	return users, total, nil
}

// ListPendingApproval 分页获取待审核用户列表
//
// 返回待审核用户列表和总数
func (UserProfile) ListPendingApproval(db *sql.DB, page, pageSize int) ([]UserListDTO, int, error) {
	offset := (page - 1) * pageSize

	countQuery := `SELECT COUNT(*) FROM user_profiles WHERE approval_status = $1`
	var total int
	db.QueryRow(countQuery, ApprovalStatusPending).Scan(&total)

	query := `
		SELECT id, user_id, nickname, avatar, phone, email, status, approval_status, created_at
		FROM user_profiles
		WHERE approval_status = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := db.Query(query, ApprovalStatusPending, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []UserListDTO
	for rows.Next() {
		var user UserListDTO
		var nickname, avatar, phone, email sql.NullString
		err := rows.Scan(
			&user.ID, &user.UserID, &nickname, &avatar, &phone, &email,
			&user.Status, &user.ApprovalStatus, &user.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		user.Nickname = nickname.String
		user.Avatar = avatar.String
		user.Phone = phone.String
		user.Email = email.String
		users = append(users, user)
	}
	return users, total, nil
}

// Approve 审核通过用户
//
// 更新用户审核状态为通过
func (UserProfile) Approve(db *sql.DB, userID, approvedBy, note string) error {
	query := `
		UPDATE user_profiles 
		SET approval_status = $1, approved_by = $2, approved_at = $3, approval_note = $4, status = $5, updated_at = $6
		WHERE user_id = $7
	`
	now := time.Now()
	_, err := db.Exec(query, ApprovalStatusApproved, approvedBy, now, note, UserStatusActive, now, userID)
	return err
}

// Reject 审核拒绝用户
//
// 更新用户审核状态为拒绝
func (UserProfile) Reject(db *sql.DB, userID, approvedBy, note string) error {
	query := `
		UPDATE user_profiles 
		SET approval_status = $1, approved_by = $2, approved_at = $3, approval_note = $4, updated_at = $5
		WHERE user_id = $6
	`
	now := time.Now()
	_, err := db.Exec(query, ApprovalStatusRejected, approvedBy, now, note, now, userID)
	return err
}

// UpdateStatus 更新用户状态
//
// 更新用户启用/禁用状态
func (UserProfile) UpdateStatus(db *sql.DB, userID string, status int) error {
	query := `UPDATE user_profiles SET status = $1, updated_at = $2 WHERE user_id = $3`
	_, err := db.Exec(query, status, time.Now(), userID)
	return err
}

// generateUUID 生成UUID
//
// 生成唯一标识符
func generateUUID() string {
	return time.Now().Format("20060102150405") + randomString(8)
}

// randomString 生成随机字符串
func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[(time.Now().UnixNano()+int64(i))%int64(len(letters))]
	}
	return string(b)
}
