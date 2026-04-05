package models

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"warforge-server/config"
)

var (
	ErrEmailConfigNotFound     = errors.New("邮箱配置不存在")
	ErrEmailConfigCodeExists   = errors.New("邮箱配置标识已存在")
	ErrEmailTemplateNotFound   = errors.New("邮件模板不存在")
	ErrEmailTemplateCodeExists = errors.New("邮件模板标识已存在")
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

type EmailConfig struct {
	ID         string          `json:"id"`
	Name       string          `json:"name"`
	Code       string          `json:"code"`
	Protocol   EmailProtocol   `json:"protocol"`
	Encryption EmailEncryption `json:"encryption"`
	Host       string          `json:"host"`
	Port       int             `json:"port"`
	Username   string          `json:"username"`
	Password   string          `json:"password"`
	FromName   string          `json:"fromName"`
	FromEmail  string          `json:"fromEmail"`
	IsDefault  bool            `json:"isDefault"`
	Status     int             `json:"status"`
	SortOrder  int             `json:"sortOrder"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
	DeletedAt  *time.Time      `json:"deletedAt,omitempty"`
}

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

type EmailTemplate struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Code        string     `json:"code"`
	Subject     string     `json:"subject"`
	ContentType string     `json:"contentType"`
	Content     string     `json:"content"`
	Description string     `json:"description"`
	Variables   string     `json:"variables"`
	Status      int        `json:"status"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"deletedAt,omitempty"`
}

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

func (EmailConfig) GetAll(db *sql.DB) ([]EmailConfigDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, 
		       from_name, from_email, is_default, status, sort_order
		FROM %s
		WHERE deleted_at IS NULL
		ORDER BY sort_order ASC, created_at ASC
	`, config.GetTableName("email_configs"))
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []EmailConfigDTO
	for rows.Next() {
		var c EmailConfigDTO
		err := rows.Scan(
			&c.ID, &c.Name, &c.Code, &c.Protocol, &c.Encryption,
			&c.Host, &c.Port, &c.Username, &c.FromName, &c.FromEmail,
			&c.IsDefault, &c.Status, &c.SortOrder,
		)
		if err != nil {
			return nil, err
		}
		configs = append(configs, c)
	}
	return configs, nil
}

