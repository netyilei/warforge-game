package content

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"warforge-server/config"
	"warforge-server/internal/domain/content"
)

type BannerRepository struct {
	db *sql.DB
}

func NewBannerRepository(db *sql.DB) *BannerRepository {
	return &BannerRepository{db: db}
}

func (r *BannerRepository) FindByID(ctx context.Context, id string) (*content.Banner, error) {
	query := fmt.Sprintf(`
		SELECT id, group_id, image_url, link_url, link_target, is_external, extra_data,
		       start_time, end_time, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("banners"))

	return r.scanBannerRow(r.db.QueryRowContext(ctx, query, id))
}

func (r *BannerRepository) scanBannerRow(row *sql.Row) (*content.Banner, error) {
	var id, groupID, imageURL, linkTarget string
	var linkURL, startTime, endTime sql.NullString
	var extraData []byte
	var isExternal bool
	var sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := row.Scan(&id, &groupID, &imageURL, &linkURL, &linkTarget, &isExternal, &extraData,
		&startTime, &endTime, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	banner := content.NewBanner(id, groupID, imageURL)
	banner.SetLinkTarget(linkTarget)
	banner.SetIsExternal(isExternal)
	banner.SetSortOrder(sortOrder)
	banner.SetStatus(content.BannerStatus(status))

	if linkURL.Valid {
		banner.SetLinkURL(&linkURL.String)
	}
	if startTime.Valid {
		t := startTime.String
		parsed, _ := time.Parse(time.RFC3339, t)
		banner.SetStartTime(&parsed)
	}
	if endTime.Valid {
		t := endTime.String
		parsed, _ := time.Parse(time.RFC3339, t)
		banner.SetEndTime(&parsed)
	}
	if extraData != nil {
		var data content.BannerExtraData
		json.Unmarshal(extraData, &data)
		banner.SetExtraData(data)
	}

	return banner, nil
}

func (r *BannerRepository) FindByGroupID(ctx context.Context, groupID string) ([]*content.Banner, error) {
	query := fmt.Sprintf(`
		SELECT id, group_id, image_url, link_url, link_target, is_external, extra_data,
		       start_time, end_time, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE group_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("banners"))

	rows, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []*content.Banner
	for rows.Next() {
		var id, gID, imageURL, linkTarget string
		var linkURL, startTime, endTime sql.NullString
		var extraData []byte
		var isExternal bool
		var sortOrder, status int
		var createdAt, updatedAt time.Time
		var deletedAt sql.NullTime

		err := rows.Scan(&id, &gID, &imageURL, &linkURL, &linkTarget, &isExternal, &extraData,
			&startTime, &endTime, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
		if err != nil {
			return nil, err
		}

		banner := content.NewBanner(id, gID, imageURL)
		banner.SetLinkTarget(linkTarget)
		banner.SetIsExternal(isExternal)
		banner.SetSortOrder(sortOrder)
		banner.SetStatus(content.BannerStatus(status))

		if linkURL.Valid {
			banner.SetLinkURL(&linkURL.String)
		}
		if startTime.Valid {
			t := startTime.String
			parsed, _ := time.Parse(time.RFC3339, t)
			banner.SetStartTime(&parsed)
		}
		if endTime.Valid {
			t := endTime.String
			parsed, _ := time.Parse(time.RFC3339, t)
			banner.SetEndTime(&parsed)
		}
		if extraData != nil {
			var data content.BannerExtraData
			json.Unmarshal(extraData, &data)
			banner.SetExtraData(data)
		}

		banners = append(banners, banner)
	}

	return banners, nil
}

func (r *BannerRepository) ListAll(ctx context.Context) ([]*content.Banner, error) {
	query := fmt.Sprintf(`
		SELECT id, group_id, image_url, link_url, link_target, is_external, extra_data,
		       start_time, end_time, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("banners"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var banners []*content.Banner
	for rows.Next() {
		var id, groupID, imageURL, linkTarget string
		var linkURL, startTime, endTime sql.NullString
		var extraData []byte
		var isExternal bool
		var sortOrder, status int
		var createdAt, updatedAt time.Time
		var deletedAt sql.NullTime

		err := rows.Scan(&id, &groupID, &imageURL, &linkURL, &linkTarget, &isExternal, &extraData,
			&startTime, &endTime, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
		if err != nil {
			return nil, err
		}

		banner := content.NewBanner(id, groupID, imageURL)
		banner.SetLinkTarget(linkTarget)
		banner.SetIsExternal(isExternal)
		banner.SetSortOrder(sortOrder)
		banner.SetStatus(content.BannerStatus(status))

		if linkURL.Valid {
			banner.SetLinkURL(&linkURL.String)
		}
		if extraData != nil {
			var data content.BannerExtraData
			json.Unmarshal(extraData, &data)
			banner.SetExtraData(data)
		}

		banners = append(banners, banner)
	}

	return banners, nil
}

func (r *BannerRepository) Save(ctx context.Context, banner *content.Banner) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, group_id, image_url, link_url, link_target, is_external, extra_data,
		                start_time, end_time, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		ON CONFLICT (id) DO UPDATE SET
			image_url = $3, link_url = $4, link_target = $5, is_external = $6, extra_data = $7,
			start_time = $8, end_time = $9, sort_order = $10, status = $11, updated_at = $13
	`, config.GetTableName("banners"))

	var extraDataBytes []byte
	if banner.ExtraData() != nil {
		extraDataBytes, _ = json.Marshal(banner.ExtraData())
	}

	_, err := r.db.ExecContext(ctx, query,
		banner.ID(), banner.GroupID(), banner.ImageURL(), banner.LinkURL(), banner.LinkTarget(),
		banner.IsExternal(), extraDataBytes, banner.StartTime(), banner.EndTime(),
		banner.SortOrder(), int(banner.Status()), banner.CreatedAt(), banner.UpdatedAt())

	return err
}

func (r *BannerRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("banners"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *BannerRepository) FindTranslationsByBannerID(ctx context.Context, bannerID string) ([]*content.BannerTranslation, error) {
	query := fmt.Sprintf(`
		SELECT id, banner_id, lang, title, content, created_at, updated_at
		FROM %s WHERE banner_id = $1
	`, config.GetTableName("banner_translations"))

	rows, err := r.db.QueryContext(ctx, query, bannerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var translations []*content.BannerTranslation
	for rows.Next() {
		var id, bannerID, lang, title string
		var contentStr sql.NullString
		var createdAt, updatedAt time.Time

		err := rows.Scan(&id, &bannerID, &lang, &title, &contentStr, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}

		c := ""
		if contentStr.Valid {
			c = contentStr.String
		}
		translations = append(translations, content.NewBannerTranslation(id, bannerID, lang, title, c))
	}

	return translations, nil
}

func (r *BannerRepository) SaveTranslation(ctx context.Context, translation *content.BannerTranslation) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (banner_id, lang, title, content)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (banner_id, lang) DO UPDATE SET title = $3, content = $4, updated_at = CURRENT_TIMESTAMP
	`, config.GetTableName("banner_translations"))

	_, err := r.db.ExecContext(ctx, query, translation.BannerID(), translation.Lang(), translation.Title(), translation.Content())
	return err
}

type BannerGroupRepository struct {
	db *sql.DB
}

func NewBannerGroupRepository(db *sql.DB) *BannerGroupRepository {
	return &BannerGroupRepository{db: db}
}

func (r *BannerGroupRepository) FindByID(ctx context.Context, id string) (*content.BannerGroup, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, width, height, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("banner_groups"))

	var name, code string
	var description sql.NullString
	var width, height, sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(&id, &name, &code, &description, &width, &height, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	group := content.NewBannerGroup(id, name, code)
	group.SetSize(width, height)
	group.SetSortOrder(sortOrder)
	group.SetStatus(content.BannerGroupStatus(status))
	if description.Valid {
		group.SetDescription(&description.String)
	}

	return group, nil
}

func (r *BannerGroupRepository) FindByCode(ctx context.Context, code string) (*content.BannerGroup, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, width, height, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("banner_groups"))

	var id, name, c string
	var description sql.NullString
	var width, height, sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, code).Scan(&id, &name, &c, &description, &width, &height, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	group := content.NewBannerGroup(id, name, c)
	group.SetSize(width, height)
	group.SetSortOrder(sortOrder)
	group.SetStatus(content.BannerGroupStatus(status))
	if description.Valid {
		group.SetDescription(&description.String)
	}

	return group, nil
}

func (r *BannerGroupRepository) ListAll(ctx context.Context) ([]*content.BannerGroup, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, description, width, height, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("banner_groups"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []*content.BannerGroup
	for rows.Next() {
		var id, name, code string
		var description sql.NullString
		var width, height, sortOrder, status int
		var createdAt, updatedAt time.Time
		var deletedAt sql.NullTime

		err := rows.Scan(&id, &name, &code, &description, &width, &height, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
		if err != nil {
			return nil, err
		}

		group := content.NewBannerGroup(id, name, code)
		group.SetSize(width, height)
		group.SetSortOrder(sortOrder)
		group.SetStatus(content.BannerGroupStatus(status))
		if description.Valid {
			group.SetDescription(&description.String)
		}

		groups = append(groups, group)
	}

	return groups, nil
}

func (r *BannerGroupRepository) Save(ctx context.Context, group *content.BannerGroup) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, description, width, height, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, description = $4, width = $5, height = $6, sort_order = $7, status = $8, updated_at = $10
	`, config.GetTableName("banner_groups"))

	_, err := r.db.ExecContext(ctx, query,
		group.ID(), group.Name(), group.Code(), group.Description(),
		group.Width(), group.Height(), group.SortOrder(), int(group.Status()),
		group.CreatedAt(), group.UpdatedAt())

	return err
}

func (r *BannerGroupRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("banner_groups"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *BannerGroupRepository) CheckCodeExists(ctx context.Context, code, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, config.GetTableName("banner_groups")), code, excludeID).Scan(&count)
	} else {
		err = r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND deleted_at IS NULL`, config.GetTableName("banner_groups")), code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

type ContentRepository struct {
	db *sql.DB
}

func NewContentRepository(db *sql.DB) *ContentRepository {
	return &ContentRepository{db: db}
}

func (r *ContentRepository) FindByID(ctx context.Context, id string) (*content.Content, error) {
	query := fmt.Sprintf(`
		SELECT id, category_id, author_id, cover_image, is_marquee, is_popup,
		       start_time, end_time, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("contents"))

	var categoryID string
	var authorID sql.NullString
	var coverImage sql.NullString
	var isMarquee, isPopup bool
	var startTime, endTime sql.NullTime
	var sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(&id, &categoryID, &authorID, &coverImage, &isMarquee, &isPopup,
		&startTime, &endTime, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	c := content.NewContent(id, categoryID)
	c.SetMarquee(isMarquee)
	c.SetPopup(isPopup)
	c.SetSortOrder(sortOrder)
	c.SetStatus(content.ContentStatus(status))
	if authorID.Valid {
		c.SetAuthorID(authorID.String)
	}
	if coverImage.Valid {
		c.SetCoverImage(&coverImage.String)
	}
	if startTime.Valid {
		c.SetStartTime(&startTime.Time)
	}
	if endTime.Valid {
		c.SetEndTime(&endTime.Time)
	}

	return c, nil
}

