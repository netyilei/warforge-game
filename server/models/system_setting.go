// Package models 提供数据模型定义
//
// 本文件定义系统设置模型及相关数据库操作方法
package models

import (
	"database/sql"
	"time"
)

// SystemSetting 系统设置模型
type SystemSetting struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// TableName 返回表名
func (SystemSetting) TableName() string {
	return "system_settings"
}

// Save 保存系统设置
//
// 插入或更新系统设置
func (s *SystemSetting) Save(db *sql.DB) error {
	query := `
		INSERT INTO system_settings (key, value, description, created_at, updated_at)
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

// GetByKey 根据键获取系统设置
//
// 返回指定键的系统设置
func (SystemSetting) GetByKey(db *sql.DB, key string) (*SystemSetting, error) {
	query := `
		SELECT key, value, description, created_at, updated_at
		FROM system_settings 
		WHERE key = $1
	`
	setting := &SystemSetting{}
	err := db.QueryRow(query, key).Scan(
		&setting.Key, &setting.Value, &setting.Description,
		&setting.CreatedAt, &setting.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return setting, nil
}

// GetAll 获取所有系统设置
//
// 返回所有系统设置列表
func (SystemSetting) GetAll(db *sql.DB) ([]SystemSetting, error) {
	query := `SELECT key, value, description, created_at, updated_at FROM system_settings`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []SystemSetting
	for rows.Next() {
		var setting SystemSetting
		err := rows.Scan(
			&setting.Key, &setting.Value, &setting.Description,
			&setting.CreatedAt, &setting.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		settings = append(settings, setting)
	}
	return settings, nil
}

// GetBool 获取布尔类型系统设置
//
// 返回指定键的布尔值
func (SystemSetting) GetBool(db *sql.DB, key string) bool {
	setting, err := SystemSetting{}.GetByKey(db, key)
	if err != nil {
		return false
	}
	return setting.Value == "true"
}

// SetBool 设置布尔类型系统设置
//
// 保存指定键的布尔值
func (SystemSetting) SetBool(db *sql.DB, key string, value bool, description string) error {
	setting := &SystemSetting{
		Key:         key,
		Description: description,
	}
	if value {
		setting.Value = "true"
	} else {
		setting.Value = "false"
	}
	return setting.Save(db)
}

// InitDefaults 初始化默认系统设置
//
// 插入默认系统设置值
func (SystemSetting) InitDefaults(db *sql.DB) error {
	defaults := []SystemSetting{
		{Key: "require_registration_approval", Value: "false", Description: "用户注册是否需要审核"},
		{Key: "require_identity_verification", Value: "false", Description: "用户注册是否需要证件核实"},
	}
	for _, s := range defaults {
		if err := s.Save(db); err != nil {
			return err
		}
	}
	return nil
}
