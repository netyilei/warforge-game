package admin

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type AdminRoleStatus int

const (
	AdminRoleStatusActive   AdminRoleStatus = 1
	AdminRoleStatusInactive AdminRoleStatus = 0
)

type AdminRole struct {
	shared.BaseEntity
	name        string
	code        string
	description string
	status      AdminRoleStatus
	sortOrder   int
}

func NewAdminRole(id, name, code string) *AdminRole {
	return &AdminRole{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		status:     AdminRoleStatusActive,
	}
}

func (r *AdminRole) Name() string {
	return r.name
}

func (r *AdminRole) SetName(name string) {
	r.name = name
	r.Touch()
}

func (r *AdminRole) Code() string {
	return r.code
}

func (r *AdminRole) Description() string {
	return r.description
}

func (r *AdminRole) SetDescription(desc string) {
	r.description = desc
	r.Touch()
}

func (r *AdminRole) Status() AdminRoleStatus {
	return r.status
}

func (r *AdminRole) SetStatus(status AdminRoleStatus) {
	r.status = status
	r.Touch()
}

func (r *AdminRole) SortOrder() int {
	return r.sortOrder
}

func (r *AdminRole) SetSortOrder(order int) {
	r.sortOrder = order
	r.Touch()
}

func (r *AdminRole) IsActive() bool {
	return r.status == AdminRoleStatusActive
}

type AdminRoleDTO struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Code        string          `json:"code"`
	Description string          `json:"description"`
	Status      AdminRoleStatus `json:"status"`
	SortOrder   int             `json:"sortOrder"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

func (r *AdminRole) ToDTO() *AdminRoleDTO {
	return &AdminRoleDTO{
		ID:          r.ID(),
		Name:        r.name,
		Code:        r.code,
		Description: r.description,
		Status:      r.status,
		SortOrder:   r.sortOrder,
		CreatedAt:   r.CreatedAt(),
		UpdatedAt:   r.UpdatedAt(),
	}
}
