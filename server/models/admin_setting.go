// Package models 提供数据模型定义
//
// 本文件定义管理后台设置模型及相关数据库操作方法
package models

import (
	"database/sql"
	"time"
)

// AdminSetting 管理后台设置模型
type AdminSetting struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// TableName 返回表名
func (AdminSetting) TableName() string {
	return "admin_settings"
}

// GetAll 获取所有管理后台设置
//
// 返回所有设置列表
func (AdminSetting) GetAll(db *sql.DB) ([]AdminSetting, error) {
	query := `
		SELECT key, value, description, created_at, updated_at
		FROM admin_settings
		ORDER BY key
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []AdminSetting
	for rows.Next() {
		var setting AdminSetting
		var description sql.NullString
		err := rows.Scan(
			&setting.Key, &setting.Value, &description,
			&setting.CreatedAt, &setting.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			setting.Description = description.String
		}
		settings = append(settings, setting)
	}
	return settings, nil
}

// Save 保存管理后台设置
//
// 插入或更新设置
func (s *AdminSetting) Save(db *sql.DB) error {
	query := `
		INSERT INTO admin_settings (key, value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_at = $5
	`
	now := time.Now()
	_, err := db.Exec(query, s.Key, s.Value, s.Description, now, now)
	if err != nil {
		return err
	}
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

// BatchSave 批量保存设置
//
// 批量插入或更新多个设置
func (AdminSetting) BatchSave(db *sql.DB, settings []AdminSetting) error {
	for _, s := range settings {
		if err := s.Save(db); err != nil {
			return err
		}
	}
	return nil
}
