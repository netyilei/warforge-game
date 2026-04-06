package content

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type CategoryStatus int

const (
	CategoryStatusInactive CategoryStatus = 0
	CategoryStatusActive   CategoryStatus = 1
)

var (
	ErrCategoryNotFound   = shared.NewDomainError("category_not_found", "分类不存在")
	ErrCategoryCodeExists = shared.NewDomainError("category_code_exists", "分类标识已存在")
)

type ContentCategory struct {
	shared.BaseEntity
	name        string
	code        string
	icon        *string
	parentID    *string
	contentType string
	description *string
	sortOrder   int
	status      CategoryStatus
	deletedAt   *time.Time
}

func NewContentCategory(id, name, code string) *ContentCategory {
	return &ContentCategory{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		status:     CategoryStatusActive,
	}
}

func (c *ContentCategory) Name() string          { return c.name }
func (c *ContentCategory) Code() string          { return c.code }
func (c *ContentCategory) Icon() *string         { return c.icon }
func (c *ContentCategory) ParentID() *string     { return c.parentID }
func (c *ContentCategory) ContentType() string   { return c.contentType }
func (c *ContentCategory) Description() *string  { return c.description }
func (c *ContentCategory) SortOrder() int        { return c.sortOrder }
func (c *ContentCategory) Status() CategoryStatus { return c.status }
func (c *ContentCategory) DeletedAt() *time.Time { return c.deletedAt }

func (c *ContentCategory) SetName(name string) {
	c.name = name
	c.Touch()
}

func (c *ContentCategory) SetIcon(icon *string) {
	c.icon = icon
	c.Touch()
}

func (c *ContentCategory) SetParentID(id *string) {
	c.parentID = id
	c.Touch()
}

func (c *ContentCategory) SetContentType(contentType string) {
	c.contentType = contentType
	c.Touch()
}

func (c *ContentCategory) SetDescription(desc *string) {
	c.description = desc
	c.Touch()
}

func (c *ContentCategory) SetSortOrder(order int) {
	c.sortOrder = order
	c.Touch()
}

func (c *ContentCategory) SetStatus(status CategoryStatus) {
	c.status = status
	c.Touch()
}

func (c *ContentCategory) IsDeleted() bool {
	return c.deletedAt != nil
}

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

func (c *ContentCategory) ToDTO() *ContentCategoryDTO {
	return &ContentCategoryDTO{
		ID:          c.ID(),
		Name:        c.name,
		Code:        c.code,
		Icon:        c.icon,
		ParentID:    c.parentID,
		ContentType: c.contentType,
		Description: c.descriptionString(),
		SortOrder:   c.sortOrder,
		Status:      int(c.status),
	}
}

func (c *ContentCategory) descriptionString() string {
	if c.description != nil {
		return *c.description
	}
	return ""
}
