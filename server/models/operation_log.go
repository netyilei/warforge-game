// Package models 提供数据模型定义
//
// 本文件定义操作日志相关的数据模型
package models

import (
	"database/sql"
	"fmt"
	"time"

	"warforge-server/config"
)

// OperationLog 操作日志模型
type OperationLog struct {
	ID         string    `json:"id"`
	UserID     *string   `json:"userId"`
	Username   string    `json:"username"`
	Action     string    `json:"action"`
	TargetType string    `json:"targetType"`
	TargetID   string    `json:"targetId"`
	Details    string    `json:"details"`
	IP         string    `json:"ip"`
	UserAgent  string    `json:"userAgent"`
	CreatedAt  time.Time `json:"createdAt"`
}

// OperationLogListRequest 列表请求参数
type OperationLogListRequest struct {
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
	Username   string `json:"username"`
	Action     string `json:"action"`
	TargetType string `json:"targetType"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
}

// OperationLogListResponse 列表响应
type OperationLogListResponse struct {
	Total int            `json:"total"`
	List  []OperationLog `json:"list"`
}

// List 获取操作日志列表
func (OperationLog) List(db *sql.DB, req OperationLogListRequest) (*OperationLogListResponse, error) {
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	offset := (req.Page - 1) * req.PageSize

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM %s
		WHERE ($1 = '' OR username LIKE '%%' || $1 || '%%')
		AND ($2 = '' OR action = $2)
		AND ($3 = '' OR target_type = $3)
		AND ($4 = '' OR created_at >= $4::timestamp)
		AND ($5 = '' OR created_at <= $5::timestamp)
	`, config.GetTableName("admin_operation_logs"))
	var total int
	err := db.QueryRow(countQuery, req.Username, req.Action, req.TargetType, req.StartTime, req.EndTime).Scan(&total)
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
	rows, err := db.Query(query, req.Username, req.Action, req.TargetType, req.StartTime, req.EndTime, req.PageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []OperationLog
	for rows.Next() {
		var log OperationLog
		var userID, targetType, targetID, details, userAgent sql.NullString
		err := rows.Scan(
			&log.ID, &userID, &log.Username, &log.Action, &targetType, &targetID, &details,
			&log.IP, &userAgent, &log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if userID.Valid {
			log.UserID = &userID.String
		}
		if targetType.Valid {
			log.TargetType = targetType.String
		}
		if targetID.Valid {
			log.TargetID = targetID.String
		}
		if details.Valid {
			log.Details = details.String
		}
		if userAgent.Valid {
			log.UserAgent = userAgent.String
		}
		logs = append(logs, log)
	}

	return &OperationLogListResponse{
		Total: total,
		List:  logs,
	}, nil
}

// Create 创建操作日志
func (l *OperationLog) Create(db *sql.DB) error {
	query := fmt.Sprintf(`
		INSERT INTO %s (user_id, username, action, target_type, target_id, details, ip, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`, config.GetTableName("admin_operation_logs"))
	return db.QueryRow(query, l.UserID, l.Username, l.Action, l.TargetType, l.TargetID, l.Details, l.IP, l.UserAgent).Scan(
		&l.ID, &l.CreatedAt,
	)
}