func (r *ContentRepository) List(ctx context.Context, filter content.ContentFilter) (*content.ContentListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	offset := (filter.Page - 1) * filter.PageSize

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE deleted_at IS NULL`, config.GetTableName("contents"))
	var args []interface{}
	argIndex := 1

	if filter.CategoryID != "" {
		countQuery += fmt.Sprintf(` AND category_id = $%d`, argIndex)
		args = append(args, filter.CategoryID)
		argIndex++
	}
	if filter.Status > 0 {
		countQuery += fmt.Sprintf(` AND status = $%d`, argIndex)
		args = append(args, filter.Status)
	}

	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`
		SELECT id, category_id, author_id, cover_image, is_marquee, is_popup,
		       start_time, end_time, sort_order, status, created_at, updated_at
		FROM %s WHERE deleted_at IS NULL
	`, config.GetTableName("contents"))
	queryArgs := []interface{}{}
	argIndex = 1

	if filter.CategoryID != "" {
		query += fmt.Sprintf(` AND category_id = $%d`, argIndex)
		queryArgs = append(queryArgs, filter.CategoryID)
		argIndex++
	}
	if filter.Status > 0 {
		query += fmt.Sprintf(` AND status = $%d`, argIndex)
		queryArgs = append(queryArgs, filter.Status)
		argIndex++
	}

	query += fmt.Sprintf(` ORDER BY sort_order ASC, created_at DESC LIMIT $%d OFFSET $%d`, argIndex, argIndex+1)
	queryArgs = append(queryArgs, filter.PageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []content.ContentWithTranslations
	for rows.Next() {
		var id, categoryID string
		var authorID, coverImage sql.NullString
		var isMarquee, isPopup bool
		var startTime, endTime sql.NullTime
		var sortOrder, status int
		var createdAt, updatedAt time.Time

		err := rows.Scan(&id, &categoryID, &authorID, &coverImage, &isMarquee, &isPopup,
			&startTime, &endTime, &sortOrder, &status, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}

		dto := &content.ContentDTO{
			ID:         id,
			CategoryID: categoryID,
			IsMarquee:  isMarquee,
			IsPopup:    isPopup,
			SortOrder:  sortOrder,
			Status:     status,
		}
		if authorID.Valid {
			dto.AuthorID = authorID.String
		}
		if coverImage.Valid {
			dto.CoverImage = coverImage.String
		}
		if startTime.Valid {
			dto.StartTime = startTime.Time.Format(time.RFC3339)
		}
		if endTime.Valid {
			dto.EndTime = endTime.Time.Format(time.RFC3339)
		}

		items = append(items, content.ContentWithTranslations{
			ContentDTO: dto,
		})
	}

	return &content.ContentListResult{Items: items, Total: total}, nil
}

func (r *ContentRepository) Save(ctx context.Context, c *content.Content) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, category_id, author_id, cover_image, is_marquee, is_popup,
		                start_time, end_time, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			category_id = $2, author_id = $3, cover_image = $4, is_marquee = $5, is_popup = $6,
			start_time = $7, end_time = $8, sort_order = $9, status = $10, updated_at = $12
	`, config.GetTableName("contents"))

	_, err := r.db.ExecContext(ctx, query,
		c.ID(), c.CategoryID(), c.AuthorID(), c.CoverImage(), c.IsMarquee(), c.IsPopup(),
		c.StartTime(), c.EndTime(), c.SortOrder(), int(c.Status()), c.CreatedAt(), c.UpdatedAt())

	return err
}

