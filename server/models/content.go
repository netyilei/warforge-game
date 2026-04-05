package models

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"warforge-server/config"
)

var (
	ErrContentNotFound = errors.New("内容不存在")
)

type Content struct {
	ID         string     `json:"id"`
	CategoryID string     `json:"categoryId"`
	AuthorID   string     `json:"authorId"`
	CoverImage *string    `json:"coverImage"`
	IsMarquee  bool       `json:"isMarquee"`
	IsPopup    bool       `json:"isPopup"`
	StartTime  *time.Time `json:"startTime"`
	EndTime    *time.Time `json:"endTime"`
	SortOrder  int        `json:"sortOrder"`
	Status     int        `json:"status"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	DeletedAt  *time.Time `json:"deletedAt,omitempty"`
}

type ContentDTO struct {
	ID         string `json:"id"`
	CategoryID string `json:"categoryId"`
	AuthorID   string `json:"authorId"`
	CoverImage string `json:"coverImage"`
	IsMarquee  bool   `json:"isMarquee"`
	IsPopup    bool   `json:"isPopup"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
	SortOrder  int    `json:"sortOrder"`
	Status     int    `json:"status"`
}

type ContentTranslation struct {
	ID        string    `json:"id"`
	ContentID string    `json:"contentId"`
	Lang      string    `json:"lang"`
	Title     string    `json:"title"`
	Summary   string    `json:"summary"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ContentTranslationDTO struct {
	Lang    string `json:"lang"`
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Content string `json:"content"`
}

type ContentWithTranslation struct {
	ContentDTO
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Content string `json:"content"`
}

type ContentListRequest struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"pageSize"`
	CategoryID string `form:"categoryId"`
	Status     int    `form:"status"`
}

type ContentListResult struct {
	List  []ContentWithTranslations `json:"list"`
	Total int                       `json:"total"`
}

type ContentWithTranslations struct {
	ContentDTO
	Title        string                  `json:"title"`
	Summary      string                  `json:"summary"`
	Content      string                  `json:"content"`
	Translations []ContentTranslationDTO `json:"translations"`
}

func (Content) List(db *sql.DB, req ContentListRequest) (*ContentListResult, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	offset := (req.Page - 1) * req.PageSize

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE deleted_at IS NULL`, config.GetTableName("contents"))
	var args []interface{}
	argIndex := 1

	if req.CategoryID != "" {
		countQuery += fmt.Sprintf(` AND category_id = $%d`, argIndex)
		args = append(args, req.CategoryID)
		argIndex++
	}
	if req.Status > 0 {
		countQuery += fmt.Sprintf(` AND status = $%d`, argIndex)
		args = append(args, req.Status)
	}

	var total int
	err := db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`
		SELECT c.id, c.category_id, c.author_id, c.cover_image, c.is_marquee, c.is_popup,
		       c.start_time, c.end_time, c.sort_order, c.status,
		       COALESCE(t.title, '') as title, COALESCE(t.summary, '') as summary, COALESCE(t.content, '') as content
		FROM %s c
		LEFT JOIN %s t ON c.id = t.content_id AND t.lang = 'zh'
		WHERE c.deleted_at IS NULL
	`, config.GetTableName("contents"), config.GetTableName("content_translations"))
	queryArgs := []interface{}{}
	argIndex = 1

	if req.CategoryID != "" {
		query += fmt.Sprintf(` AND c.category_id = $%d`, argIndex)
		queryArgs = append(queryArgs, req.CategoryID)
		argIndex++
	}
	if req.Status > 0 {
		query += fmt.Sprintf(` AND c.status = $%d`, argIndex)
		queryArgs = append(queryArgs, req.Status)
		argIndex++
	}

	query += fmt.Sprintf(` ORDER BY c.sort_order ASC, c.created_at DESC LIMIT $%d OFFSET $%d`, argIndex, argIndex+1)
	queryArgs = append(queryArgs, req.PageSize, offset)

	rows, err := db.Query(query, queryArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ContentWithTranslations
	for rows.Next() {
		var item ContentWithTranslations
		var coverImage, startTime, endTime sql.NullString
		err := rows.Scan(
			&item.ID, &item.CategoryID, &item.AuthorID, &coverImage, &item.IsMarquee, &item.IsPopup,
			&startTime, &endTime, &item.SortOrder, &item.Status,
			&item.Title, &item.Summary, &item.Content,
		)
		if err != nil {
			return nil, err
		}
		if coverImage.Valid {
			item.CoverImage = coverImage.String
		}
		if startTime.Valid {
			item.StartTime = startTime.String
		}
		if endTime.Valid {
			item.EndTime = endTime.String
		}
		list = append(list, item)
	}

	return &ContentListResult{List: list, Total: total}, nil
}

func (Content) GetByID(db *sql.DB, id string) (*ContentWithTranslations, error) {
	query := fmt.Sprintf(`
		SELECT id, category_id, author_id, cover_image, is_marquee, is_popup,
		       start_time, end_time, sort_order, status
		FROM %s
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("contents"))
	var content ContentWithTranslations
	var coverImage, startTime, endTime sql.NullString
	err := db.QueryRow(query, id).Scan(
		&content.ID, &content.CategoryID, &content.AuthorID, &coverImage, &content.IsMarquee, &content.IsPopup,
		&startTime, &endTime, &content.SortOrder, &content.Status,
	)
	if err != nil {
		return nil, err
	}
	if coverImage.Valid {
		content.CoverImage = coverImage.String
	}
	if startTime.Valid {
		content.StartTime = startTime.String
	}
	if endTime.Valid {
		content.EndTime = endTime.String
	}

	translations, err := ContentTranslation{}.GetByContentID(db, id)
	if err != nil {
		return nil, err
	}
	content.Translations = translations

	return &content, nil
}

