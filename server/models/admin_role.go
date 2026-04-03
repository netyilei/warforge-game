package models

import (
	"time"

	"gorm.io/gorm"
)

type AdminRole struct {
	ID          string         `gorm:"primaryKey;type:VARCHAR(36)" json:"id"`
	Name        string         `gorm:"type:VARCHAR(50);not null" json:"name"`
	Code        string         `gorm:"type:VARCHAR(50);uniqueIndex;not null" json:"code"`
	Description string         `gorm:"type:VARCHAR(255)" json:"description"`
	Status      int            `gorm:"type:INT;default:1" json:"status"`
	SortOrder   int            `gorm:"type:INT;default:0" json:"sortOrder"`
	CreatedAt   time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt   time.Time      `gorm:"type:TIMESTAMP;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"type:TIMESTAMP;index" json:"-"`
}

func (AdminRole) TableName() string {
	return "admin_roles"
}

func (r *AdminRole) Create(db *gorm.DB) error {
	return db.Create(r).Error
}

func (r *AdminRole) Update(db *gorm.DB) error {
	return db.Save(r).Error
}

func (r *AdminRole) Delete(db *gorm.DB) error {
	return db.Delete(r).Error
}

func (AdminRole) FindByID(db *gorm.DB, id string) (*AdminRole, error) {
	var role AdminRole
	err := db.Where("id = ?", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (AdminRole) ListAll(db *gorm.DB) ([]AdminRole, error) {
	var roles []AdminRole
	err := db.Order("sort_order").Find(&roles).Error
	return roles, err
}
