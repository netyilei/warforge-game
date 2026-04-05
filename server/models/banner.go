package models

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"time"
)

type BannerExtraData map[string]interface{}

func (e BannerExtraData) Value() (driver.Value, error) {
	if e == nil {
		return nil, nil
	}
	return json.Marshal(e)
}

func (e *BannerExtraData) Scan(value interface{}) error {
	if value == nil {
		*e = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, e)
}

type Banner struct {
	ID         string          `json:"id"`
	GroupID    string          `json:"groupId"`
	ImageURL   string          `json:"imageUrl"`
	LinkURL    *string         `json:"linkUrl"`
	LinkTarget string          `json:"linkTarget"`
	IsExternal bool            `json:"isExternal"`
	ExtraData  BannerExtraData `json:"extraData"`
	StartTime  *time.Time      `json:"startTime"`
	EndTime    *time.Time      `json:"endTime"`
	SortOrder  int             `json:"sortOrder"`
	Status     int             `json:"status"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
	DeletedAt  *time.Time      `json:"deletedAt,omitempty"`
}

type BannerDTO struct {
	ID         string          `json:"id"`
	GroupID    string          `json:"groupId"`
	ImageURL   string          `json:"imageUrl"`
	LinkURL    string          `json:"linkUrl"`
	LinkTarget string          `json:"linkTarget"`
	IsExternal bool            `json:"isExternal"`
	ExtraData  BannerExtraData `json:"extraData"`
	StartTime  string          `json:"startTime"`
	EndTime    string          `json:"endTime"`
	SortOrder  int             `json:"sortOrder"`
	Status     int             `json:"status"`
}

type BannerTranslation struct {
	ID        string    `json:"id"`
	BannerID  string    `json:"bannerId"`
	Lang      string    `json:"lang"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type BannerTranslationDTO struct {
	Lang    string `json:"lang"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (Banner) GetBannersByGroupID(db *sql.DB, groupID string) ([]BannerDTO, error) {
	query := `
		SELECT id, group_id, image_url, link_url, link_target, is_external, extra_data, 
		       start_time, end_time, sort_order, status
		FROM wf_banners
		WHERE group_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`
	rows, err := db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []BannerDTO
	for rows.Next() {
		var b BannerDTO
		var linkURL, startTime, endTime sql.NullString
		var extraData []byte
		err := rows.Scan(
			&b.ID, &b.GroupID, &b.ImageURL, &linkURL, &b.LinkTarget, &b.IsExternal, &extraData,
			&startTime, &endTime, &b.SortOrder, &b.Status,
		)
		if err != nil {
			return nil, err
		}
		if linkURL.Valid {
			b.LinkURL = linkURL.String
		}
		if startTime.Valid {
			b.StartTime = startTime.String
		}
		if endTime.Valid {
			b.EndTime = endTime.String
		}
		if extraData != nil {
			json.Unmarshal(extraData, &b.ExtraData)
		}
		banners = append(banners, b)
	}
	return banners, nil
}

func (Banner) GetByID(db *sql.DB, id string) (*BannerDTO, error) {
	query := `
		SELECT id, group_id, image_url, link_url, link_target, is_external, extra_data, 
		       start_time, end_time, sort_order, status
		FROM wf_banners
		WHERE id = $1 AND deleted_at IS NULL
	`
	var b BannerDTO
	var linkURL, startTime, endTime sql.NullString
	var extraData []byte
	err := db.QueryRow(query, id).Scan(
		&b.ID, &b.GroupID, &b.ImageURL, &linkURL, &b.LinkTarget, &b.IsExternal, &extraData,
		&startTime, &endTime, &b.SortOrder, &b.Status,
	)
	if err != nil {
		return nil, err
	}
	if linkURL.Valid {
		b.LinkURL = linkURL.String
	}
	if startTime.Valid {
		b.StartTime = startTime.String
	}
	if endTime.Valid {
		b.EndTime = endTime.String
	}
	if extraData != nil {
		json.Unmarshal(extraData, &b.ExtraData)
	}
	return &b, nil
}

func (Banner) Create(db *sql.DB, groupID, imageURL string, linkURL, linkTarget *string, isExternal bool, extraData BannerExtraData, startTime, endTime *time.Time, status, sortOrder int) (*BannerDTO, error) {
	query := `
		INSERT INTO wf_banners (group_id, image_url, link_url, link_target, is_external, extra_data, start_time, end_time, status, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`
	var id string
	var extraDataBytes []byte
	if extraData != nil {
		extraDataBytes, _ = json.Marshal(extraData)
	}
	var linkURLVal interface{}
	if linkURL != nil {
		linkURLVal = *linkURL
	}
	var linkTargetVal string = "_blank"
	if linkTarget != nil {
		linkTargetVal = *linkTarget
	}
	err := db.QueryRow(query, groupID, imageURL, linkURLVal, linkTargetVal, isExternal, extraDataBytes, startTime, endTime, status, sortOrder).Scan(&id)
	if err != nil {
		return nil, err
	}
	return Banner{}.GetByID(db, id)
}

func (Banner) Update(db *sql.DB, id, imageURL string, linkURL, linkTarget *string, isExternal bool, extraData BannerExtraData, startTime, endTime *time.Time, status, sortOrder int) error {
	query := `
		UPDATE wf_banners
		SET image_url = $1, link_url = $2, link_target = $3, is_external = $4, extra_data = $5,
		    start_time = $6, end_time = $7, status = $8, sort_order = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $10 AND deleted_at IS NULL
	`
	var extraDataBytes []byte
	if extraData != nil {
		extraDataBytes, _ = json.Marshal(extraData)
	}
	var linkURLVal interface{}
	if linkURL != nil {
		linkURLVal = *linkURL
	}
	var linkTargetVal string = "_blank"
	if linkTarget != nil {
		linkTargetVal = *linkTarget
	}
	result, err := db.Exec(query, imageURL, linkURLVal, linkTargetVal, isExternal, extraDataBytes, startTime, endTime, status, sortOrder, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (Banner) DeleteBanner(db *sql.DB, id string) error {
	query := `UPDATE wf_banners SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`
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

func (BannerTranslation) GetByBannerID(db *sql.DB, bannerID string) ([]BannerTranslation, error) {
	query := `
		SELECT id, banner_id, lang, title, content, created_at, updated_at
		FROM wf_banner_translations
		WHERE banner_id = $1
	`
	rows, err := db.Query(query, bannerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var translations []BannerTranslation
	for rows.Next() {
		var t BannerTranslation
		var content sql.NullString
		err := rows.Scan(&t.ID, &t.BannerID, &t.Lang, &t.Title, &content, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if content.Valid {
			t.Content = content.String
		}
		translations = append(translations, t)
	}
	return translations, nil
}

func (Banner) CreateBanner(db *sql.DB, groupID, imageURL string, linkURL *string, linkTarget string, isExternal bool, extraData BannerExtraData, startTime, endTime *time.Time, status, sortOrder int, translations []BannerTranslationDTO) (*BannerDTO, error) {
	var b Banner
	banner, err := b.Create(db, groupID, imageURL, linkURL, &linkTarget, isExternal, extraData, startTime, endTime, status, sortOrder)
	if err != nil {
		return nil, err
	}

	for _, t := range translations {
		b.SaveTranslation(db, banner.ID, t.Lang, t.Title, t.Content)
	}

	return banner, nil
}

func (Banner) UpdateBanner(db *sql.DB, id, imageURL string, linkURL *string, linkTarget string, isExternal bool, extraData BannerExtraData, startTime, endTime *time.Time, status, sortOrder int) error {
	var b Banner
	return b.Update(db, id, imageURL, linkURL, &linkTarget, isExternal, extraData, startTime, endTime, status, sortOrder)
}

func (Banner) UpdateBannerTranslations(db *sql.DB, bannerID string, translations []BannerTranslationDTO) error {
	var b Banner
	for _, t := range translations {
		if err := b.SaveTranslation(db, bannerID, t.Lang, t.Title, t.Content); err != nil {
			return err
		}
	}
	return nil
}

func (Banner) SaveTranslation(db *sql.DB, bannerID, lang, title, content string) error {
	query := `
		INSERT INTO wf_banner_translations (banner_id, lang, title, content)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (banner_id, lang) DO UPDATE SET title = $3, content = $4, updated_at = CURRENT_TIMESTAMP
	`
	_, err := db.Exec(query, bannerID, lang, title, content)
	return err
}
