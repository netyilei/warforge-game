package admin

import (
	"context"
	"database/sql"
	"warforge-server/config"
	"warforge-server/internal/domain/admin"
)

type AdminSettingRepository struct {
	db *sql.DB
}

func NewAdminSettingRepository(db *sql.DB) *AdminSettingRepository {
	return &AdminSettingRepository{db: db}
}

func (r *AdminSettingRepository) Save(ctx context.Context, setting *admin.AdminSetting) error {
	query := `
		INSERT INTO ` + config.GetTableName("admin_settings") + ` (key, value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key) DO UPDATE SET
			value = $2,
			description = $3,
			updated_at = $5
	`
	_, err := r.db.ExecContext(ctx, query,
		setting.Key(),
		setting.Value(),
		setting.Description(),
		setting.CreatedAt(),
		setting.UpdatedAt(),
	)
	return err
}

func (r *AdminSettingRepository) BatchSave(ctx context.Context, settings []*admin.AdminSetting) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO ` + config.GetTableName("admin_settings") + ` (key, value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key) DO UPDATE SET
			value = $2,
			description = $3,
			updated_at = $5
	`

	for _, s := range settings {
		_, err := tx.ExecContext(ctx, query,
			s.Key(),
			s.Value(),
			s.Description(),
			s.CreatedAt(),
			s.UpdatedAt(),
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *AdminSettingRepository) GetByKey(ctx context.Context, key string) (*admin.AdminSetting, error) {
	query := `SELECT key, value, description, created_at, updated_at FROM ` + config.GetTableName("admin_settings") + ` WHERE key = $1`

	var row struct {
		Key         string
		Value       string
		Description string
		CreatedAt   string
		UpdatedAt   string
	}

	err := r.db.QueryRowContext(ctx, query, key).Scan(
		&row.Key, &row.Value, &row.Description, &row.CreatedAt, &row.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	setting := admin.NewAdminSetting(row.Key, row.Value)
	setting.SetDescription(row.Description)
	return setting, nil
}

func (r *AdminSettingRepository) ListAll(ctx context.Context) ([]*admin.AdminSetting, error) {
	query := `SELECT key, value, description, created_at, updated_at FROM ` + config.GetTableName("admin_settings") + ` ORDER BY key`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []*admin.AdminSetting
	for rows.Next() {
		var row struct {
			Key         string
			Value       string
			Description string
			CreatedAt   string
			UpdatedAt   string
		}
		if err := rows.Scan(&row.Key, &row.Value, &row.Description, &row.CreatedAt, &row.UpdatedAt); err != nil {
			return nil, err
		}
		setting := admin.NewAdminSetting(row.Key, row.Value)
		setting.SetDescription(row.Description)
		settings = append(settings, setting)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return settings, nil
}
