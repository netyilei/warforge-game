// Package models 提供数据模型定义
//
// 本文件定义上传记录模型及相关数据库操作方法
package models

import (
	"database/sql"
	"time"
)

// UploadRecord 上传记录模型
type UploadRecord struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	UserType     string    `json:"userType"`
	OriginalName string    `json:"originalName"`
	FilePath     string    `json:"filePath"`
	FileSize     int64     `json:"fileSize"`
	MimeType     string    `json:"mimeType"`
	StorageID    string    `json:"storageId"`
	UploadType   string    `json:"uploadType"`
	CreatedAt    time.Time `json:"createdAt"`
}

// TableName 返回表名
func (UploadRecord) TableName() string {
	return "upload_records"
}

// UploadRecordList 上传记录列表DTO
type UploadRecordList struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	UserType     string    `json:"userType"`
	UserName     string    `json:"userName"`
	OriginalName string    `json:"originalName"`
	FilePath     string    `json:"filePath"`
	FileSize     int64     `json:"fileSize"`
	MimeType     string    `json:"mimeType"`
	StorageID    string    `json:"storageId"`
	StorageName  string    `json:"storageName"`
	UploadType   string    `json:"uploadType"`
	CreatedAt    time.Time `json:"createdAt"`
}

// GetByID 根据ID获取上传记录
//
// 返回指定ID的上传记录
func (UploadRecord) GetByID(db *sql.DB, id string) (*UploadRecord, error) {
	query := `
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at
		FROM upload_records 
		WHERE id = $1
	`
	record := &UploadRecord{}
	err := db.QueryRow(query, id).Scan(
		&record.ID, &record.UserID, &record.UserType, &record.OriginalName,
		&record.FilePath, &record.FileSize, &record.MimeType,
		&record.StorageID, &record.UploadType, &record.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return record, nil
}

// List 分页获取上传记录列表
//
// 返回分页上传记录列表和总数
func (UploadRecord) List(db *sql.DB, page, pageSize int, userType, uploadType string) ([]UploadRecordList, int, error) {
	offset := (page - 1) * pageSize

	// 构建查询条件
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if userType != "" {
		whereClause += " AND ur.user_type = $" + string(rune('0'+argIndex))
		args = append(args, userType)
		argIndex++
	}
	if uploadType != "" {
		whereClause += " AND ur.upload_type = $" + string(rune('0'+argIndex))
		args = append(args, uploadType)
		argIndex++
	}

	// 获取总数
	countQuery := `SELECT COUNT(*) FROM upload_records ur ` + whereClause
	var total int
	db.QueryRow(countQuery, args...).Scan(&total)

	// 获取列表
	query := `
		SELECT ur.id, ur.user_id, ur.user_type, ur.original_name, ur.file_path, 
			   ur.file_size, ur.mime_type, ur.storage_id, ur.upload_type, ur.created_at,
			   COALESCE(au.username, '') as user_name,
			   COALESCE(sc.name, '') as storage_name
		FROM upload_records ur
		LEFT JOIN admin_users au ON ur.user_id = au.id AND ur.user_type = 'admin'
		LEFT JOIN storage_configs sc ON ur.storage_id = sc.id
		` + whereClause + `
		ORDER BY ur.created_at DESC
		LIMIT $` + string(rune('0'+argIndex)) + ` OFFSET $` + string(rune('0'+argIndex+1))

	args = append(args, pageSize, offset)
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []UploadRecordList
	for rows.Next() {
		var record UploadRecordList
		err := rows.Scan(
			&record.ID, &record.UserID, &record.UserType, &record.OriginalName,
			&record.FilePath, &record.FileSize, &record.MimeType,
			&record.StorageID, &record.UploadType, &record.CreatedAt,
			&record.UserName, &record.StorageName,
		)
		if err != nil {
			return nil, 0, err
		}
		records = append(records, record)
	}
	return records, total, nil
}

// Create 创建上传记录
//
// 插入新的上传记录
func (r *UploadRecord) Create(db *sql.DB) error {
	query := `
		INSERT INTO upload_records (user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	now := time.Now()
	err := db.QueryRow(query, r.UserID, r.UserType, r.OriginalName, r.FilePath,
		r.FileSize, r.MimeType, r.StorageID, r.UploadType, now).Scan(&r.ID)
	if err != nil {
		return err
	}
	r.CreatedAt = now
	return nil
}

// Delete 删除上传记录
//
// 删除指定ID的上传记录
func (UploadRecord) Delete(db *sql.DB, id string) error {
	query := `DELETE FROM upload_records WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}

// DeleteByUser 删除用户的所有上传记录
//
// 删除指定用户的所有上传记录
func (UploadRecord) DeleteByUser(db *sql.DB, userID, userType string) error {
	query := `DELETE FROM upload_records WHERE user_id = $1 AND user_type = $2`
	_, err := db.Exec(query, userID, userType)
	return err
}

// GetByUser 获取用户的上传记录列表
//
// 返回指定用户的分页上传记录列表
func (UploadRecord) GetByUser(db *sql.DB, userID, userType string, page, pageSize int) ([]UploadRecord, int, error) {
	offset := (page - 1) * pageSize

	// 获取总数
	countQuery := `SELECT COUNT(*) FROM upload_records WHERE user_id = $1 AND user_type = $2`
	var total int
	db.QueryRow(countQuery, userID, userType).Scan(&total)

	// 获取列表
	query := `
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at
		FROM upload_records 
		WHERE user_id = $1 AND user_type = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := db.Query(query, userID, userType, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []UploadRecord
	for rows.Next() {
		var record UploadRecord
		err := rows.Scan(
			&record.ID, &record.UserID, &record.UserType, &record.OriginalName,
			&record.FilePath, &record.FileSize, &record.MimeType,
			&record.StorageID, &record.UploadType, &record.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		records = append(records, record)
	}
	return records, total, nil
}
