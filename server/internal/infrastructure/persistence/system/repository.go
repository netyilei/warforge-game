package system

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
	"warforge-server/internal/domain/shared"
	systemdomain "warforge-server/internal/domain/system"
	"warforge-server/pkg/utils"
)

type EmailConfigRepository struct {
	db *sql.DB
}

func NewEmailConfigRepository(db *sql.DB) *EmailConfigRepository {
	return &EmailConfigRepository{db: db}
}

func (r *EmailConfigRepository) FindByID(ctx context.Context, id string) (*systemdomain.EmailConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, password, 
		       from_name, from_email, is_default, status, sort_order, created_at, updated_at
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_configs"))

	var name, code, protocol, encryption, host, username, password, fromName, fromEmail string
	var port, status, sortOrder int
	var isDefault bool
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &name, &code, &protocol, &encryption, &host, &port, &username, &password,
		&fromName, &fromEmail, &isDefault, &status, &sortOrder, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}

	config := systemdomain.NewEmailConfig(id, name, code, systemdomain.EmailProtocol(protocol), host, port)
	config.SetEncryption(systemdomain.EmailEncryption(encryption))
	config.SetUsername(username)
	config.SetPassword(password)
	config.SetFromName(fromName)
	config.SetFromEmail(fromEmail)
	config.SetDefault(isDefault)
	config.SetStatus(systemdomain.EmailConfigStatus(status))
	config.SetSortOrder(sortOrder)

	return config, nil
}

func (r *EmailConfigRepository) FindByCode(ctx context.Context, code string) (*systemdomain.EmailConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, password, 
		       from_name, from_email, is_default, status, sort_order, created_at, updated_at
		FROM %s WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_configs"))

	var id, name, protocol, encryption, host, username, password, fromName, fromEmail string
	var port, status, sortOrder int
	var isDefault bool
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&id, &name, &code, &protocol, &encryption, &host, &port, &username, &password,
		&fromName, &fromEmail, &isDefault, &status, &sortOrder, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}

	c := systemdomain.NewEmailConfig(id, name, code, systemdomain.EmailProtocol(protocol), host, port)
	c.SetEncryption(systemdomain.EmailEncryption(encryption))
	c.SetUsername(username)
	c.SetPassword(password)
	c.SetFromName(fromName)
	c.SetFromEmail(fromEmail)
	c.SetDefault(isDefault)
	c.SetStatus(systemdomain.EmailConfigStatus(status))
	c.SetSortOrder(sortOrder)

	return c, nil
}

