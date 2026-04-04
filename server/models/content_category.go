// Package models 提供数据模型定义
//
// 本文件定义内容分类相关的数据模型和数据库操作
package models

import (
	"database/sql"
	"time"
)

// ContentCategory 内容分类模型
type ContentCategory struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Code      string     `json:"code"`
	Icon      *string    `json:"icon"`
	ParentID  *string    `json:"parentId"`
	SortOrder int        `json:"sortOrder"`
	Status    int        `json:"status"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
}

// ContentCategoryDTO 内容分类数据传输对象
type ContentCategoryDTO struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Code      string  `json:"code"`
	Icon      *string `json:"icon"`
	ParentID  *string `json:"parentId"`
	SortOrder int     `json:"sortOrder"`
	Status    int     `json:"status"`
}

// GetAllCategories 获取所有分类
//
// 返回所有未删除的分类列表
func (ContentCategory) GetAllCategories(db *sql.DB) ([]ContentCategoryDTO, error) {
	query := `
		SELECT id, name, code, icon, parent_id, sort_order, status
		FROM content_categories
		WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []ContentCategoryDTO
	for rows.Next() {
		var cat ContentCategoryDTO
		var icon, parentID sql.NullString
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Code, &icon, &parentID, &cat.SortOrder, &cat.Status)
		if err != nil {
			return nil, err
		}
		if icon.Valid {
			cat.Icon = &icon.String
		}
		if parentID.Valid {
			cat.ParentID = &parentID.String
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

// CreateCategory 创建分类
//
// 创建新的内容分类
func (ContentCategory) CreateCategory(db *sql.DB, name, code string, icon, parentID *string, sortOrder int) (*ContentCategoryDTO, error) {
	query := `
		INSERT INTO content_categories (name, code, icon, parent_id, sort_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, code, icon, parent_id, sort_order, status
	`

	var cat ContentCategoryDTO
	var iconNull, parentIDNull sql.NullString
	err := db.QueryRow(query, name, code, icon, parentID, sortOrder).Scan(
		&cat.ID, &cat.Name, &cat.Code, &iconNull, &parentIDNull, &cat.SortOrder, &cat.Status,
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

	return &cat, nil
}

// UpdateCategory 更新分类
//
// 更新指定分类的信息
func (ContentCategory) UpdateCategory(db *sql.DB, id, name string, icon *string, sortOrder int) error {
	query := `
		UPDATE content_categories
		SET name = $1, icon = $2, sort_order = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND deleted_at IS NULL
	`

	result, err := db.Exec(query, name, icon, sortOrder, id)
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
	query := `
		UPDATE content_categories
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NULL
	`

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
