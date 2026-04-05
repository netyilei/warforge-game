package models

import (
	"database/sql"
	"errors"
	"time"
)

var (
	ErrBannerGroupNotFound     = errors.New("Banner分组不存在")
	ErrBannerGroupCodeExists   = errors.New("Banner分组标识已存在")
	ErrBannerNotFound          = errors.New("Banner不存在")
)

type BannerGroup struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Code        string     `json:"code"`
	Description *string    `json:"description"`
	Width       int        `json:"width"`
	Height      int        `json:"height"`
	Status      int        `json:"status"`
	SortOrder   int        `json:"sortOrder"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"deletedAt,omitempty"`
}

type BannerGroupDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Status      int    `json:"status"`
	SortOrder   int    `json:"sortOrder"`
}

func (BannerGroup) GetAllBannerGroups(db *sql.DB) ([]BannerGroupDTO, error) {
	query := `
		SELECT id, name, code, description, width, height, status, sort_order
		FROM wf_banner_groups
		WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []BannerGroupDTO
	for rows.Next() {
		var g BannerGroupDTO
		var description sql.NullString
		err := rows.Scan(&g.ID, &g.Name, &g.Code, &description, &g.Width, &g.Height, &g.Status, &g.SortOrder)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			g.Description = description.String
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (BannerGroup) GetByID(db *sql.DB, id string) (*BannerGroupDTO, error) {
	query := `
		SELECT id, name, code, description, width, height, status, sort_order
		FROM wf_banner_groups
		WHERE id = $1 AND deleted_at IS NULL
	`
	var g BannerGroupDTO
	var description sql.NullString
	err := db.QueryRow(query, id).Scan(&g.ID, &g.Name, &g.Code, &description, &g.Width, &g.Height, &g.Status, &g.SortOrder)
	if err != nil {
		return nil, err
	}
	if description.Valid {
		g.Description = description.String
	}
	return &g, nil
}

func (BannerGroup) CheckCodeExists(db *sql.DB, code string, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = db.QueryRow(`SELECT COUNT(*) FROM wf_banner_groups WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, code, excludeID).Scan(&count)
	} else {
		err = db.QueryRow(`SELECT COUNT(*) FROM wf_banner_groups WHERE code = $1 AND deleted_at IS NULL`, code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (BannerGroup) CreateBannerGroup(db *sql.DB, name, code string, description *string, width, height, status, sortOrder int) (*BannerGroupDTO, error) {
	exists, err := BannerGroup{}.CheckCodeExists(db, code, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrBannerGroupCodeExists
	}

	query := `
		INSERT INTO wf_banner_groups (name, code, description, width, height, status, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	var id string
	err = db.QueryRow(query, name, code, description, width, height, status, sortOrder).Scan(&id)
	if err != nil {
		return nil, err
	}

	return BannerGroup{}.GetByID(db, id)
}

func (BannerGroup) UpdateBannerGroup(db *sql.DB, id, name string, description *string, width, height, status, sortOrder int) error {
	query := `
		UPDATE wf_banner_groups
		SET name = $1, description = $2, width = $3, height = $4, status = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7 AND deleted_at IS NULL
	`
	result, err := db.Exec(query, name, description, width, height, status, sortOrder, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (BannerGroup) DeleteBannerGroup(db *sql.DB, id string) error {
	query := `UPDATE wf_banner_groups SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`
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
