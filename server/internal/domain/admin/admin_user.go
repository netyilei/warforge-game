package admin

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type AdminUserStatus int

const (
	AdminUserStatusActive   AdminUserStatus = 1
	AdminUserStatusInactive AdminUserStatus = 0
)

type AdminUser struct {
	shared.BaseEntity
	username    string
	password    string
	nickname    string
	email       string
	phone       string
	avatar      string
	status      AdminUserStatus
	lastLoginAt *time.Time
	lastLoginIP string
	roles       []*AdminRole
}

func NewAdminUser(id, username, password string) *AdminUser {
	return &AdminUser{
		BaseEntity: shared.NewBaseEntity(id),
		username:   username,
		password:   password,
		status:     AdminUserStatusActive,
		roles:      make([]*AdminRole, 0),
	}
}

func (u *AdminUser) Username() string {
	return u.username
}

func (u *AdminUser) Password() string {
	return u.password
}

func (u *AdminUser) SetPassword(password string) {
	u.password = password
	u.Touch()
}

func (u *AdminUser) Nickname() string {
	return u.nickname
}

func (u *AdminUser) SetNickname(nickname string) {
	u.nickname = nickname
	u.Touch()
}

func (u *AdminUser) Email() string {
	return u.email
}

func (u *AdminUser) SetEmail(email string) {
	u.email = email
	u.Touch()
}

func (u *AdminUser) Phone() string {
	return u.phone
}

func (u *AdminUser) SetPhone(phone string) {
	u.phone = phone
	u.Touch()
}

func (u *AdminUser) Avatar() string {
	return u.avatar
}

func (u *AdminUser) SetAvatar(avatar string) {
	u.avatar = avatar
	u.Touch()
}

func (u *AdminUser) Status() AdminUserStatus {
	return u.status
}

func (u *AdminUser) SetStatus(status AdminUserStatus) {
	u.status = status
	u.Touch()
}

func (u *AdminUser) LastLoginAt() *time.Time {
	return u.lastLoginAt
}

func (u *AdminUser) SetLastLoginAt(t *time.Time) {
	u.lastLoginAt = t
	u.Touch()
}

func (u *AdminUser) LastLoginIP() string {
	return u.lastLoginIP
}

func (u *AdminUser) SetLastLoginIP(ip string) {
	u.lastLoginIP = ip
	u.Touch()
}

func (u *AdminUser) Roles() []*AdminRole {
	return u.roles
}

func (u *AdminUser) SetRoles(roles []*AdminRole) {
	u.roles = roles
	u.Touch()
}

func (u *AdminUser) AddRole(role *AdminRole) {
	u.roles = append(u.roles, role)
	u.Touch()
}

func (u *AdminUser) IsActive() bool {
	return u.status == AdminUserStatusActive
}

type AdminUserDTO struct {
	ID          string          `json:"id"`
	Username    string          `json:"username"`
	Nickname    string          `json:"nickname"`
	Email       string          `json:"email"`
	Phone       string          `json:"phone"`
	Avatar      string          `json:"avatar"`
	Status      AdminUserStatus `json:"status"`
	LastLoginAt *string         `json:"lastLoginAt"`
	LastLoginIP string          `json:"lastLoginIp"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

func (u *AdminUser) ToDTO() *AdminUserDTO {
	var lastLoginAt *string
	if u.lastLoginAt != nil {
		t := u.lastLoginAt.Format(time.RFC3339)
		lastLoginAt = &t
	}
	return &AdminUserDTO{
		ID:          u.ID(),
		Username:    u.username,
		Nickname:    u.nickname,
		Email:       u.email,
		Phone:       u.phone,
		Avatar:      u.avatar,
		Status:      u.status,
		LastLoginAt: lastLoginAt,
		LastLoginIP: u.lastLoginIP,
		CreatedAt:   u.CreatedAt(),
		UpdatedAt:   u.UpdatedAt(),
	}
}