func (r *EmailConfigRepository) FindDefault(ctx context.Context) (*systemdomain.EmailConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, password, 
		       from_name, from_email, is_default, status, sort_order, created_at, updated_at
		FROM %s WHERE is_default = true AND status = 1 AND deleted_at IS NULL LIMIT 1
	`, config.GetTableName("email_configs"))

	var id, name, code, protocol, encryption, host, username, password, fromName, fromEmail string
	var port, status, sortOrder int
	var isDefault bool
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query).Scan(
		&id, &name, &code, &protocol, &encryption, &host, &port, &username, &password,
		&fromName, &fromEmail, &isDefault, &status, &sortOrder, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}

	c := systemdomain.NewEmailConfig(id, name, code, systemdomain.EmailProtocol(protocol), host, port)
	c.SetEncryption(systemdomain.EmailEncryption(encryption))
	c.SetUsername(username)
	c.SetPassword(password)
	c.SetFromName(fromName)
	c.SetFromEmail(fromEmail)
	c.SetDefault(isDefault)
	c.SetStatus(systemdomain.EmailConfigStatus(status))
	c.SetSortOrder(sortOrder)

	return c, nil
}

func (r *EmailConfigRepository) ListAll(ctx context.Context) ([]*systemdomain.EmailConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, protocol, encryption, host, port, username, password, 
		       from_name, from_email, is_default, status, sort_order, created_at, updated_at
		FROM %s WHERE deleted_at IS NULL ORDER BY sort_order, created_at
	`, config.GetTableName("email_configs"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*systemdomain.EmailConfig
	for rows.Next() {
		var id, name, code, protocol, encryption, host, username, password, fromName, fromEmail string
		var port, status, sortOrder int
		var isDefault bool
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &name, &code, &protocol, &encryption, &host, &port, &username, &password,
			&fromName, &fromEmail, &isDefault, &status, &sortOrder, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		c := systemdomain.NewEmailConfig(id, name, code, systemdomain.EmailProtocol(protocol), host, port)
		c.SetEncryption(systemdomain.EmailEncryption(encryption))
		c.SetUsername(username)
		c.SetPassword(password)
		c.SetFromName(fromName)
		c.SetFromEmail(fromEmail)
		c.SetDefault(isDefault)
		c.SetStatus(systemdomain.EmailConfigStatus(status))
		c.SetSortOrder(sortOrder)
		configs = append(configs, c)
	}

	return configs, nil
}

func (r *EmailConfigRepository) Save(ctx context.Context, c *systemdomain.EmailConfig) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, protocol, encryption, host, port, username, password, 
		                from_name, from_email, is_default, status, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, protocol = $4, encryption = $5, host = $6, port = $7, username = $8, password = $9,
			from_name = $10, from_email = $11, is_default = $12, status = $13, sort_order = $14, updated_at = $16
	`, config.GetTableName("email_configs"))

	_, err := r.db.ExecContext(ctx, query,
		c.ID(), c.Name(), c.Code(), string(c.Protocol()), string(c.Encryption()),
		c.Host(), c.Port(), c.Username(), c.Password(), c.FromName(), c.FromEmail(),
		c.IsDefault(), int(c.Status()), c.SortOrder(), c.CreatedAt(), c.UpdatedAt())

	return err
}

func (r *EmailConfigRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("email_configs"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

type EmailTemplateRepository struct {
	db *sql.DB
}

func NewEmailTemplateRepository(db *sql.DB) *EmailTemplateRepository {
	return &EmailTemplateRepository{db: db}
}

func (r *EmailTemplateRepository) FindByID(ctx context.Context, id string) (*systemdomain.EmailTemplate, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s WHERE id = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_templates"))

	var name, code, subject, contentType, content string
	var description, variables sql.NullString
	var status int

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &name, &code, &subject, &contentType, &content, &description, &variables, &status,
	)
	if err != nil {
		return nil, err
	}

	t := systemdomain.NewEmailTemplate(id, name, code, subject)
	t.SetContentType(contentType)
	t.SetContent(content)
	if description.Valid {
		t.SetDescription(description.String)
	}
	if variables.Valid {
		var vars systemdomain.JSONB
		vars.Scan([]byte(variables.String))
		t.SetVariables(vars)
	}
	t.SetStatus(systemdomain.EmailTemplateStatus(status))

	return t, nil
}

func (r *EmailTemplateRepository) FindByCode(ctx context.Context, code string) (*systemdomain.EmailTemplate, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s WHERE code = $1 AND deleted_at IS NULL
	`, config.GetTableName("email_templates"))

	var id, name, subject, contentType, content string
	var description, variables sql.NullString
	var status int

	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&id, &name, &code, &subject, &contentType, &content, &description, &variables, &status,
	)
	if err != nil {
		return nil, err
	}

	t := systemdomain.NewEmailTemplate(id, name, code, subject)
	t.SetContentType(contentType)
	t.SetContent(content)
	if description.Valid {
		t.SetDescription(description.String)
	}
	if variables.Valid {
		var vars systemdomain.JSONB
		vars.Scan([]byte(variables.String))
		t.SetVariables(vars)
	}
	t.SetStatus(systemdomain.EmailTemplateStatus(status))

	return t, nil
}

