package admin

import "warforge-server/internal/domain/shared"

var (
	ErrAdminSettingNotFound = shared.NewDomainError("admin_setting_not_found", "管理后台设置不存在")
)

type AdminSetting struct {
	key         string
	value       string
	description string
}

func NewAdminSetting(key, value string) *AdminSetting {
	return &AdminSetting{
		key:   key,
		value: value,
	}
}

func (s *AdminSetting) Key() string         { return s.key }
func (s *AdminSetting) Value() string       { return s.value }
func (s *AdminSetting) Description() string { return s.description }

func (s *AdminSetting) SetValue(value string)             { s.value = value }
func (s *AdminSetting) SetDescription(description string) { s.description = description }

type AdminSettingDTO struct {
	Key         string `json:"key"`
	Value       string `json:"value"`
	Description string `json:"description"`
}

func (s *AdminSetting) ToDTO() *AdminSettingDTO {
	return &AdminSettingDTO{
		Key:         s.key,
		Value:       s.value,
		Description: s.description,
	}
}
