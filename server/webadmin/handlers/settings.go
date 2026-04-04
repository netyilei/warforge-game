// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义系统设置相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetSettings 获取系统设置
func GetSettings(c *gin.Context) {
	db := database.MustGetDB()
	settings, err := models.AdminSetting{}.GetAll(db)
	if err != nil {
		response.Success(c, gin.H{"settings": []interface{}{}})
		return
	}
	response.Success(c, gin.H{"settings": settings})
}

// UpdateSettingsRequest 更新设置请求
type UpdateSettingsRequest struct {
	Settings []struct {
		Key         string `json:"key" binding:"required"`
		Value       string `json:"value" binding:"required"`
		Description string `json:"description"`
	} `json:"settings" binding:"required"`
}

// UpdateSettings 更新系统设置
func UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request")
		return
	}
	db := database.MustGetDB()
	var settings []models.AdminSetting
	for _, s := range req.Settings {
		settings = append(settings, models.AdminSetting{
			Key:         s.Key,
			Value:       s.Value,
			Description: s.Description,
		})
	}
	if err := (&models.AdminSetting{}).BatchSave(db, settings); err != nil {
		response.DBError(c, "保存设置失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