func (r *ContentRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("contents"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *ContentRepository) FindTranslationsByContentID(ctx context.Context, contentID string) ([]*content.ContentTranslation, error) {
	query := fmt.Sprintf(`
		SELECT id, content_id, lang, title, summary, content, created_at, updated_at
		FROM %s WHERE content_id = $1
	`, config.GetTableName("content_translations"))

	rows, err := r.db.QueryContext(ctx, query, contentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var translations []*content.ContentTranslation
	for rows.Next() {
		var id, contentID, lang, title string
		var summary, contentStr sql.NullString
		var createdAt, updatedAt time.Time

		err := rows.Scan(&id, &contentID, &lang, &title, &summary, &contentStr, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}

		s := ""
		if summary.Valid {
			s = summary.String
		}
		c := ""
		if contentStr.Valid {
			c = contentStr.String
		}
		translations = append(translations, content.NewContentTranslation(id, contentID, lang, title, s, c))
	}

	return translations, nil
}

func (r *ContentRepository) SaveTranslation(ctx context.Context, t *content.ContentTranslation) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (content_id, lang, title, summary, content)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (content_id, lang) DO UPDATE SET title = $3, summary = $4, content = $5, updated_at = CURRENT_TIMESTAMP
	`, config.GetTableName("content_translations"))

	_, err := r.db.ExecContext(ctx, query, t.ContentID(), t.Lang(), t.Title(), t.Summary(), t.Content())
	return err
}

type ContentCategoryRepository struct {
	db *sql.DB
}

func NewContentCategoryRepository(db *sql.DB) *ContentCategoryRepository {
	return &ContentCategoryRepository{db: db}
}

func (r *ContentCategoryRepository) FindByID(ctx context.Context, id string) (*content.ContentCategory, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, icon, parent_id, content_type, description, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("content_categories"))

	var name, code string
	var icon, parentID, description sql.NullString
	var contentType sql.NullString
	var sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(&id, &name, &code, &icon, &parentID, &contentType, &description, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	cat := content.NewContentCategory(id, name, code)
	cat.SetSortOrder(sortOrder)
	cat.SetStatus(content.CategoryStatus(status))
	if icon.Valid {
		cat.SetIcon(&icon.String)
	}
	if parentID.Valid {
		cat.SetParentID(&parentID.String)
	}
	if contentType.Valid {
		cat.SetContentType(contentType.String)
	}
	if description.Valid {
		cat.SetDescription(&description.String)
	}

	return cat, nil
}

func (r *ContentCategoryRepository) FindByCode(ctx context.Context, code string) (*content.ContentCategory, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, icon, parent_id, content_type, description, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("content_categories"))

	var id, name, c string
	var icon, parentID, description sql.NullString
	var contentType sql.NullString
	var sortOrder, status int
	var createdAt, updatedAt time.Time
	var deletedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, code).Scan(&id, &name, &c, &icon, &parentID, &contentType, &description, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
	if err != nil {
		return nil, err
	}

	cat := content.NewContentCategory(id, name, c)
	cat.SetSortOrder(sortOrder)
	cat.SetStatus(content.CategoryStatus(status))
	if icon.Valid {
		cat.SetIcon(&icon.String)
	}
	if parentID.Valid {
		cat.SetParentID(&parentID.String)
	}
	if contentType.Valid {
		cat.SetContentType(contentType.String)
	}
	if description.Valid {
		cat.SetDescription(&description.String)
	}

	return cat, nil
}

func (r *ContentCategoryRepository) ListAll(ctx context.Context) ([]*content.ContentCategory, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, icon, parent_id, content_type, description, sort_order, status, created_at, updated_at, deleted_at
		FROM %s WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("content_categories"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*content.ContentCategory
	for rows.Next() {
		var id, name, code string
		var icon, parentID, description sql.NullString
		var contentType sql.NullString
		var sortOrder, status int
		var createdAt, updatedAt time.Time
		var deletedAt sql.NullTime

		err := rows.Scan(&id, &name, &code, &icon, &parentID, &contentType, &description, &sortOrder, &status, &createdAt, &updatedAt, &deletedAt)
		if err != nil {
			return nil, err
		}

		cat := content.NewContentCategory(id, name, code)
		cat.SetSortOrder(sortOrder)
		cat.SetStatus(content.CategoryStatus(status))
		if icon.Valid {
			cat.SetIcon(&icon.String)
		}
		if parentID.Valid {
			cat.SetParentID(&parentID.String)
		}
		if contentType.Valid {
			cat.SetContentType(contentType.String)
		}
		if description.Valid {
			cat.SetDescription(&description.String)
		}

		categories = append(categories, cat)
	}

	return categories, nil
}

func (r *ContentCategoryRepository) Save(ctx context.Context, cat *content.ContentCategory) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, icon, parent_id, content_type, description, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, icon = $4, parent_id = $5, content_type = $6, description = $7, sort_order = $8, status = $9, updated_at = $11
	`, config.GetTableName("content_categories"))

	_, err := r.db.ExecContext(ctx, query,
		cat.ID(), cat.Name(), cat.Code(), cat.Icon(), cat.ParentID(),
		cat.ContentType(), cat.Description(), cat.SortOrder(), int(cat.Status()),
		cat.CreatedAt(), cat.UpdatedAt())

	return err
}

func (r *ContentCategoryRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("content_categories"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *ContentCategoryRepository) CheckCodeExists(ctx context.Context, code, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, config.GetTableName("content_categories")), code, excludeID).Scan(&count)
	} else {
		err = r.db.QueryRowContext(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND deleted_at IS NULL`, config.GetTableName("content_categories")), code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
