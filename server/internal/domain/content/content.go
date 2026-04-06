package content

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type ContentStatus int

const (
	ContentStatusInactive ContentStatus = 0
	ContentStatusActive   ContentStatus = 1
)

var (
	ErrContentNotFound = shared.NewDomainError("content_not_found", "内容不存在")
)

type Content struct {
	shared.BaseEntity
	categoryID string
	authorID   string
	coverImage *string
	isMarquee  bool
	isPopup    bool
	startTime  *time.Time
	endTime    *time.Time
	sortOrder  int
	status     ContentStatus
	deletedAt  *time.Time
}

func NewContent(id, categoryID string) *Content {
	return &Content{
		BaseEntity: shared.NewBaseEntity(id),
		categoryID: categoryID,
		status:     ContentStatusActive,
	}
}

func (c *Content) CategoryID() string      { return c.categoryID }
func (c *Content) AuthorID() string        { return c.authorID }
func (c *Content) CoverImage() *string     { return c.coverImage }
func (c *Content) IsMarquee() bool         { return c.isMarquee }
func (c *Content) IsPopup() bool           { return c.isPopup }
func (c *Content) StartTime() *time.Time   { return c.startTime }
func (c *Content) EndTime() *time.Time     { return c.endTime }
func (c *Content) SortOrder() int          { return c.sortOrder }
func (c *Content) Status() ContentStatus   { return c.status }
func (c *Content) DeletedAt() *time.Time   { return c.deletedAt }

func (c *Content) SetCategoryID(id string) {
	c.categoryID = id
	c.Touch()
}

func (c *Content) SetAuthorID(id string) {
	c.authorID = id
	c.Touch()
}

func (c *Content) SetCoverImage(img *string) {
	c.coverImage = img
	c.Touch()
}

func (c *Content) SetMarquee(isMarquee bool) {
	c.isMarquee = isMarquee
	c.Touch()
}

func (c *Content) SetPopup(isPopup bool) {
	c.isPopup = isPopup
	c.Touch()
}

func (c *Content) SetStartTime(t *time.Time) {
	c.startTime = t
	c.Touch()
}

func (c *Content) SetEndTime(t *time.Time) {
	c.endTime = t
	c.Touch()
}

func (c *Content) SetSortOrder(order int) {
	c.sortOrder = order
	c.Touch()
}

func (c *Content) SetStatus(status ContentStatus) {
	c.status = status
	c.Touch()
}

func (c *Content) IsDeleted() bool {
	return c.deletedAt != nil
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

func (c *Content) ToDTO() *ContentDTO {
	dto := &ContentDTO{
		ID:         c.ID(),
		CategoryID: c.categoryID,
		AuthorID:   c.authorID,
		IsMarquee:  c.isMarquee,
		IsPopup:    c.isPopup,
		SortOrder:  c.sortOrder,
		Status:     int(c.status),
	}
	if c.coverImage != nil {
		dto.CoverImage = *c.coverImage
	}
	if c.startTime != nil {
		dto.StartTime = c.startTime.Format(time.RFC3339)
	}
	if c.endTime != nil {
		dto.EndTime = c.endTime.Format(time.RFC3339)
	}
	return dto
}

type ContentTranslation struct {
	id        string
	contentID string
	lang      string
	title     string
	summary   string
	content   string
}

func NewContentTranslation(id, contentID, lang, title, summary, content string) *ContentTranslation {
	return &ContentTranslation{
		id:        id,
		contentID: contentID,
		lang:      lang,
		title:     title,
		summary:   summary,
		content:   content,
	}
}

func (t *ContentTranslation) ID() string        { return t.id }
func (t *ContentTranslation) ContentID() string { return t.contentID }
func (t *ContentTranslation) Lang() string      { return t.lang }
func (t *ContentTranslation) Title() string     { return t.title }
func (t *ContentTranslation) Summary() string   { return t.summary }
func (t *ContentTranslation) Content() string   { return t.content }

type ContentTranslationDTO struct {
	Lang    string `json:"lang"`
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Content string `json:"content"`
}

func (t *ContentTranslation) ToDTO() *ContentTranslationDTO {
	return &ContentTranslationDTO{
		Lang:    t.lang,
		Title:   t.title,
		Summary: t.summary,
		Content: t.content,
	}
}

type ContentWithTranslations struct {
	*ContentDTO
	Title        string                  `json:"title"`
	Summary      string                  `json:"summary"`
	Content      string                  `json:"content"`
	Translations []ContentTranslationDTO `json:"translations"`
}

type ContentFilter struct {
	Page       int
	PageSize   int
	CategoryID string
	Status     int
}

type ContentListResult struct {
	Items []ContentWithTranslations
	Total int
}
