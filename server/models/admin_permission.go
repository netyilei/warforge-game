package models

import (
	"time"

	"gorm.io/gorm"
)

type AdminPermission struct {
	ID        string         `gorm:"primaryKey;type:VARCHAR(36)" json:"id"`
	Name      string         `gorm:"type:VARCHAR(50);not null" json:"name"`
	Code      string         `gorm:"type:VARCHAR(100);uniqueIndex;not null" json:"code"`
	Type      string         `gorm:"type:VARCHAR(20);not null" json:"type"`
	ParentID  *string        `gorm:"type:VARCHAR(36)" json:"parentId"`
	Path      string         `gorm:"type:VARCHAR(255)" json:"path"`
	Component string         `gorm:"type:VARCHAR(255)" json:"component"`
	Icon      string         `gorm:"type:VARCHAR(50)" json:"icon"`
	SortOrder int            `gorm:"type:INT;default:0" json:"sortOrder"`
	Status    int            `gorm:"type:INT;default:1" json:"status"`
	CreatedAt time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"type:TIMESTAMP;index" json:"-"`
}

func (AdminPermission) TableName() string {
	return "admin_permissions"
}

func (p *AdminPermission) Create(db *gorm.DB) error {
	return db.Create(p).Error
}

func (p *AdminPermission) Update(db *gorm.DB) error {
	return db.Save(p).Error
}

func (p *AdminPermission) Delete(db *gorm.DB) error {
	return db.Delete(p).Error
}

func (AdminPermission) FindByID(db *gorm.DB, id string) (*AdminPermission, error) {
	var perm AdminPermission
	err := db.Where("id = ?", id).First(&perm).Error
	if err != nil {
		return nil, err
	}
	return &perm, nil
}

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

func (AdminPermission) GetByUserID(db *gorm.DB, userID string) ([]PermissionDTO, error) {
	var permissions []PermissionDTO
	err := db.Table("admin_permissions p").
		Select("DISTINCT p.id, p.name, p.code, p.type, COALESCE(p.parent_id::text, '') as parent_id, p.path, p.component, p.icon, p.sort_order, p.status").
		Joins("INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id").
		Joins("INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id").
		Where("ur.user_id = ? AND p.status = 1", userID).
		Order("p.sort_order").
		Scan(&permissions).Error
	return permissions, err
}

func (AdminPermission) GetMenusByUserID(db *gorm.DB, userID string) ([]PermissionDTO, error) {
	var permissions []PermissionDTO
	err := db.Table("admin_permissions p").
		Select("DISTINCT p.id, p.name, p.code, p.type, COALESCE(p.parent_id::text, '') as parent_id, p.path, p.component, p.icon, p.sort_order").
		Joins("INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id").
		Joins("INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id").
		Where("ur.user_id = ? AND p.status = 1 AND p.type = 'menu'", userID).
		Order("p.sort_order").
		Scan(&permissions).Error
	return permissions, err
}

func (AdminPermission) CheckRouteAccess(db *gorm.DB, userID, routePath string) (bool, error) {
	var count int64
	err := db.Table("admin_permissions p").
		Joins("INNER JOIN admin_role_permissions rp ON p.id = rp.permission_id").
		Joins("INNER JOIN admin_user_roles ur ON rp.role_id = ur.role_id").
		Where("ur.user_id = ? AND p.path = ? AND p.status = 1", userID, routePath).
		Count(&count).Error
	return count > 0, err
}
