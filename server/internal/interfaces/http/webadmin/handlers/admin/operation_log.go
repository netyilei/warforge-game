package admin

import (
	"warforge-server/database"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

type OperationLogListRequest struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"pageSize"`
	Username   string `form:"username"`
	Action     string `form:"action"`
	TargetType string `form:"targetType"`
	StartTime  string `form:"startTime"`
	EndTime    string `form:"endTime"`
}

func GetOperationLogs(c *gin.Context) {
	db := database.MustGetDB()
	var req OperationLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}

	repo := adminpersistence.NewOperationLogRepository(db)
	filter := admindomain.OperationLogFilter{
		Page:       req.Page,
		PageSize:   req.PageSize,
		Username:   req.Username,
		Action:     req.Action,
		TargetType: req.TargetType,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
	}

	result, err := repo.List(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, 500, "获取日志失败: "+err.Error())
		return
	}

	dtos := make([]*admindomain.OperationLogDTO, len(result.Items))
	for i, log := range result.Items {
		dtos[i] = log.ToDTO()
	}

	response.Success(c, gin.H{
		"total": result.Total,
		"list":  dtos,
	})
}
