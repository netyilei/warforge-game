// Package models 提供数据模型定义
//
// 本文件定义存储配置模型及相关数据库操作方法
package models

import (
	"database/sql"
	"time"
)

// StorageDriver 存储驱动类型
type StorageDriver string

// 存储驱动常量
const (
	StorageDriverCloudflare   StorageDriver = "cloudflare"
	StorageDriverAWS          StorageDriver = "aws"
	StorageDriverMinIO        StorageDriver = "minio"
	StorageDriverDigitalOcean StorageDriver = "digitalocean"
	StorageDriverBackblaze    StorageDriver = "backblaze"
	StorageDriverWasabi       StorageDriver = "wasabi"
)

// StorageConfig 存储配置模型
type StorageConfig struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Driver       StorageDriver `json:"driver"`
	Bucket       string        `json:"bucket"`
	Endpoint     string        `json:"endpoint"`
	Region       string        `json:"region"`
	AccessKey    string        `json:"accessKey"`
	SecretKey    string        `json:"secretKey"`
	PublicDomain string        `json:"publicDomain"`
	MaxFileSize  int64         `json:"maxFileSize"`
	AllowedTypes string        `json:"allowedTypes"`
	IsDefault    bool          `json:"isDefault"`
	Status       int           `json:"status"`
	CreatedAt    time.Time     `json:"createdAt"`
	UpdatedAt    time.Time     `json:"updatedAt"`
}

// TableName 返回表名
func (StorageConfig) TableName() string {
	return "storage_configs"
}

// GetByID 根据ID获取存储配置
//
// 返回指定ID的存储配置
func (StorageConfig) GetByID(db *sql.DB, id string) (*StorageConfig, error) {
	query := `
		SELECT id, name, driver, bucket, endpoint, region, access_key, secret_key, 
			   public_domain, max_file_size, allowed_types, is_default, status, created_at, updated_at
		FROM storage_configs 
		WHERE id = $1
	`
	config := &StorageConfig{}
	err := db.QueryRow(query, id).Scan(
		&config.ID, &config.Name, &config.Driver, &config.Bucket,
		&config.Endpoint, &config.Region, &config.AccessKey, &config.SecretKey,
		&config.PublicDomain, &config.MaxFileSize, &config.AllowedTypes,
		&config.IsDefault, &config.Status, &config.CreatedAt, &config.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return config, nil
}

// GetDefault 获取默认存储配置
//
// 返回标记为默认的存储配置
func (StorageConfig) GetDefault(db *sql.DB) (*StorageConfig, error) {
	query := `
		SELECT id, name, driver, bucket, endpoint, region, access_key, secret_key, 
			   public_domain, max_file_size, allowed_types, is_default, status, created_at, updated_at
		FROM storage_configs 
		WHERE is_default = true AND status = 1
	`
	config := &StorageConfig{}
	err := db.QueryRow(query).Scan(
		&config.ID, &config.Name, &config.Driver, &config.Bucket,
		&config.Endpoint, &config.Region, &config.AccessKey, &config.SecretKey,
		&config.PublicDomain, &config.MaxFileSize, &config.AllowedTypes,
		&config.IsDefault, &config.Status, &config.CreatedAt, &config.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return config, nil
}

// ListAll 获取所有存储配置列表
//
// 返回所有存储配置
func (StorageConfig) ListAll(db *sql.DB) ([]StorageConfig, error) {
	query := `
		SELECT id, name, driver, bucket, endpoint, region, access_key, secret_key, 
			   public_domain, max_file_size, allowed_types, is_default, status, created_at, updated_at
		FROM storage_configs 
		ORDER BY is_default DESC, created_at DESC
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []StorageConfig
	for rows.Next() {
		var config StorageConfig
		err := rows.Scan(
			&config.ID, &config.Name, &config.Driver, &config.Bucket,
			&config.Endpoint, &config.Region, &config.AccessKey, &config.SecretKey,
			&config.PublicDomain, &config.MaxFileSize, &config.AllowedTypes,
			&config.IsDefault, &config.Status, &config.CreatedAt, &config.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}
	return configs, nil
}

// Create 创建存储配置
//
// 插入新的存储配置记录
func (s *StorageConfig) Create(db *sql.DB) error {
	query := `
		INSERT INTO storage_configs (name, driver, bucket, endpoint, region, access_key, secret_key, 
									 public_domain, max_file_size, allowed_types, is_default, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id
	`
	now := time.Now()
	err := db.QueryRow(query, s.Name, s.Driver, s.Bucket, s.Endpoint, s.Region,
		s.AccessKey, s.SecretKey, s.PublicDomain, s.MaxFileSize, s.AllowedTypes,
		s.IsDefault, s.Status, now, now).Scan(&s.ID)
	if err != nil {
		return err
	}
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

// Update 更新存储配置
//
// 更新存储配置信息
func (s *StorageConfig) Update(db *sql.DB) error {
	query := `
		UPDATE storage_configs 
		SET name = $1, driver = $2, bucket = $3, endpoint = $4, region = $5, 
			access_key = $6, secret_key = $7, public_domain = $8, max_file_size = $9, 
			allowed_types = $10, is_default = $11, status = $12, updated_at = $13
		WHERE id = $14
	`
	now := time.Now()
	_, err := db.Exec(query, s.Name, s.Driver, s.Bucket, s.Endpoint, s.Region,
		s.AccessKey, s.SecretKey, s.PublicDomain, s.MaxFileSize, s.AllowedTypes,
		s.IsDefault, s.Status, now, s.ID)
	if err != nil {
		return err
	}
	s.UpdatedAt = now
	return nil
}

// Delete 删除存储配置
//
// 删除指定ID的存储配置
func (StorageConfig) Delete(db *sql.DB, id string) error {
	query := `DELETE FROM storage_configs WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// SetDefault 设置默认存储配置
//
// 将指定ID的存储配置设为默认
func (StorageConfig) SetDefault(db *sql.DB, id string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 取消所有默认配置
	if _, err := tx.Exec(`UPDATE storage_configs SET is_default = false`); err != nil {
		return err
	}

	// 设置新的默认配置
	if _, err := tx.Exec(`UPDATE storage_configs SET is_default = true WHERE id = $1`, id); err != nil {
		return err
	}

	return tx.Commit()
}

// ClearDefault 清除所有默认配置
//
// 将所有存储配置的默认标记清除
func (StorageConfig) ClearDefault(db *sql.DB) error {
	query := `UPDATE storage_configs SET is_default = false`
	_, err := db.Exec(query)
	return err
}

// GetActiveCount 获取活跃存储配置数量
//
// 返回状态为活跃的存储配置数量
func (StorageConfig) GetActiveCount(db *sql.DB) (int, error) {
	query := `SELECT COUNT(*) FROM storage_configs WHERE status = 1`
	var count int
	err := db.QueryRow(query).Scan(&count)
	return count, err
}
