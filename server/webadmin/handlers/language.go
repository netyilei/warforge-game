// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义语言管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
)

// GetLanguages 获取语言列表
func GetLanguages(c *gin.Context) {
	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库连接未初始化",
			"data": nil,
		})
		return
	}

	languages, err := models.Language{}.List(db)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 0,
			"msg":  "success",
			"data": gin.H{
				"languages": []interface{}{},
			},
		})
		return
	}

	if languages == nil {
		languages = []models.Language{}
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"languages": languages,
		},
	})
}

// CreateLanguageRequest 创建语言请求
type CreateLanguageRequest struct {
	Code       string `json:"code" binding:"required"`
	Name       string `json:"name" binding:"required"`
	NativeName string `json:"nativeName" binding:"required"`
	Icon       string `json:"icon"`
	SortOrder  int    `json:"sortOrder"`
}

// CreateLanguage 创建语言
func CreateLanguage(c *gin.Context) {
	var req CreateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "参数错误",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	lang := &models.Language{
		Code:       req.Code,
		Name:       req.Name,
		NativeName: req.NativeName,
		Status:     1,
		SortOrder:  req.SortOrder,
	}
	if req.Icon != "" {
		lang.Icon = &req.Icon
	}

	if err := lang.Create(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "创建失败: " + err.Error(),
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": lang,
	})
}

// UpdateLanguageRequest 更新语言请求
type UpdateLanguageRequest struct {
	Name       string `json:"name"`
	NativeName string `json:"nativeName"`
	Icon       string `json:"icon"`
	Status     int    `json:"status"`
	SortOrder  int    `json:"sortOrder"`
}

// UpdateLanguage 更新语言
func UpdateLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "缺少ID参数",
			"data": nil,
		})
		return
	}

	var req UpdateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "参数错误",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	lang := &models.Language{
		ID:         id,
		Name:       req.Name,
		NativeName: req.NativeName,
		Status:     req.Status,
		SortOrder:  req.SortOrder,
	}
	if req.Icon != "" {
		lang.Icon = &req.Icon
	}

	if err := lang.Update(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新失败: " + err.Error(),
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": lang,
	})
}

// DeleteLanguage 删除语言
func DeleteLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "缺少ID参数",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	lang := &models.Language{ID: id}
	if err := lang.Delete(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "删除失败: " + err.Error(),
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}

// SetDefaultLanguage 设置默认语言
func SetDefaultLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "缺少ID参数",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	var langModel models.Language
	if err := langModel.SetDefault(db, id); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "设置失败: " + err.Error(),
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}

// GetSupportedLanguages 获取支持的语言列表
func GetSupportedLanguages(c *gin.Context) {
	GetLanguages(c)
}

// SetSupportedLanguages 设置支持的语言
func SetSupportedLanguages(c *gin.Context) {
	var req struct {
		LanguageIDs []string `json:"languageIds" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "参数错误",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	query := `UPDATE languages SET status = 0`
	db.Exec(query)

	for _, id := range req.LanguageIDs {
		query = `UPDATE languages SET status = 1 WHERE id = $1`
		db.Exec(query, id)
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}
