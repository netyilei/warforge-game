package admin

import (
	"warforge-server/internal/domain/shared"
)

var (
	ErrOperationLogNotFound = shared.NewDomainError("operation_log_not_found", "操作日志不存在")
)

type OperationLog struct {
	shared.BaseEntity
	userID     *string
	username   string
	action     string
	targetType string
	targetID   string
	details    string
	ip         string
	userAgent  string
}

func NewOperationLog(id, username, action string) *OperationLog {
	return &OperationLog{
		BaseEntity: shared.NewBaseEntity(id),
		username:   username,
		action:     action,
	}
}

func (l *OperationLog) UserID() *string     { return l.userID }
func (l *OperationLog) Username() string    { return l.username }
func (l *OperationLog) Action() string      { return l.action }
func (l *OperationLog) TargetType() string  { return l.targetType }
func (l *OperationLog) TargetID() string    { return l.targetID }
func (l *OperationLog) Details() string     { return l.details }
func (l *OperationLog) IP() string          { return l.ip }
func (l *OperationLog) UserAgent() string   { return l.userAgent }

func (l *OperationLog) SetUserID(userID *string)     { l.userID = userID }
func (l *OperationLog) SetUsername(username string)  { l.username = username }
func (l *OperationLog) SetAction(action string)      { l.action = action }
func (l *OperationLog) SetTargetType(t string)       { l.targetType = t }
func (l *OperationLog) SetTargetID(id string)        { l.targetID = id }
func (l *OperationLog) SetDetails(details string)    { l.details = details }
func (l *OperationLog) SetIP(ip string)              { l.ip = ip }
func (l *OperationLog) SetUserAgent(ua string)       { l.userAgent = ua }

type OperationLogDTO struct {
	ID         string  `json:"id"`
	UserID     *string `json:"userId"`
	Username   string  `json:"username"`
	Action     string  `json:"action"`
	TargetType string  `json:"targetType"`
	TargetID   string  `json:"targetId"`
	Details    string  `json:"details"`
	IP         string  `json:"ip"`
	UserAgent  string  `json:"userAgent"`
	CreatedAt  string  `json:"createdAt"`
}

func (l *OperationLog) ToDTO() *OperationLogDTO {
	var createdAt string
	if !l.CreatedAt().IsZero() {
		createdAt = l.CreatedAt().Format("2006-01-02T15:04:05Z07:00")
	}
	return &OperationLogDTO{
		ID:         l.ID(),
		UserID:     l.userID,
		Username:   l.username,
		Action:     l.action,
		TargetType: l.targetType,
		TargetID:   l.targetID,
		Details:    l.details,
		IP:         l.ip,
		UserAgent:  l.userAgent,
		CreatedAt:  createdAt,
	}
}

type OperationLogFilter struct {
	Username   string
	Action     string
	TargetType string
	StartTime  string
	EndTime    string
	Page       int
	PageSize   int
}
