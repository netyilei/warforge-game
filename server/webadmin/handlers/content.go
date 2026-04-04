// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义内容管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetCategories 获取内容分类列表
func GetCategories(c *gin.Context) {
	db := database.MustGetDB()
	categories, err := models.ContentCategory{}.GetAllCategories(db)
	if err != nil {
		response.DBError(c, "获取分类失败")
		return
	}
	response.Success(c, gin.H{"categories": categories})
}

// CreateCategoryRequest 创建分类请求
type CreateCategoryRequest struct {
	Name      string  `json:"name" binding:"required"`
	Code      string  `json:"code" binding:"required"`
	Icon      *string `json:"icon"`
	ParentID  *string `json:"parentId"`
	SortOrder int     `json:"sortOrder"`
}

// CreateCategory 创建内容分类
func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	category, err := models.ContentCategory{}.CreateCategory(db, req.Name, req.Code, req.Icon, req.ParentID, req.SortOrder)
	if err != nil {
		response.Error(c, 500, "创建分类失败: "+err.Error())
		return
	}
	response.Success(c, category)
}

// UpdateCategoryRequest 更新分类请求
type UpdateCategoryRequest struct {
	Name      string  `json:"name" binding:"required"`
	Icon      *string `json:"icon"`
	SortOrder int     `json:"sortOrder"`
}

// UpdateCategory 更新内容分类
func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分类ID")
		return
	}
	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	err := models.ContentCategory{}.UpdateCategory(db, id, req.Name, req.Icon, req.SortOrder)
	if err != nil {
		response.Error(c, 500, "更新分类失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

// DeleteCategory 删除内容分类
func DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分类ID")
		return
	}
	db := database.MustGetDB()
	err := models.ContentCategory{}.DeleteCategory(db, id)
	if err != nil {
		response.Error(c, 500, "删除分类失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetContents 获取内容列表
func GetContents(c *gin.Context) {
	response.Success(c, gin.H{
		"contents": []interface{}{},
		"total":    0,
		"page":     1,
		"pageSize": 20,
	})
}

// GetContent 获取内容详情
func GetContent(c *gin.Context) {
	response.Success(c, gin.H{})
}

// CreateContent 创建内容
func CreateContent(c *gin.Context) {
	response.Success(c, gin.H{})
}

// UpdateContent 更新内容
func UpdateContent(c *gin.Context) {
	response.Success(c, gin.H{})
}

// DeleteContent 删除内容
func DeleteContent(c *gin.Context) {
	response.Success(c, gin.H{"success": true})
}
