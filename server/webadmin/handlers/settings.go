// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义系统设置相关的 API 处理函数
package handlers

import (
	"warforge-server/database"

	"github.com/gin-gonic/gin"
)

// GetSettings 获取系统设置
//
// 返回所有系统设置项
func GetSettings(c *gin.Context) {
	db := database.GetDB()

	query := `
		SELECT key, value, description
	 FROM admin_settings
	 ORDER BY key
	`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 0,
			"msg":  "success",
			"data": gin.H{
				"settings": []interface{}{},
			},
		})
		return
	}
	defer rows.Close()

	type Setting struct {
		Key         string `json:"key"`
		Value       string `json:"value"`
		Description string `json:"description"`
	}

	settings := []Setting{}
	for rows.Next() {
		var s Setting
		if err := rows.Scan(&s.Key, &s.Value, &s.Description); err != nil {
			continue
		}
		settings = append(settings, s)
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"settings": settings,
		},
	})
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
//
// 更新所有设置项
func UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Invalid request",
			"data": nil,
		})
		return
	}

	db := database.GetDB()

	for _, s := range req.Settings {
		query := `
			INSERT INTO admin_settings (key, value, description, updated_at)
			VALUES ($1, $2, $3, NOW())
		 ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_at = NOW()
		`
		db.Exec(query, s.Key, s.Value, s.Description)
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"success": true,
		},
	})
}
