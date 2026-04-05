// Package models 提供数据模型定义
//
// 本文件定义内容分类相关的数据模型和数据库操作
package models

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"warforge-server/config"
)

var (
	ErrCategoryNotFound   = errors.New("分类不存在")
	ErrCategoryCodeExists = errors.New("分类标识已存在")
)

// ContentCategory 内容分类模型
type ContentCategory struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Code        string     `json:"code"`
	Icon        *string    `json:"icon"`
	ParentID    *string    `json:"parentId"`
	ContentType string     `json:"contentType"`
	Description *string    `json:"description"`
	SortOrder   int        `json:"sortOrder"`
	Status      int        `json:"status"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"deletedAt,omitempty"`
}

// ContentCategoryDTO 内容分类数据传输对象
type ContentCategoryDTO struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Code        string  `json:"code"`
	Icon        *string `json:"icon"`
	ParentID    *string `json:"parentId"`
	ContentType string  `json:"contentType"`
	Description string  `json:"description"`
	SortOrder   int     `json:"sortOrder"`
	Status      int     `json:"status"`
}

// GetAllCategories 获取所有分类
//
// 返回所有未删除的分类列表
func (ContentCategory) GetAllCategories(db *sql.DB) ([]ContentCategoryDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, icon, parent_id, content_type, description, sort_order, status
		FROM %s
		WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("content_categories"))

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []ContentCategoryDTO
	for rows.Next() {
		var cat ContentCategoryDTO
		var icon, parentID, description sql.NullString
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Code, &icon, &parentID, &cat.ContentType, &description, &cat.SortOrder, &cat.Status)
		if err != nil {
			return nil, err
		}
		if icon.Valid {
			cat.Icon = &icon.String
		}
		if parentID.Valid {
			cat.ParentID = &parentID.String
		}
		if description.Valid {
			cat.Description = description.String
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

func (ContentCategory) CheckCodeExists(db *sql.DB, code string, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, config.GetTableName("content_categories")), code, excludeID).Scan(&count)
	} else {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND deleted_at IS NULL`, config.GetTableName("content_categories")), code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CreateCategory 创建分类
//
// 创建新的内容分类
func (ContentCategory) CreateCategory(db *sql.DB, name, code string, icon, parentID *string, contentType string, description *string, sortOrder, status int) (*ContentCategoryDTO, error) {
	exists, err := ContentCategory{}.CheckCodeExists(db, code, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCategoryCodeExists
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (name, code, icon, parent_id, content_type, description, sort_order, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, code, icon, parent_id, content_type, description, sort_order, status
	`, config.GetTableName("content_categories"))

	var cat ContentCategoryDTO
	var iconNull, parentIDNull, descriptionNull sql.NullString
	err = db.QueryRow(query, name, code, icon, parentID, contentType, description, sortOrder, status).Scan(
		&cat.ID, &cat.Name, &cat.Code, &iconNull, &parentIDNull, &cat.ContentType, &descriptionNull, &cat.SortOrder, &cat.Status,
	)
	if err != nil {
		return nil, err
	}

	if iconNull.Valid {
		cat.Icon = &iconNull.String
	}
	if parentIDNull.Valid {
		cat.ParentID = &parentIDNull.String
	}
	if descriptionNull.Valid {
		cat.Description = descriptionNull.String
	}

	return &cat, nil
}

// UpdateCategory 更新分类
//
// 更新指定分类的信息
func (ContentCategory) UpdateCategory(db *sql.DB, id, name string, icon *string, contentType string, description *string, sortOrder, status int) error {
	query := fmt.Sprintf(`
		UPDATE %s
		SET name = $1, icon = $2, content_type = $3, description = $4, sort_order = $5, status = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7 AND deleted_at IS NULL
	`, config.GetTableName("content_categories"))

	result, err := db.Exec(query, name, icon, contentType, description, sortOrder, status, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// DeleteCategory 删除分类
//
// 软删除指定分类
func (ContentCategory) DeleteCategory(db *sql.DB, id string) error {
	query := fmt.Sprintf(`
		UPDATE %s
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("content_categories"))

	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
