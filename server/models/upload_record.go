// Package models 提供数据模型定义
//
// 本文件定义上传记录模型及相关数据库操作方法
package models

import (
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
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
	return config.GetTableName("upload_records")
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
	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at
		FROM %s 
		WHERE id = $1
	`, config.GetTableName("upload_records"))
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

	uploadRecordsTable := config.GetTableName("upload_records")
	adminUsersTable := config.GetTableName("admin_users")
	storageConfigsTable := config.GetTableName("storage_configs")

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if userType != "" {
		whereClause += fmt.Sprintf(" AND ur.user_type = $%d", argIndex)
		args = append(args, userType)
		argIndex++
	}
	if uploadType != "" {
		whereClause += fmt.Sprintf(" AND ur.upload_type = $%d", argIndex)
		args = append(args, uploadType)
		argIndex++
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s ur `, uploadRecordsTable) + whereClause
	var total int
	db.QueryRow(countQuery, args...).Scan(&total)

	query := fmt.Sprintf(`
		SELECT ur.id, ur.user_id, ur.user_type, ur.original_name, ur.file_path, 
			   ur.file_size, ur.mime_type, ur.storage_id, ur.upload_type, ur.created_at,
			   COALESCE(au.username, '') as user_name,
			   COALESCE(sc.name, '') as storage_name
		FROM %s ur
		LEFT JOIN %s au ON ur.user_id = CAST(au.id AS VARCHAR) AND ur.user_type = 'admin'
		LEFT JOIN %s sc ON ur.storage_id = sc.id
	`, uploadRecordsTable, adminUsersTable, storageConfigsTable) + whereClause + fmt.Sprintf(`
		ORDER BY ur.created_at DESC
		LIMIT $%d OFFSET $%d
	`, argIndex, argIndex+1)

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
	query := fmt.Sprintf(`
		INSERT INTO %s (user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, config.GetTableName("upload_records"))
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
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, config.GetTableName("upload_records"))
	_, err := db.Exec(query, id)
	return err
}

// DeleteByUser 删除用户的所有上传记录
//
// 删除指定用户的所有上传记录
func (UploadRecord) DeleteByUser(db *sql.DB, userID, userType string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE user_id = $1 AND user_type = $2`, config.GetTableName("upload_records"))
	_, err := db.Exec(query, userID, userType)
	return err
}

// GetByUser 获取用户的上传记录列表
//
// 返回指定用户的分页上传记录列表
func (UploadRecord) GetByUser(db *sql.DB, userID, userType string, page, pageSize int) ([]UploadRecord, int, error) {
	offset := (page - 1) * pageSize

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE user_id = $1 AND user_type = $2`, config.GetTableName("upload_records"))
	var total int
	db.QueryRow(countQuery, userID, userType).Scan(&total)

	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at
		FROM %s 
		WHERE user_id = $1 AND user_type = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`, config.GetTableName("upload_records"))
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
