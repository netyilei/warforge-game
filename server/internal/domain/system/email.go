package system

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"warforge-server/internal/domain/shared"
)

type EmailProtocol string

const (
	EmailProtocolSMTP     EmailProtocol = "smtp"
	EmailProtocolSMTPS    EmailProtocol = "smtps"
	EmailProtocolSTARTTLS EmailProtocol = "starttls"
)

type EmailEncryption string

const (
	EmailEncryptionTLS  EmailEncryption = "tls"
	EmailEncryptionSSL  EmailEncryption = "ssl"
	EmailEncryptionNone EmailEncryption = "none"
)

var (
	ErrEmailConfigNotFound     = shared.NewDomainError("email_config_not_found", "邮箱配置不存在")
	ErrEmailConfigCodeExists   = shared.NewDomainError("email_config_code_exists", "邮箱配置标识已存在")
	ErrEmailTemplateNotFound   = shared.NewDomainError("email_template_not_found", "邮件模板不存在")
	ErrEmailTemplateCodeExists = shared.NewDomainError("email_template_code_exists", "邮件模板标识已存在")
)

type EmailConfig struct {
	shared.BaseEntity
	name       string
	code       string
	protocol   EmailProtocol
	encryption EmailEncryption
	host       string
	port       int
	username   string
	password   string
	fromName   string
	fromEmail  string
	isDefault  bool
	status     EmailConfigStatus
	sortOrder  int
	deletedAt  *time.Time
}

type EmailConfigStatus int

const (
	EmailConfigStatusInactive EmailConfigStatus = 0
	EmailConfigStatusActive   EmailConfigStatus = 1
)

func NewEmailConfig(id, name, code string, protocol EmailProtocol, host string, port int) *EmailConfig {
	return &EmailConfig{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		protocol:   protocol,
		host:       host,
		port:       port,
		status:     EmailConfigStatusActive,
	}
}

func (c *EmailConfig) Name() string               { return c.name }
func (c *EmailConfig) Code() string               { return c.code }
func (c *EmailConfig) Protocol() EmailProtocol    { return c.protocol }
func (c *EmailConfig) Encryption() EmailEncryption { return c.encryption }
func (c *EmailConfig) Host() string               { return c.host }
func (c *EmailConfig) Port() int                  { return c.port }
func (c *EmailConfig) Username() string           { return c.username }
func (c *EmailConfig) Password() string           { return c.password }
func (c *EmailConfig) FromName() string           { return c.fromName }
func (c *EmailConfig) FromEmail() string          { return c.fromEmail }
func (c *EmailConfig) IsDefault() bool            { return c.isDefault }
func (c *EmailConfig) Status() EmailConfigStatus  { return c.status }
func (c *EmailConfig) SortOrder() int             { return c.sortOrder }
func (c *EmailConfig) DeletedAt() *time.Time      { return c.deletedAt }

func (c *EmailConfig) SetName(name string)                { c.name = name; c.Touch() }
func (c *EmailConfig) SetProtocol(p EmailProtocol)        { c.protocol = p; c.Touch() }
func (c *EmailConfig) SetEncryption(e EmailEncryption)    { c.encryption = e; c.Touch() }
func (c *EmailConfig) SetHost(host string)                { c.host = host; c.Touch() }
func (c *EmailConfig) SetPort(port int)                   { c.port = port; c.Touch() }
func (c *EmailConfig) SetUsername(username string)        { c.username = username; c.Touch() }
func (c *EmailConfig) SetPassword(password string)        { c.password = password; c.Touch() }
func (c *EmailConfig) SetFromName(name string)            { c.fromName = name; c.Touch() }
func (c *EmailConfig) SetFromEmail(email string)          { c.fromEmail = email; c.Touch() }
func (c *EmailConfig) SetDefault(isDefault bool)          { c.isDefault = isDefault; c.Touch() }
func (c *EmailConfig) SetStatus(status EmailConfigStatus) { c.status = status; c.Touch() }
func (c *EmailConfig) SetSortOrder(order int)             { c.sortOrder = order; c.Touch() }

