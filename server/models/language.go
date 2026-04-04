// Package models 提供数据模型定义
//
// 本文件定义语言管理相关的数据模型
package models

import (
	"database/sql"
	"time"
)

// Language 语言模型
type Language struct {
	ID         string    `json:"id"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	NativeName string    `json:"nativeName"`
	Icon       *string   `json:"icon"`
	Status     int       `json:"status"`
	IsDefault  bool      `json:"isDefault"`
	SortOrder  int       `json:"sortOrder"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// List 获取所有语言
func (Language) List(db *sql.DB) ([]Language, error) {
	query := `
		SELECT id, code, name, native_name, icon, status, is_default, sort_order, created_at, updated_at
		FROM languages
		ORDER BY sort_order
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var languages []Language
	for rows.Next() {
		var lang Language
		var icon sql.NullString
		err := rows.Scan(
			&lang.ID, &lang.Code, &lang.Name, &lang.NativeName, &icon,
			&lang.Status, &lang.IsDefault, &lang.SortOrder,
			&lang.CreatedAt, &lang.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		if icon.Valid {
			lang.Icon = &icon.String
		}
		languages = append(languages, lang)
	}
	return languages, nil
}

// Create 创建语言
func (l *Language) Create(db *sql.DB) error {
	query := `
		INSERT INTO languages (code, name, native_name, icon, status, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	return db.QueryRow(query, l.Code, l.Name, l.NativeName, l.Icon, l.Status, l.IsDefault, l.SortOrder).Scan(
		&l.ID, &l.CreatedAt, &l.UpdatedAt,
	)
}

// Update 更新语言
func (l *Language) Update(db *sql.DB) error {
	query := `
		UPDATE languages
		SET name = $1, native_name = $2, icon = $3, status = $4, is_default = $5, sort_order = $6, updated_at = NOW()
		WHERE id = $7
	`
	_, err := db.Exec(query, l.Name, l.NativeName, l.Icon, l.Status, l.IsDefault, l.SortOrder, l.ID)
	return err
}

// Delete 删除语言
func (l *Language) Delete(db *sql.DB) error {
	query := `DELETE FROM languages WHERE id = $1`
	_, err := db.Exec(query, l.ID)
	return err
}

// SetDefault 设置默认语言
func (Language) SetDefault(db *sql.DB, id string) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`UPDATE languages SET is_default = FALSE`)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`UPDATE languages SET is_default = TRUE WHERE id = $1`, id)
	if err != nil {
		return err
	}

	return tx.Commit()
}
