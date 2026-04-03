package models

import (
	"time"

	"gorm.io/gorm"
)

type AdminUser struct {
	ID          string         `gorm:"primaryKey;type:VARCHAR(36)" json:"id"`
	Username    string         `gorm:"type:VARCHAR(50);uniqueIndex;not null" json:"username"`
	Password    string         `gorm:"type:VARCHAR(255);not null" json:"-"`
	Nickname    string         `gorm:"type:VARCHAR(50)" json:"nickname"`
	Email       string         `gorm:"type:VARCHAR(100)" json:"email"`
	Phone       string         `gorm:"type:VARCHAR(20)" json:"phone"`
	Avatar      string         `gorm:"type:VARCHAR(255)" json:"avatar"`
	Status      int            `gorm:"type:INT;default:1" json:"status"`
	LastLoginAt *time.Time     `gorm:"type:TIMESTAMP" json:"lastLoginAt"`
	LastLoginIP string         `gorm:"type:VARCHAR(45)" json:"lastLoginIp"`
	CreatedAt   time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"type:TIMESTAMP;index" json:"-"`
	Roles       []AdminRole    `gorm:"many2many:admin_user_roles;" json:"roles,omitempty"`
}

func (AdminUser) TableName() string {
	return "admin_users"
}

func (u *AdminUser) Create(db *gorm.DB) error {
	return db.Create(u).Error
}

func (u *AdminUser) Update(db *gorm.DB) error {
	return db.Save(u).Error
}

func (u *AdminUser) Delete(db *gorm.DB) error {
	return db.Delete(u).Error
}

func (AdminUser) FindByID(db *gorm.DB, id string) (*AdminUser, error) {
	var user AdminUser
	err := db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (AdminUser) FindByUsername(db *gorm.DB, username string) (*AdminUser, error) {
	var user AdminUser
	err := db.First(&user, "username = ?", username).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (AdminUser) ExistsByUsername(db *gorm.DB, username string) bool {
	var count int64
	db.Model(&AdminUser{}).Where("username = ?", username).Count(&count)
	return count > 0
}

func (AdminUser) ListAll(db *gorm.DB) ([]AdminUser, error) {
	var users []AdminUser
	err := db.Order("created_at DESC").Find(&users).Error
	return users, err
}

func (AdminUser) UpdatePassword(db *gorm.DB, id, passwordHash string) error {
	return db.Model(&AdminUser{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

func (AdminUser) UpdateLastLogin(db *gorm.DB, id string) error {
	return db.Model(&AdminUser{}).Where("id = ?", id).Update("last_login_at", time.Now()).Error
}

func (AdminUser) GetRoleIDs(db *gorm.DB, userID string) ([]string, error) {
	var roleIDs []string
	err := db.Model(&AdminUserRole{}).Where("user_id = ?", userID).Pluck("role_id", &roleIDs).Error
	return roleIDs, err
}

func (AdminUser) SetRoles(db *gorm.DB, userID string, roleIDs []string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&AdminUserRole{}).Error; err != nil {
			return err
		}
		for _, roleID := range roleIDs {
			userRole := AdminUserRole{UserID: userID, RoleID: roleID}
			if err := tx.Create(&userRole).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (AdminUser) GetRoleCodes(db *gorm.DB, userID string) ([]string, error) {
	var codes []string
	err := db.Model(&AdminRole{}).
		Select("admin_roles.code").
		Joins("INNER JOIN admin_user_roles ON admin_roles.id = admin_user_roles.role_id").
		Where("admin_user_roles.user_id = ? AND admin_roles.status = 1", userID).
		Pluck("admin_roles.code", &codes).Error
	return codes, err
}

func (AdminUser) GetButtonCodes(db *gorm.DB, userID string) ([]string, error) {
	var codes []string
	err := db.Model(&AdminPermission{}).
		Select("DISTINCT admin_permissions.code").
		Joins("INNER JOIN admin_role_permissions ON admin_permissions.id = admin_role_permissions.permission_id").
		Joins("INNER JOIN admin_user_roles ON admin_role_permissions.role_id = admin_user_roles.role_id").
		Where("admin_user_roles.user_id = ? AND admin_permissions.type = 'button' AND admin_permissions.status = 1", userID).
		Pluck("admin_permissions.code", &codes).Error
	return codes, err
}