func (r *EmailTemplateRepository) ListAll(ctx context.Context) ([]*systemdomain.EmailTemplate, error) {
	query := fmt.Sprintf(`
		SELECT id, name, code, subject, content_type, content, description, variables, status
		FROM %s WHERE deleted_at IS NULL ORDER BY created_at
	`, config.GetTableName("email_templates"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*systemdomain.EmailTemplate
	for rows.Next() {
		var id, name, code, subject, contentType, content string
		var description, variables sql.NullString
		var status int

		err := rows.Scan(
			&id, &name, &code, &subject, &contentType, &content, &description, &variables, &status,
		)
		if err != nil {
			return nil, err
		}

		t := systemdomain.NewEmailTemplate(id, name, code, subject)
		t.SetContentType(contentType)
		t.SetContent(content)
		if description.Valid {
			t.SetDescription(description.String)
		}
		if variables.Valid {
			var vars systemdomain.JSONB
			vars.Scan([]byte(variables.String))
			t.SetVariables(vars)
		}
		t.SetStatus(systemdomain.EmailTemplateStatus(status))
		templates = append(templates, t)
	}

	return templates, nil
}

func (r *EmailTemplateRepository) Save(ctx context.Context, t *systemdomain.EmailTemplate) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, subject, content_type, content, description, variables, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, subject = $4, content_type = $5, content = $6, description = $7, variables = $8, status = $9, updated_at = $11
	`, config.GetTableName("email_templates"))

	_, err := r.db.ExecContext(ctx, query,
		t.ID(), t.Name(), t.Code(), t.Subject(), t.ContentType(), t.Content(),
		t.Description(), t.Variables(), int(t.Status()), t.CreatedAt(), t.UpdatedAt())

	return err
}

func (r *EmailTemplateRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`UPDATE %s SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, config.GetTableName("email_templates"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

type StorageConfigRepository struct {
	db *sql.DB
}

func NewStorageConfigRepository(db *sql.DB) *StorageConfigRepository {
	return &StorageConfigRepository{db: db}
}

func (r *StorageConfigRepository) FindByID(ctx context.Context, id string) (*systemdomain.StorageConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, COALESCE(code, ''), driver, bucket, COALESCE(endpoint, ''), COALESCE(region, ''),
		       access_key, secret_key, COALESCE(custom_url, ''), is_default, status, COALESCE(sort_order, 0),
		       COALESCE(max_file_size, 0), COALESCE(allowed_types, '')
		FROM %s WHERE id = $1
	`, config.GetTableName("storage_configs"))

	var name, code, driver, bucket, endpoint, region, accessKey, secretKey, customURL, allowedTypes string
	var maxFileSize int64
	var status, sortOrder int
	var isDefault bool

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &name, &code, &driver, &bucket, &endpoint, &region,
		&accessKey, &secretKey, &customURL, &isDefault, &status, &sortOrder,
		&maxFileSize, &allowedTypes,
	)
	if err != nil {
		return nil, err
	}

	c := systemdomain.NewStorageConfig(id, name, systemdomain.StorageDriver(driver), bucket)
	c.SetCode(code)
	c.SetEndpoint(endpoint)
	c.SetRegion(region)
	c.SetAccessKey(accessKey)
	c.SetSecretKey(secretKey)
	c.SetCustomURL(customURL)
	c.SetDefault(isDefault)
	c.SetStatus(systemdomain.StorageConfigStatus(status))
	c.SetSortOrder(sortOrder)
	c.SetMaxFileSize(maxFileSize)
	c.SetAllowedTypes(allowedTypes)

	return c, nil
}

func (r *StorageConfigRepository) FindDefault(ctx context.Context) (*systemdomain.StorageConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, COALESCE(code, ''), driver, bucket, COALESCE(endpoint, ''), COALESCE(region, ''),
		       access_key, secret_key, COALESCE(custom_url, ''), is_default, status, COALESCE(sort_order, 0),
		       COALESCE(max_file_size, 0), COALESCE(allowed_types, '')
		FROM %s WHERE is_default = true AND status = 1
	`, config.GetTableName("storage_configs"))

	var id, name, code, driver, bucket, endpoint, region, accessKey, secretKey, customURL, allowedTypes string
	var maxFileSize int64
	var status, sortOrder int
	var isDefault bool

	err := r.db.QueryRowContext(ctx, query).Scan(
		&id, &name, &code, &driver, &bucket, &endpoint, &region,
		&accessKey, &secretKey, &customURL, &isDefault, &status, &sortOrder,
		&maxFileSize, &allowedTypes,
	)
	if err != nil {
		return nil, err
	}

	c := systemdomain.NewStorageConfig(id, name, systemdomain.StorageDriver(driver), bucket)
	c.SetCode(code)
	c.SetEndpoint(endpoint)
	c.SetRegion(region)
	c.SetAccessKey(accessKey)
	c.SetSecretKey(secretKey)
	c.SetCustomURL(customURL)
	c.SetDefault(isDefault)
	c.SetStatus(systemdomain.StorageConfigStatus(status))
	c.SetSortOrder(sortOrder)
	c.SetMaxFileSize(maxFileSize)
	c.SetAllowedTypes(allowedTypes)

	return c, nil
}

func (r *StorageConfigRepository) ListAll(ctx context.Context) ([]*systemdomain.StorageConfig, error) {
	query := fmt.Sprintf(`
		SELECT id, name, COALESCE(code, ''), driver, bucket, COALESCE(endpoint, ''), COALESCE(region, ''),
		       access_key, secret_key, COALESCE(custom_url, ''), is_default, status, COALESCE(sort_order, 0),
		       COALESCE(max_file_size, 0), COALESCE(allowed_types, '')
		FROM %s ORDER BY is_default DESC, sort_order, created_at DESC
	`, config.GetTableName("storage_configs"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*systemdomain.StorageConfig
	for rows.Next() {
		var id, name, code, driver, bucket, endpoint, region, accessKey, secretKey, customURL, allowedTypes string
		var maxFileSize int64
		var status, sortOrder int
		var isDefault bool

		err := rows.Scan(
			&id, &name, &code, &driver, &bucket, &endpoint, &region,
			&accessKey, &secretKey, &customURL, &isDefault, &status, &sortOrder,
			&maxFileSize, &allowedTypes,
		)
		if err != nil {
			return nil, err
		}

		c := systemdomain.NewStorageConfig(id, name, systemdomain.StorageDriver(driver), bucket)
		c.SetCode(code)
		c.SetEndpoint(endpoint)
		c.SetRegion(region)
		c.SetAccessKey(accessKey)
		c.SetSecretKey(secretKey)
		c.SetCustomURL(customURL)
		c.SetDefault(isDefault)
		c.SetStatus(systemdomain.StorageConfigStatus(status))
		c.SetSortOrder(sortOrder)
		c.SetMaxFileSize(maxFileSize)
		c.SetAllowedTypes(allowedTypes)
		configs = append(configs, c)
	}

	return configs, nil
}

func (r *StorageConfigRepository) Save(ctx context.Context, c *systemdomain.StorageConfig) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, name, code, driver, bucket, endpoint, region, access_key, secret_key,
		                custom_url, is_default, status, sort_order, max_file_size, allowed_types, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		ON CONFLICT (id) DO UPDATE SET
			name = $2, code = $3, driver = $4, bucket = $5, endpoint = $6, region = $7,
			access_key = $8, secret_key = $9, custom_url = $10, is_default = $11, status = $12,
			sort_order = $13, max_file_size = $14, allowed_types = $15, updated_at = $17
	`, config.GetTableName("storage_configs"))

	_, err := r.db.ExecContext(ctx, query,
		c.ID(), c.Name(), c.Code(), string(c.Driver()), c.Bucket(), c.Endpoint(), c.Region(),
		c.AccessKey(), c.SecretKey(), c.CustomURL(), c.IsDefault(), int(c.Status()),
		c.SortOrder(), c.MaxFileSize(), c.AllowedTypes(), c.CreatedAt(), c.UpdatedAt())

	return err
}

func (r *StorageConfigRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, config.GetTableName("storage_configs"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *StorageConfigRepository) SetDefault(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	clearQuery := fmt.Sprintf(`UPDATE %s SET is_default = false WHERE is_default = true`, config.GetTableName("storage_configs"))
	if _, err := tx.ExecContext(ctx, clearQuery); err != nil {
		return err
	}

	setQuery := fmt.Sprintf(`UPDATE %s SET is_default = true WHERE id = $1`, config.GetTableName("storage_configs"))
	if _, err := tx.ExecContext(ctx, setQuery, id); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *StorageConfigRepository) ClearDefault(ctx context.Context) error {
	query := fmt.Sprintf(`UPDATE %s SET is_default = false WHERE is_default = true`, config.GetTableName("storage_configs"))
	_, err := r.db.ExecContext(ctx, query)
	return err
}

type LanguageRepository struct {
	db *sql.DB
}

func NewLanguageRepository(db *sql.DB) *LanguageRepository {
	return &LanguageRepository{db: db}
}

func (r *LanguageRepository) FindByID(ctx context.Context, id string) (*systemdomain.Language, error) {
	query := `SELECT id, code, name, native_name, icon, status, is_default, sort_order FROM languages WHERE id = $1`

	var code, name string
	var nativeName, icon sql.NullString
	var status, sortOrder int
	var isDefault bool

	err := r.db.QueryRowContext(ctx, query, id).Scan(&id, &code, &name, &nativeName, &icon, &status, &isDefault, &sortOrder)
	if err != nil {
		return nil, err
	}

	lang := systemdomain.NewLanguage(id, code, name)
	if nativeName.Valid {
		lang.SetNativeName(nativeName.String)
	}
	if icon.Valid {
		lang.SetIcon(&icon.String)
	}
	lang.SetStatus(systemdomain.LanguageStatus(status))
	lang.SetDefault(isDefault)
	lang.SetSortOrder(sortOrder)

	return lang, nil
}

func (r *LanguageRepository) FindByCode(ctx context.Context, code string) (*systemdomain.Language, error) {
	query := `SELECT id, code, name, native_name, icon, status, is_default, sort_order FROM languages WHERE code = $1`

	var id, name string
	var nativeName, icon sql.NullString
	var status, sortOrder int
	var isDefault bool

	err := r.db.QueryRowContext(ctx, query, code).Scan(&id, &code, &name, &nativeName, &icon, &status, &isDefault, &sortOrder)
	if err != nil {
		return nil, err
	}

	lang := systemdomain.NewLanguage(id, code, name)
	if nativeName.Valid {
		lang.SetNativeName(nativeName.String)
	}
	if icon.Valid {
		lang.SetIcon(&icon.String)
	}
	lang.SetStatus(systemdomain.LanguageStatus(status))
	lang.SetDefault(isDefault)
	lang.SetSortOrder(sortOrder)

	return lang, nil
}

func (r *LanguageRepository) ListAll(ctx context.Context) ([]*systemdomain.Language, error) {
	query := `SELECT id, code, name, native_name, icon, status, is_default, sort_order FROM languages ORDER BY sort_order`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var languages []*systemdomain.Language
	for rows.Next() {
		var id, code, name string
		var nativeName, icon sql.NullString
		var status, sortOrder int
		var isDefault bool

		err := rows.Scan(&id, &code, &name, &nativeName, &icon, &status, &isDefault, &sortOrder)
		if err != nil {
			return nil, err
		}

		lang := systemdomain.NewLanguage(id, code, name)
		if nativeName.Valid {
			lang.SetNativeName(nativeName.String)
		}
		if icon.Valid {
			lang.SetIcon(&icon.String)
		}
		lang.SetStatus(systemdomain.LanguageStatus(status))
		lang.SetDefault(isDefault)
		lang.SetSortOrder(sortOrder)
		languages = append(languages, lang)
	}

	return languages, nil
}

func (r *LanguageRepository) Save(ctx context.Context, lang *systemdomain.Language) error {
	query := `
		INSERT INTO languages (id, code, name, native_name, icon, status, is_default, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			name = $3, native_name = $4, icon = $5, status = $6, is_default = $7, sort_order = $8
	`

	_, err := r.db.ExecContext(ctx, query,
		lang.ID(), lang.Code(), lang.Name(), lang.NativeName(), lang.Icon(),
		int(lang.Status()), lang.IsDefault(), lang.SortOrder())

	return err
}

func (r *LanguageRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM languages WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *LanguageRepository) SetDefault(ctx context.Context, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `UPDATE languages SET is_default = false`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `UPDATE languages SET is_default = true WHERE id = $1`, id); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *LanguageRepository) SetSupported(ctx context.Context, languageIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `UPDATE languages SET status = 0`); err != nil {
		return err
	}

	for _, id := range languageIDs {
		if _, err := tx.ExecContext(ctx, `UPDATE languages SET status = 1 WHERE id = $1`, id); err != nil {
			return err
		}
	}

	return tx.Commit()
}

type SystemConfigRepository struct {
	db *sql.DB
}

func NewSystemConfigRepository(db *sql.DB) *SystemConfigRepository {
	return &SystemConfigRepository{db: db}
}

func (r *SystemConfigRepository) FindByKey(ctx context.Context, key string) (*systemdomain.SystemConfig, error) {
	query := fmt.Sprintf(`SELECT key, value, description FROM %s WHERE key = $1`, config.GetTableName("system_configs"))

	var description string
	var value systemdomain.JSONB

	err := r.db.QueryRowContext(ctx, query, key).Scan(&key, &value, &description)
	if err != nil {
		return nil, err
	}

	c := systemdomain.NewSystemConfig(key, value)
	c.SetDescription(description)

	return c, nil
}

func (r *SystemConfigRepository) ListAll(ctx context.Context) ([]*systemdomain.SystemConfig, error) {
	query := fmt.Sprintf(`SELECT key, value, description FROM %s ORDER BY key`, config.GetTableName("system_configs"))

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*systemdomain.SystemConfig
	for rows.Next() {
		var key, description string
		var value systemdomain.JSONB

		err := rows.Scan(&key, &value, &description)
		if err != nil {
			return nil, err
		}

		c := systemdomain.NewSystemConfig(key, value)
		c.SetDescription(description)
		configs = append(configs, c)
	}

	return configs, nil
}

func (r *SystemConfigRepository) Save(ctx context.Context, c *systemdomain.SystemConfig) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (key, value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_at = $5
	`, config.GetTableName("system_configs"))

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, c.Key(), c.Value(), c.Description(), now, now)
	return err
}

func (r *SystemConfigRepository) Delete(ctx context.Context, key string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE key = $1`, config.GetTableName("system_configs"))
	_, err := r.db.ExecContext(ctx, query, key)
	return err
}

type UploadRecordRepository struct {
	db *sql.DB
}

func NewUploadRecordRepository(db *sql.DB) *UploadRecordRepository {
	return &UploadRecordRepository{db: db}
}

func (r *UploadRecordRepository) FindByID(ctx context.Context, id string) (*systemdomain.UploadRecord, error) {
	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at, updated_at
		FROM %s 
		WHERE id = $1
	`, config.GetTableName("upload_records"))

	var userID, userType, originalName, filePath, mimeType, storageID, uploadType string
	var fileSize int64
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &userID, &userType, &originalName, &filePath, &fileSize, &mimeType, &storageID, &uploadType, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, systemdomain.ErrUploadRecordNotFound
		}
		return nil, err
	}

	record := systemdomain.NewUploadRecord(id, userID, systemdomain.UserType(userType))
	record.SetOriginalName(originalName)
	record.SetFilePath(filePath)
	record.SetFileSize(fileSize)
	record.SetMimeType(mimeType)
	record.SetStorageID(storageID)
	record.SetUploadType(systemdomain.UploadType(uploadType))
	return record, nil
}

