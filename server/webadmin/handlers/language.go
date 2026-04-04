// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义语言管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetLanguages 获取语言列表
func GetLanguages(c *gin.Context) {
	db := database.MustGetDB()
	languages, err := models.Language{}.List(db)
	if err != nil {
		response.Success(c, gin.H{"languages": []interface{}{}})
		return
	}
	if languages == nil {
		languages = []models.Language{}
	}
	response.Success(c, gin.H{"languages": languages})
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
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
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
		response.Error(c, 500, "创建失败: "+err.Error())
		return
	}
	response.Success(c, lang)
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
		response.Error(c, 400, "缺少ID参数")
		return
	}
	var req UpdateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
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
		response.Error(c, 500, "更新失败: "+err.Error())
		return
	}
	response.Success(c, lang)
}

// DeleteLanguage 删除语言
func DeleteLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少ID参数")
		return
	}
	db := database.MustGetDB()
	lang := &models.Language{ID: id}
	if err := lang.Delete(db); err != nil {
		response.Error(c, 500, "删除失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// SetDefaultLanguage 设置默认语言
func SetDefaultLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少ID参数")
		return
	}
	db := database.MustGetDB()
	var langModel models.Language
	if err := langModel.SetDefault(db, id); err != nil {
		response.Error(c, 500, "设置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetSupportedLanguages 获取支持的语言列表
func GetSupportedLanguages(c *gin.Context) {
	GetLanguages(c)
}

// SetSupportedLanguagesRequest 设置支持语言请求
type SetSupportedLanguagesRequest struct {
	LanguageIDs []string `json:"languageIds" binding:"required"`
}

// SetSupportedLanguages 设置支持的语言
func SetSupportedLanguages(c *gin.Context) {
	var req SetSupportedLanguagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	if err := (&models.Language{}).SetSupported(db, req.LanguageIDs); err != nil {
		response.Error(c, 500, "设置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
