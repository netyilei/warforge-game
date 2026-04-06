package admin

import (
	"context"
	"database/sql"
	"time"

	admindomain "warforge-server/internal/domain/admin"
)

type AdminSettingRepository struct {
	db *sql.DB
}

func NewAdminSettingRepository(db *sql.DB) *AdminSettingRepository {
	return &AdminSettingRepository{db: db}
}

func (r *AdminSettingRepository) FindByKey(ctx context.Context, key string) (*admindomain.AdminSetting, error) {
	query := `SELECT key, value, description FROM admin_settings WHERE key = $1`

	var value, description string
	err := r.db.QueryRowContext(ctx, query, key).Scan(&key, &value, &description)
	if err != nil {
		return nil, err
	}

	setting := admindomain.NewAdminSetting(key, value)
	setting.SetDescription(description)

	return setting, nil
}

func (r *AdminSettingRepository) ListAll(ctx context.Context) ([]*admindomain.AdminSetting, error) {
	query := `SELECT key, value, description FROM admin_settings ORDER BY key`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []*admindomain.AdminSetting
	for rows.Next() {
		var key, value string
		var description sql.NullString

		err := rows.Scan(&key, &value, &description)
		if err != nil {
			return nil, err
		}

		setting := admindomain.NewAdminSetting(key, value)
		if description.Valid {
			setting.SetDescription(description.String)
		}
		settings = append(settings, setting)
	}

	return settings, nil
}

func (r *AdminSettingRepository) Save(ctx context.Context, s *admindomain.AdminSetting) error {
	query := `
		INSERT INTO admin_settings (key, value, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_at = $5
	`

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, s.Key(), s.Value(), s.Description(), now, now)
	return err
}

func (r *AdminSettingRepository) BatchSave(ctx context.Context, settings []*admindomain.AdminSetting) error {
	for _, s := range settings {
		if err := r.Save(ctx, s); err != nil {
			return err
		}
	}
	return nil
}