func (r *UploadRecordRepository) FindByUser(ctx context.Context, userID string, userType systemdomain.UserType, page, pageSize int) (*shared.QueryResult[*systemdomain.UploadRecord], error) {
	offset := (page - 1) * pageSize

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE user_id = $1 AND user_type = $2`, config.GetTableName("upload_records"))
	var total int64
	r.db.QueryRowContext(ctx, countQuery, userID, string(userType)).Scan(&total)

	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at, updated_at
		FROM %s 
		WHERE user_id = $1 AND user_type = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`, config.GetTableName("upload_records"))

	rows, err := r.db.QueryContext(ctx, query, userID, string(userType), pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*systemdomain.UploadRecord
	for rows.Next() {
		var id, uid, ut, originalName, filePath, mimeType, storageID, uploadType string
		var fileSize int64
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &uid, &ut, &originalName, &filePath, &fileSize, &mimeType, &storageID, &uploadType, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		record := systemdomain.NewUploadRecord(id, uid, systemdomain.UserType(ut))
		record.SetOriginalName(originalName)
		record.SetFilePath(filePath)
		record.SetFileSize(fileSize)
		record.SetMimeType(mimeType)
		record.SetStorageID(storageID)
		record.SetUploadType(systemdomain.UploadType(uploadType))
		records = append(records, record)
	}

	return &shared.QueryResult[*systemdomain.UploadRecord]{
		Items: records,
		Total: total,
		Page:  page,
	}, nil
}

