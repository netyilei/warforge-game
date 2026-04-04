// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义操作日志相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetOperationLogs 获取操作日志列表
func GetOperationLogs(c *gin.Context) {
	db := database.MustGetDB()
	var req models.OperationLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}
	result, err := models.OperationLog{}.List(db, req)
	if err != nil {
		response.Error(c, 500, "获取日志失败: "+err.Error())
		return
	}
	if result.List == nil {
		result.List = []models.OperationLog{}
	}
	response.Success(c, gin.H{
		"total": result.Total,
		"list":  result.List,
	})
}
