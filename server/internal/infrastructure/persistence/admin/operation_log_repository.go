package admin

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
	admindomain "warforge-server/internal/domain/admin"
	"warforge-server/internal/domain/shared"
	"warforge-server/pkg/utils"
)

type OperationLogRepository struct {
	db *sql.DB
}

func NewOperationLogRepository(db *sql.DB) *OperationLogRepository {
	return &OperationLogRepository{db: db}
}

func (r *OperationLogRepository) FindByID(ctx context.Context, id string) (*admindomain.OperationLog, error) {
	query := fmt.Sprintf(`
		SELECT id, user_id, username, action, target_type, target_id, details, ip, user_agent, created_at
		FROM %s WHERE id = $1
	`, config.GetTableName("admin_operation_logs"))

	var username, action, ip string
	var userID, targetType, targetID, details, userAgent sql.NullString
	var createdAt time.Time

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&id, &userID, &username, &action, &targetType, &targetID, &details, &ip, &userAgent, &createdAt,
	)
	if err != nil {
		return nil, err
	}

	log := admindomain.NewOperationLog(id, username, action)
	if userID.Valid {
		log.SetUserID(&userID.String)
	}
	if targetType.Valid {
		log.SetTargetType(targetType.String)
	}
	if targetID.Valid {
		log.SetTargetID(targetID.String)
	}
	if details.Valid {
		log.SetDetails(details.String)
	}
	log.SetIP(ip)
	if userAgent.Valid {
		log.SetUserAgent(userAgent.String)
	}

	return log, nil
}

func (r *OperationLogRepository) List(ctx context.Context, filter admindomain.OperationLogFilter) (*shared.QueryResult[*admindomain.OperationLog], error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}

	offset := (filter.Page - 1) * filter.PageSize

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM %s
		WHERE ($1 = '' OR username LIKE '%%' || $1 || '%%')
		AND ($2 = '' OR action = $2)
		AND ($3 = '' OR target_type = $3)
		AND ($4 = '' OR created_at >= $4::timestamp)
		AND ($5 = '' OR created_at <= $5::timestamp)
	`, config.GetTableName("admin_operation_logs"))

	var total int
	err := r.db.QueryRowContext(ctx, countQuery,
		filter.Username, filter.Action, filter.TargetType, filter.StartTime, filter.EndTime).Scan(&total)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, username, action, target_type, target_id, details, ip, user_agent, created_at
		FROM %s
		WHERE ($1 = '' OR username LIKE '%%' || $1 || '%%')
		AND ($2 = '' OR action = $2)
		AND ($3 = '' OR target_type = $3)
		AND ($4 = '' OR created_at >= $4::timestamp)
		AND ($5 = '' OR created_at <= $5::timestamp)
		ORDER BY created_at DESC
		LIMIT $6 OFFSET $7
	`, config.GetTableName("admin_operation_logs"))

	rows, err := r.db.QueryContext(ctx, query,
		filter.Username, filter.Action, filter.TargetType, filter.StartTime, filter.EndTime, filter.PageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*admindomain.OperationLog
	for rows.Next() {
		var id, username, action, ip string
		var userID, targetType, targetID, details, userAgent sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&id, &userID, &username, &action, &targetType, &targetID, &details, &ip, &userAgent, &createdAt,
		)
		if err != nil {
			return nil, err
		}

		log := admindomain.NewOperationLog(id, username, action)
		if userID.Valid {
			log.SetUserID(&userID.String)
		}
		if targetType.Valid {
			log.SetTargetType(targetType.String)
		}
		if targetID.Valid {
			log.SetTargetID(targetID.String)
		}
		if details.Valid {
			log.SetDetails(details.String)
		}
		log.SetIP(ip)
		if userAgent.Valid {
			log.SetUserAgent(userAgent.String)
		}
		logs = append(logs, log)
	}

	return &shared.QueryResult[*admindomain.OperationLog]{
		Items:    logs,
		Total:    int64(total),
		Page:     filter.Page,
		PageSize: filter.PageSize,
	}, nil
}

func (r *OperationLogRepository) Save(ctx context.Context, l *admindomain.OperationLog) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (id, user_id, username, action, target_type, target_id, details, ip, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, config.GetTableName("admin_operation_logs"))

	id := l.ID()
	if id == "" {
		id = utils.GenerateUUID()
	}

	_, err := r.db.ExecContext(ctx, query,
		id, l.UserID(), l.Username(), l.Action(), l.TargetType(), l.TargetID(),
		l.Details(), l.IP(), l.UserAgent(), time.Now())

	return err
}