func (r *UploadRecordRepository) List(ctx context.Context, filter systemdomain.UploadRecordFilter) (*shared.QueryResult[*systemdomain.UploadRecord], error) {
	offset := (filter.Page - 1) * filter.PageSize
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}

	uploadRecordsTable := config.GetTableName("upload_records")

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if filter.UserType != "" {
		whereClause += fmt.Sprintf(" AND user_type = $%d", argIndex)
		args = append(args, string(filter.UserType))
		argIndex++
	}
	if filter.UploadType != "" {
		whereClause += fmt.Sprintf(" AND upload_type = $%d", argIndex)
		args = append(args, string(filter.UploadType))
		argIndex++
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s `, uploadRecordsTable) + whereClause
	var total int64
	r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)

	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at, updated_at
		FROM %s 
	`, uploadRecordsTable) + whereClause + fmt.Sprintf(`
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, argIndex, argIndex+1)

	args = append(args, filter.PageSize, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*systemdomain.UploadRecord
	for rows.Next() {
		var id, uid, ut, originalName, filePath, mimeType, storageID, uploadType string
		var fileSize int64
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&id, &uid, &ut, &originalName, &filePath, &fileSize, &mimeType, &storageID, &uploadType, &createdAt, &updatedAt,
		)
		if err != nil {
			return nil, err
		}

		record := systemdomain.NewUploadRecord(id, uid, systemdomain.UserType(ut))
		record.SetOriginalName(originalName)
		record.SetFilePath(filePath)
		record.SetFileSize(fileSize)
		record.SetMimeType(mimeType)
		record.SetStorageID(storageID)
		record.SetUploadType(systemdomain.UploadType(uploadType))
		records = append(records, record)
	}

	return &shared.QueryResult[*systemdomain.UploadRecord]{
		Items: records,
		Total: total,
		Page:  filter.Page,
	}, nil
}

func (r *UploadRecordRepository) Save(ctx context.Context, record *systemdomain.UploadRecord) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (id) DO UPDATE SET
			original_name = $4, file_path = $5, file_size = $6, mime_type = $7, storage_id = $8, upload_type = $9, updated_at = $11
	`, config.GetTableName("upload_records"))

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query,
		utils.GenerateUUID(), record.UserID(), string(record.UserType()), record.OriginalName(),
		record.FilePath(), record.FileSize(), record.MimeType(), record.StorageID(),
		string(record.UploadType()), now, now,
	)
	return err
}

