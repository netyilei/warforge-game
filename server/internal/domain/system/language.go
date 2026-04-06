package system

import (
	"warforge-server/internal/domain/shared"
)

type LanguageStatus int

const (
	LanguageStatusInactive LanguageStatus = 0
	LanguageStatusActive   LanguageStatus = 1
)

var (
	ErrLanguageNotFound   = shared.NewDomainError("language_not_found", "语言不存在")
	ErrLanguageCodeExists = shared.NewDomainError("language_code_exists", "语言标识已存在")
)

type Language struct {
	shared.BaseEntity
	code       string
	name       string
	nativeName string
	icon       *string
	status     LanguageStatus
	isDefault  bool
	sortOrder  int
}

func NewLanguage(id, code, name string) *Language {
	return &Language{
		BaseEntity: shared.NewBaseEntity(id),
		code:       code,
		name:       name,
		status:     LanguageStatusActive,
	}
}

func (l *Language) Code() string           { return l.code }
func (l *Language) Name() string           { return l.name }
func (l *Language) NativeName() string     { return l.nativeName }
func (l *Language) Icon() *string          { return l.icon }
func (l *Language) Status() LanguageStatus { return l.status }
func (l *Language) IsDefault() bool        { return l.isDefault }
func (l *Language) SortOrder() int         { return l.sortOrder }

func (l *Language) SetName(name string)             { l.name = name; l.Touch() }
func (l *Language) SetNativeName(name string)       { l.nativeName = name; l.Touch() }
func (l *Language) SetIcon(icon *string)            { l.icon = icon; l.Touch() }
func (l *Language) SetStatus(status LanguageStatus) { l.status = status; l.Touch() }
func (l *Language) SetDefault(isDefault bool)       { l.isDefault = isDefault; l.Touch() }
func (l *Language) SetSortOrder(order int)          { l.sortOrder = order; l.Touch() }

type LanguageDTO struct {
	ID         string  `json:"id"`
	Code       string  `json:"code"`
	Name       string  `json:"name"`
	NativeName string  `json:"nativeName"`
	Icon       *string `json:"icon"`
	Status     int     `json:"status"`
	IsDefault  bool    `json:"isDefault"`
	SortOrder  int     `json:"sortOrder"`
}

func (l *Language) ToDTO() *LanguageDTO {
	return &LanguageDTO{
		ID:         l.ID(),
		Code:       l.code,
		Name:       l.name,
		NativeName: l.nativeName,
		Icon:       l.icon,
		Status:     int(l.status),
		IsDefault:  l.isDefault,
		SortOrder:  l.sortOrder,
	}
}
