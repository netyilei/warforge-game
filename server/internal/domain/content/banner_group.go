package content

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type BannerGroupStatus int

const (
	BannerGroupStatusInactive BannerGroupStatus = 0
	BannerGroupStatusActive   BannerGroupStatus = 1
)

var (
	ErrBannerGroupNotFound   = shared.NewDomainError("banner_group_not_found", "Banner分组不存在")
	ErrBannerGroupCodeExists = shared.NewDomainError("banner_group_code_exists", "Banner分组标识已存在")
)

type BannerGroup struct {
	shared.BaseEntity
	name        string
	code        string
	description *string
	width       int
	height      int
	sortOrder   int
	status      BannerGroupStatus
	deletedAt   *time.Time
}

func NewBannerGroup(id, name, code string) *BannerGroup {
	return &BannerGroup{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		status:     BannerGroupStatusActive,
	}
}

func (g *BannerGroup) Name() string              { return g.name }
func (g *BannerGroup) Code() string              { return g.code }
func (g *BannerGroup) Description() *string      { return g.description }
func (g *BannerGroup) Width() int                { return g.width }
func (g *BannerGroup) Height() int               { return g.height }
func (g *BannerGroup) SortOrder() int            { return g.sortOrder }
func (g *BannerGroup) Status() BannerGroupStatus { return g.status }
func (g *BannerGroup) DeletedAt() *time.Time     { return g.deletedAt }

func (g *BannerGroup) SetName(name string) {
	g.name = name
	g.Touch()
}

func (g *BannerGroup) SetDescription(desc *string) {
	g.description = desc
	g.Touch()
}

func (g *BannerGroup) SetSize(width, height int) {
	g.width = width
	g.height = height
	g.Touch()
}

func (g *BannerGroup) SetSortOrder(order int) {
	g.sortOrder = order
	g.Touch()
}

func (g *BannerGroup) SetStatus(status BannerGroupStatus) {
	g.status = status
	g.Touch()
}

func (g *BannerGroup) IsDeleted() bool {
	return g.deletedAt != nil
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

func (g *BannerGroup) ToDTO() *BannerGroupDTO {
	dto := &BannerGroupDTO{
		ID:        g.ID(),
		Name:      g.name,
		Code:      g.code,
		Width:     g.width,
		Height:    g.height,
		Status:    int(g.status),
		SortOrder: g.sortOrder,
	}
	if g.description != nil {
		dto.Description = *g.description
	}
	return dto
}