func (r *UploadRecordRepository) Delete(ctx context.Context, id string) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE id = $1`, config.GetTableName("upload_records"))
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *UploadRecordRepository) DeleteByUser(ctx context.Context, userID string, userType systemdomain.UserType) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE user_id = $1 AND user_type = $2`, config.GetTableName("upload_records"))
	_, err := r.db.ExecContext(ctx, query, userID, string(userType))
	return err
}

func (r *UploadRecordRepository) ListWithDetails(ctx context.Context, page, pageSize int, userType, uploadType string) ([]systemdomain.UploadRecordListDTO, int64, error) {
	offset := (page - 1) * pageSize

	uploadRecordsTable := config.GetTableName("upload_records")
	adminUsersTable := config.GetTableName("admin_users")
	storageConfigsTable := config.GetTableName("storage_configs")

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if userType != "" {
		whereClause += fmt.Sprintf(" AND ur.user_type = $%d", argIndex)
		args = append(args, userType)
		argIndex++
	}
	if uploadType != "" {
		whereClause += fmt.Sprintf(" AND ur.upload_type = $%d", argIndex)
		args = append(args, uploadType)
		argIndex++
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s ur `, uploadRecordsTable) + whereClause
	var total int64
	r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)

	query := fmt.Sprintf(`
		SELECT ur.id, ur.user_id, ur.user_type, ur.original_name, ur.file_path, 
			   ur.file_size, ur.mime_type, ur.storage_id, ur.upload_type, ur.created_at,
			   COALESCE(au.username, '') as user_name,
			   COALESCE(sc.name, '') as storage_name
		FROM %s ur
		LEFT JOIN %s au ON ur.user_id = CAST(au.id AS VARCHAR) AND ur.user_type = 'admin'
		LEFT JOIN %s sc ON ur.storage_id = sc.id
	`, uploadRecordsTable, adminUsersTable, storageConfigsTable) + whereClause + fmt.Sprintf(`
		ORDER BY ur.created_at DESC
		LIMIT $%d OFFSET $%d
	`, argIndex, argIndex+1)

	args = append(args, pageSize, offset)
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []systemdomain.UploadRecordListDTO
	for rows.Next() {
		var record systemdomain.UploadRecordListDTO
		var createdAt time.Time
		err := rows.Scan(
			&record.ID, &record.UserID, &record.UserType, &record.OriginalName,
			&record.FilePath, &record.FileSize, &record.MimeType,
			&record.StorageID, &record.UploadType, &createdAt,
			&record.UserName, &record.StorageName,
		)
		if err != nil {
			return nil, 0, err
		}
		record.CreatedAt = createdAt.Format("2006-01-02T15:04:05Z07:00")
		records = append(records, record)
	}
	return records, total, nil
}

func (r *UploadRecordRepository) Create(ctx context.Context, userID, userType, originalName, filePath string, fileSize int64, mimeType, storageID, uploadType string) (string, error) {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
		RETURNING id
	`, config.GetTableName("upload_records"))

	id := utils.GenerateUUID()
	now := time.Now()
	err := r.db.QueryRowContext(ctx, query, id, userID, userType, originalName, filePath, fileSize, mimeType, storageID, uploadType, now).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

func (r *UploadRecordRepository) GetByIDSimple(ctx context.Context, id string) (string, string, string, string, int64, string, string, string, error) {
	query := fmt.Sprintf(`
		SELECT id, user_id, user_type, original_name, file_path, file_size, mime_type, storage_id, upload_type
		FROM %s 
		WHERE id = $1
	`, config.GetTableName("upload_records"))

	var recordID, userID, userType, originalName, filePath, mimeType, storageID, uploadType string
	var fileSize int64

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&recordID, &userID, &userType, &originalName, &filePath, &fileSize, &mimeType, &storageID, &uploadType,
	)
	if err != nil {
		return "", "", "", "", 0, "", "", "", err
	}
	return recordID, userID, userType, originalName, fileSize, filePath, mimeType, storageID, nil
}
