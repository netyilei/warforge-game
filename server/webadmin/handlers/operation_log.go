// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义操作日志相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
)

// GetOperationLogs 获取操作日志列表
func GetOperationLogs(c *gin.Context) {
	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库连接未初始化",
			"data": nil,
		})
		return
	}

	var req models.OperationLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}

	result, err := models.OperationLog{}.List(db, req)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "获取日志失败: " + err.Error(),
			"data": nil,
		})
		return
	}

	if result.List == nil {
		result.List = []models.OperationLog{}
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"total": result.Total,
			"list":  result.List,
		},
	})
}