func (Content) Create(db *sql.DB, categoryID, authorID string, coverImage *string, isMarquee, isPopup bool, startTime, endTime *time.Time, sortOrder, status int, translations []ContentTranslationDTO) (*ContentWithTranslations, error) {
	query := fmt.Sprintf(`
		INSERT INTO %s (category_id, author_id, cover_image, is_marquee, is_popup, start_time, end_time, sort_order, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, config.GetTableName("contents"))
	var id string
	err := db.QueryRow(query, categoryID, authorID, coverImage, isMarquee, isPopup, startTime, endTime, sortOrder, status).Scan(&id)
	if err != nil {
		return nil, err
	}

	var c Content
	for _, t := range translations {
		c.SaveTranslation(db, id, t.Lang, t.Title, t.Summary, t.Content)
	}

	return c.GetByID(db, id)
}

func (Content) Update(db *sql.DB, id, categoryID string, coverImage *string, isMarquee, isPopup bool, startTime, endTime *time.Time, sortOrder, status int) error {
	query := fmt.Sprintf(`
		UPDATE %s
		SET category_id = $1, cover_image = $2, is_marquee = $3, is_popup = $4,
		    start_time = $5, end_time = $6, sort_order = $7, status = $8, updated_at = CURRENT_TIMESTAMP
		WHERE id = $9 AND deleted_at IS NULL
	`, config.GetTableName("contents"))
	result, err := db.Exec(query, categoryID, coverImage, isMarquee, isPopup, startTime, endTime, sortOrder, status, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (Content) Delete(db *sql.DB, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("contents"))
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

func (Content) UpdateTranslations(db *sql.DB, contentID string, translations []ContentTranslationDTO) error {
	var c Content
	for _, t := range translations {
		if err := c.SaveTranslation(db, contentID, t.Lang, t.Title, t.Summary, t.Content); err != nil {
			return err
		}
	}
	return nil
}

func (Content) SaveTranslation(db *sql.DB, contentID, lang, title, summary, content string) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (content_id, lang, title, summary, content)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (content_id, lang) DO UPDATE SET title = $3, summary = $4, content = $5, updated_at = CURRENT_TIMESTAMP
	`, config.GetTableName("content_translations"))
	_, err := db.Exec(query, contentID, lang, title, summary, content)
	return err
}

func (ContentTranslation) GetByContentID(db *sql.DB, contentID string) ([]ContentTranslationDTO, error) {
	query := fmt.Sprintf(`
		SELECT lang, title, summary, content
		FROM %s
		WHERE content_id = $1
	`, config.GetTableName("content_translations"))
	rows, err := db.Query(query, contentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var translations []ContentTranslationDTO
	for rows.Next() {
		var t ContentTranslationDTO
		var summary, content sql.NullString
		err := rows.Scan(&t.Lang, &t.Title, &summary, &content)
		if err != nil {
			return nil, err
		}
		if summary.Valid {
			t.Summary = summary.String
		}
		if content.Valid {
			t.Content = content.String
		}
		translations = append(translations, t)
	}
	return translations, nil
}
