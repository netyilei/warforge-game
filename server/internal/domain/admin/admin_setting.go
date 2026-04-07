package admin

import "time"

type AdminSetting struct {
	key         string
	value       string
	description string
	createdAt   time.Time
	updatedAt   time.Time
}

func NewAdminSetting(key, value string) *AdminSetting {
	now := time.Now()
	return &AdminSetting{
		key:       key,
		value:     value,
		createdAt: now,
		updatedAt: now,
	}
}

func (s *AdminSetting) Key() string        { return s.key }
func (s *AdminSetting) Value() string      { return s.value }
func (s *AdminSetting) Description() string { return s.description }
func (s *AdminSetting) CreatedAt() time.Time { return s.createdAt }
func (s *AdminSetting) UpdatedAt() time.Time { return s.updatedAt }

func (s *AdminSetting) SetValue(value string) {
	s.value = value
	s.updatedAt = time.Now()
}

func (s *AdminSetting) SetDescription(desc string) {
	s.description = desc
}

type AdminSettingDTO struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (s *AdminSetting) ToDTO() *AdminSettingDTO {
	return &AdminSettingDTO{
		Key:         s.key,
		Value:       s.value,
		Description: s.description,
		CreatedAt:   s.createdAt,
		UpdatedAt:   s.updatedAt,
	}
}