type EmailConfigDTO struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Code       string `json:"code"`
	Protocol   string `json:"protocol"`
	Encryption string `json:"encryption"`
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Username   string `json:"username"`
	Password   string `json:"password,omitempty"`
	FromName   string `json:"fromName"`
	FromEmail  string `json:"fromEmail"`
	IsDefault  bool   `json:"isDefault"`
	Status     int    `json:"status"`
	SortOrder  int    `json:"sortOrder"`
}

func (c *EmailConfig) ToDTO() *EmailConfigDTO {
	return &EmailConfigDTO{
		ID:         c.ID(),
		Name:       c.name,
		Code:       c.code,
		Protocol:   string(c.protocol),
		Encryption: string(c.encryption),
		Host:       c.host,
		Port:       c.port,
		Username:   c.username,
		Password:   c.password,
		FromName:   c.fromName,
		FromEmail:  c.fromEmail,
		IsDefault:  c.isDefault,
		Status:     int(c.status),
		SortOrder:  c.sortOrder,
	}
}

type EmailTemplate struct {
	shared.BaseEntity
	name        string
	code        string
	subject     string
	contentType string
	content     string
	description string
	variables   JSONB
	status      EmailTemplateStatus
	deletedAt   *time.Time
}

type EmailTemplateStatus int

const (
	EmailTemplateStatusInactive EmailTemplateStatus = 0
	EmailTemplateStatusActive   EmailTemplateStatus = 1
)

func NewEmailTemplate(id, name, code, subject string) *EmailTemplate {
	return &EmailTemplate{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		code:       code,
		subject:    subject,
		status:     EmailTemplateStatusActive,
	}
}

func (t *EmailTemplate) Name() string              { return t.name }
func (t *EmailTemplate) Code() string              { return t.code }
func (t *EmailTemplate) Subject() string           { return t.subject }
func (t *EmailTemplate) ContentType() string       { return t.contentType }
func (t *EmailTemplate) Content() string           { return t.content }
func (t *EmailTemplate) Description() string       { return t.description }
func (t *EmailTemplate) Variables() JSONB          { return t.variables }
func (t *EmailTemplate) Status() EmailTemplateStatus { return t.status }
func (t *EmailTemplate) DeletedAt() *time.Time     { return t.deletedAt }

func (t *EmailTemplate) SetName(name string)                      { t.name = name; t.Touch() }
func (t *EmailTemplate) SetSubject(subject string)                { t.subject = subject; t.Touch() }
func (t *EmailTemplate) SetContentType(contentType string)        { t.contentType = contentType; t.Touch() }
func (t *EmailTemplate) SetContent(content string)                { t.content = content; t.Touch() }
func (t *EmailTemplate) SetDescription(description string)        { t.description = description; t.Touch() }
func (t *EmailTemplate) SetVariables(variables JSONB)             { t.variables = variables; t.Touch() }
func (t *EmailTemplate) SetStatus(status EmailTemplateStatus)     { t.status = status; t.Touch() }

type EmailTemplateDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Subject     string `json:"subject"`
	ContentType string `json:"contentType"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Variables   string `json:"variables"`
	Status      int    `json:"status"`
}

func (t *EmailTemplate) ToDTO() *EmailTemplateDTO {
	var varsStr string
	if t.variables != nil {
		bytes, _ := json.Marshal(t.variables)
		varsStr = string(bytes)
	}
	return &EmailTemplateDTO{
		ID:          t.ID(),
		Name:        t.name,
		Code:        t.code,
		Subject:     t.subject,
		ContentType: t.contentType,
		Content:     t.content,
		Description: t.description,
		Variables:   varsStr,
		Status:      int(t.status),
	}
}

type JSONB map[string]interface{}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}