func (EmailConfig) GetByID(db *sql.DB, id string) (*EmailConfigDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, 
		       password, from_name, from_email, is_default, status, sort_order
		FROM %s
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_configs"))
	var c EmailConfigDTO
	err := db.QueryRow(query, id).Scan(
		&c.ID, &c.Name, &c.Code, &c.Protocol, &c.Encryption,
		&c.Host, &c.Port, &c.Username, &c.Password, &c.FromName, &c.FromEmail,
		&c.IsDefault, &c.Status, &c.SortOrder,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (EmailConfig) GetByCode(db *sql.DB, code string) (*EmailConfigDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, 
		       password, from_name, from_email, is_default, status, sort_order
		FROM %s
		WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_configs"))
	var c EmailConfigDTO
	err := db.QueryRow(query, code).Scan(
		&c.ID, &c.Name, &c.Code, &c.Protocol, &c.Encryption,
		&c.Host, &c.Port, &c.Username, &c.Password, &c.FromName, &c.FromEmail,
		&c.IsDefault, &c.Status, &c.SortOrder,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (EmailConfig) GetDefault(db *sql.DB) (*EmailConfigDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, 
		       password, from_name, from_email, is_default, status, sort_order
		FROM %s
		WHERE is_default = true AND status = 1 AND deleted_at IS NULL
		LIMIT 1
	`, config.GetTableName("email_configs"))
	var c EmailConfigDTO
	err := db.QueryRow(query).Scan(
		&c.ID, &c.Name, &c.Code, &c.Protocol, &c.Encryption,
		&c.Host, &c.Port, &c.Username, &c.Password, &c.FromName, &c.FromEmail,
		&c.IsDefault, &c.Status, &c.SortOrder,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (EmailConfig) CheckCodeExists(db *sql.DB, code string, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, config.GetTableName("email_configs")), code, excludeID).Scan(&count)
	} else {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND deleted_at IS NULL`, config.GetTableName("email_configs")), code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (EmailConfig) Create(db *sql.DB, name, code, protocol, encryption, host string, port int, username, password, fromName, fromEmail string, isDefault bool, status, sortOrder int) (*EmailConfigDTO, error) {
	exists, err := EmailConfig{}.CheckCodeExists(db, code, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailConfigCodeExists
	}

	if isDefault {
		db.Exec(fmt.Sprintf(`UPDATE %s SET is_default = false WHERE deleted_at IS NULL`, config.GetTableName("email_configs")))
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (name, code, protocol, encryption, host, port, username, password, from_name, from_email, is_default, status, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id
	`, config.GetTableName("email_configs"))
	var id string
	err = db.QueryRow(query, name, code, protocol, encryption, host, port, username, password, fromName, fromEmail, isDefault, status, sortOrder).Scan(&id)
	if err != nil {
		return nil, err
	}

	return EmailConfig{}.GetByID(db, id)
}

func (EmailConfig) Update(db *sql.DB, id, name, protocol, encryption, host string, port int, username, password, fromName, fromEmail string, isDefault bool, status, sortOrder int) error {
	if isDefault {
		db.Exec(fmt.Sprintf(`UPDATE %s SET is_default = false WHERE id != $1 AND deleted_at IS NULL`, config.GetTableName("email_configs")), id)
	}

	query := fmt.Sprintf(`
		UPDATE %s
		SET name = $1, protocol = $2, encryption = $3, host = $4, port = $5,
		    username = $6, password = $7, from_name = $8, from_email = $9,
		    is_default = $10, status = $11, sort_order = $12, updated_at = CURRENT_TIMESTAMP
		WHERE id = $13 AND deleted_at IS NULL
	`, config.GetTableName("email_configs"))
	result, err := db.Exec(query, name, protocol, encryption, host, port, username, password, fromName, fromEmail, isDefault, status, sortOrder, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (EmailConfig) Delete(db *sql.DB, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("email_configs"))
	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (EmailTemplate) GetAll(db *sql.DB) ([]EmailTemplateDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s
		WHERE deleted_at IS NULL
		ORDER BY created_at ASC
	`, config.GetTableName("email_templates"))
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []EmailTemplateDTO
	for rows.Next() {
		var t EmailTemplateDTO
		var description, variables sql.NullString
		err := rows.Scan(
			&t.ID, &t.Name, &t.Code, &t.Subject, &t.ContentType, &t.Content, &description, &variables, &t.Status,
		)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			t.Description = description.String
		}
		if variables.Valid {
			t.Variables = variables.String
		}
		templates = append(templates, t)
	}
	return templates, nil
}

func (EmailTemplate) GetByID(db *sql.DB, id string) (*EmailTemplateDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s
		WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_templates"))
	var t EmailTemplateDTO
	var description, variables sql.NullString
	err := db.QueryRow(query, id).Scan(
		&t.ID, &t.Name, &t.Code, &t.Subject, &t.ContentType, &t.Content, &description, &variables, &t.Status,
	)
	if err != nil {
		return nil, err
	}
	if description.Valid {
		t.Description = description.String
	}
	if variables.Valid {
		t.Variables = variables.String
	}
	return &t, nil
}

func (EmailTemplate) GetByCode(db *sql.DB, code string) (*EmailTemplateDTO, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s
		WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_templates"))
	var t EmailTemplateDTO
	var description, variables sql.NullString
	err := db.QueryRow(query, code).Scan(
		&t.ID, &t.Name, &t.Code, &t.Subject, &t.ContentType, &t.Content, &description, &variables, &t.Status,
	)
	if err != nil {
		return nil, err
	}
	if description.Valid {
		t.Description = description.String
	}
	if variables.Valid {
		t.Variables = variables.String
	}
	return &t, nil
}

func (EmailTemplate) CheckCodeExists(db *sql.DB, code string, excludeID string) (bool, error) {
	var count int
	var err error
	if excludeID != "" {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND id != $2 AND deleted_at IS NULL`, config.GetTableName("email_templates")), code, excludeID).Scan(&count)
	} else {
		err = db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE code = $1 AND deleted_at IS NULL`, config.GetTableName("email_templates")), code).Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (EmailTemplate) Create(db *sql.DB, name, code, subject, contentType, content, description string, variables JSONB, status int) (*EmailTemplateDTO, error) {
	exists, err := EmailTemplate{}.CheckCodeExists(db, code, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailTemplateCodeExists
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (name, code, subject, content_type, content, description, variables, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, config.GetTableName("email_templates"))
	var id string
	var varsStr string
	if variables != nil {
		varsBytes, _ := json.Marshal(variables)
		varsStr = string(varsBytes)
	}
	err = db.QueryRow(query, name, code, subject, contentType, content, description, varsStr, status).Scan(&id)
	if err != nil {
		return nil, err
	}

	return EmailTemplate{}.GetByID(db, id)
}

func (EmailTemplate) Update(db *sql.DB, id, name, subject, contentType, content, description string, variables JSONB, status int) error {
	var varsStr string
	if variables != nil {
		varsBytes, _ := json.Marshal(variables)
		varsStr = string(varsBytes)
	}
	query := fmt.Sprintf(`
		UPDATE %s
		SET name = $1, subject = $2, content_type = $3, content = $4, description = $5, variables = $6, status = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8 AND deleted_at IS NULL
	`, config.GetTableName("email_templates"))
	result, err := db.Exec(query, name, subject, contentType, content, description, varsStr, status, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (EmailTemplate) Delete(db *sql.DB, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("email_templates"))
	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}
