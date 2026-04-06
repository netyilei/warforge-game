package admin

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type PermissionType string

const (
	PermissionTypeMenu   PermissionType = "menu"
	PermissionTypeButton PermissionType = "button"
	PermissionTypeAPI    PermissionType = "api"
)

type AdminPermissionStatus int

const (
	AdminPermissionStatusActive   AdminPermissionStatus = 1
	AdminPermissionStatusInactive AdminPermissionStatus = 0
)

type AdminPermission struct {
	shared.BaseEntity
	name       string
	code       string
	permType   PermissionType
	parentID   *string
	path       *string
	component  *string
	icon       *string
	href       *string
	showInMenu bool
	sortOrder  int
	status     AdminPermissionStatus
	apiPaths   string
}

func NewAdminPermission(id, name, code string, permType PermissionType) *AdminPermission {
	return &AdminPermission{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		permType:   permType,
		status:     AdminPermissionStatusActive,
		showInMenu: true,
	}
}

func (p *AdminPermission) Name() string {
	return p.name
}

func (p *AdminPermission) SetName(name string) {
	p.name = name
	p.Touch()
}

func (p *AdminPermission) Code() string {
	return p.code
}

func (p *AdminPermission) SetCode(code string) {
	p.code = code
	p.Touch()
}

func (p *AdminPermission) Type() PermissionType {
	return p.permType
}

func (p *AdminPermission) SetType(t PermissionType) {
	p.permType = t
	p.Touch()
}

func (p *AdminPermission) ParentID() *string {
	return p.parentID
}

func (p *AdminPermission) SetParentID(id *string) {
	p.parentID = id
	p.Touch()
}

func (p *AdminPermission) Path() *string {
	return p.path
}

func (p *AdminPermission) SetPath(path *string) {
	p.path = path
	p.Touch()
}

func (p *AdminPermission) Component() *string {
	return p.component
}

func (p *AdminPermission) SetComponent(c *string) {
	p.component = c
	p.Touch()
}

func (p *AdminPermission) Icon() *string {
	return p.icon
}

func (p *AdminPermission) SetIcon(icon *string) {
	p.icon = icon
	p.Touch()
}

func (p *AdminPermission) Href() *string {
	return p.href
}

func (p *AdminPermission) SetHref(href *string) {
	p.href = href
	p.Touch()
}

func (p *AdminPermission) ShowInMenu() bool {
	return p.showInMenu
}

func (p *AdminPermission) SetShowInMenu(show bool) {
	p.showInMenu = show
	p.Touch()
}

func (p *AdminPermission) SortOrder() int {
	return p.sortOrder
}

func (p *AdminPermission) SetSortOrder(order int) {
	p.sortOrder = order
	p.Touch()
}

func (p *AdminPermission) Status() AdminPermissionStatus {
	return p.status
}

func (p *AdminPermission) SetStatus(s AdminPermissionStatus) {
	p.status = s
	p.Touch()
}

func (p *AdminPermission) IsActive() bool {
	return p.status == AdminPermissionStatusActive
}

func (p *AdminPermission) APIPaths() string {
	return p.apiPaths
}

func (p *AdminPermission) SetAPIPaths(paths string) {
	p.apiPaths = paths
	p.Touch()
}

type AdminPermissionDTO struct {
	ID         string                `json:"id"`
	Name       string                `json:"name"`
	Code       string                `json:"code"`
	Type       PermissionType        `json:"type"`
	ParentID   string                `json:"parentId"`
	Path       string                `json:"path"`
	Component  string                `json:"component"`
	Icon       string                `json:"icon"`
	Href       string                `json:"href"`
	ShowInMenu bool                  `json:"showInMenu"`
	SortOrder  int                   `json:"sortOrder"`
	Status     AdminPermissionStatus `json:"status"`
	APIPaths   string                `json:"apiPaths"`
	CreatedAt  time.Time             `json:"createdAt"`
	UpdatedAt  time.Time             `json:"updatedAt"`
}

func (p *AdminPermission) ToDTO() *AdminPermissionDTO {
	dto := &AdminPermissionDTO{
		ID:         p.ID(),
		Name:       p.name,
		Code:       p.code,
		Type:       p.permType,
		ShowInMenu: p.showInMenu,
		SortOrder:  p.sortOrder,
		Status:     p.status,
		APIPaths:   p.apiPaths,
		CreatedAt:  p.CreatedAt(),
		UpdatedAt:  p.UpdatedAt(),
	}
	if p.parentID != nil {
		dto.ParentID = *p.parentID
	}
	if p.path != nil {
		dto.Path = *p.path
	}
	if p.component != nil {
		dto.Component = *p.component
	}
	if p.icon != nil {
		dto.Icon = *p.icon
	}
	if p.href != nil {
		dto.Href = *p.href
	}
	return dto
}

type MenuPermissionDTO struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Code      string         `json:"code"`
	Type      PermissionType `json:"type"`
	ParentID  string         `json:"parentId"`
	Path      string         `json:"path"`
	Component string         `json:"component"`
	Icon      string         `json:"icon"`
	Href      string         `json:"href"`
	SortOrder int            `json:"sortOrder"`
	Status    int            `json:"status"`
}

type MenuPermission struct {
	ID         string
	Name       string
	Code       string
	Type       PermissionType
	ParentID   *string
	Path       *string
	Component  *string
	Icon       *string
	Href       *string
	ShowInMenu bool
	SortOrder  int
}
