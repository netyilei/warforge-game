package system

import (
	"warforge-server/internal/domain/shared"
)

var (
	ErrSystemConfigKeyExists = shared.NewDomainError("system_config_key_exists", "系统配置键已存在")
)

type SystemConfig struct {
	key         string
	value       JSONB
	description string
}

func NewSystemConfig(key string, value JSONB) *SystemConfig {
	return &SystemConfig{
		key:   key,
		value: value,
	}
}

func (c *SystemConfig) Key() string         { return c.key }
func (c *SystemConfig) Value() JSONB        { return c.value }
func (c *SystemConfig) Description() string { return c.description }

func (c *SystemConfig) SetValue(value JSONB)             { c.value = value }
func (c *SystemConfig) SetDescription(description string) { c.description = description }

type SystemConfigDTO struct {
	Key         string `json:"key"`
	Value       JSONB  `json:"value"`
	Description string `json:"description"`
}

func (c *SystemConfig) ToDTO() *SystemConfigDTO {
	return &SystemConfigDTO{
		Key:         c.key,
		Value:       c.value,
		Description: c.description,
	}
}
