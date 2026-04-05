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
	Name        string  `json:"name" binding:"required"`
	Code        string  `json:"code" binding:"required"`
	Icon        *string `json:"icon"`
	ParentID    *string `json:"parentId"`
	ContentType string  `json:"contentType"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sortOrder"`
	Status      int     `json:"status"`
}

// CreateCategory 创建内容分类
func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.ContentType == "" {
		req.ContentType = "html"
	}
	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	category, err := models.ContentCategory{}.CreateCategory(db, req.Name, req.Code, req.Icon, req.ParentID, req.ContentType, req.Description, req.SortOrder, req.Status)
	if err != nil {
		if err == models.ErrCategoryCodeExists {
			response.Error(c, 400, "分类标识已存在，请使用其他标识")
			return
		}
		response.Error(c, 500, "创建分类失败: "+err.Error())
		return
	}
	response.Success(c, category)
}

// UpdateCategoryRequest 更新分类请求
type UpdateCategoryRequest struct {
	Name        string  `json:"name" binding:"required"`
	Icon        *string `json:"icon"`
	ContentType string  `json:"contentType"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sortOrder"`
	Status      int     `json:"status"`
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

	if req.ContentType == "" {
		req.ContentType = "html"
	}

	db := database.MustGetDB()
	err := models.ContentCategory{}.UpdateCategory(db, id, req.Name, req.Icon, req.ContentType, req.Description, req.SortOrder, req.Status)
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
	db := database.MustGetDB()
	var req models.ContentListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}

	result, err := models.Content{}.List(db, req)
	if err != nil {
		response.Error(c, 500, "获取内容列表失败: "+err.Error())
		return
	}

	if result.List == nil {
		result.List = []models.ContentWithTranslations{}
	}
	response.Success(c, result)
}

// GetContent 获取内容详情
func GetContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	db := database.MustGetDB()
	content, err := models.Content{}.GetByID(db, id)
	if err != nil {
		response.Error(c, 500, "获取内容详情失败: "+err.Error())
		return
	}
	response.Success(c, content)
}

// CreateContentRequest 创建内容请求
type CreateContentRequest struct {
	CategoryID   string                         `json:"categoryId" binding:"required"`
	AuthorID     string                         `json:"authorId"`
	CoverImage   *string                        `json:"coverImage"`
	IsMarquee    bool                           `json:"isMarquee"`
	IsPopup      bool                           `json:"isPopup"`
	StartTime    *string                        `json:"startTime"`
	EndTime      *string                        `json:"endTime"`
	SortOrder    int                            `json:"sortOrder"`
	Status       int                            `json:"status"`
	Translations []models.ContentTranslationDTO `json:"translations" binding:"required"`
}

// CreateContent 创建内容
func CreateContent(c *gin.Context) {
	var req CreateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	content, err := models.Content{}.Create(
		db, req.CategoryID, req.AuthorID, req.CoverImage,
		req.IsMarquee, req.IsPopup, nil, nil,
		req.SortOrder, req.Status, req.Translations,
	)
	if err != nil {
		response.Error(c, 500, "创建内容失败: "+err.Error())
		return
	}
	response.Success(c, content)
}

// UpdateContentRequest 更新内容请求
type UpdateContentRequest struct {
	CategoryID   string                         `json:"categoryId" binding:"required"`
	CoverImage   *string                        `json:"coverImage"`
	IsMarquee    bool                           `json:"isMarquee"`
	IsPopup      bool                           `json:"isPopup"`
	StartTime    *string                        `json:"startTime"`
	EndTime      *string                        `json:"endTime"`
	SortOrder    int                            `json:"sortOrder"`
	Status       int                            `json:"status"`
	Translations []models.ContentTranslationDTO `json:"translations"`
}

// UpdateContent 更新内容
func UpdateContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	var req UpdateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	err := models.Content{}.Update(
		db, id, req.CategoryID, req.CoverImage,
		req.IsMarquee, req.IsPopup, nil, nil,
		req.SortOrder, req.Status,
	)
	if err != nil {
		response.Error(c, 500, "更新内容失败: "+err.Error())
		return
	}

	if req.Translations != nil {
		err = models.Content{}.UpdateTranslations(db, id, req.Translations)
		if err != nil {
			response.Error(c, 500, "更新翻译失败: "+err.Error())
			return
		}
	}

	content, err := models.Content{}.GetByID(db, id)
	if err != nil {
		response.Error(c, 500, "获取内容详情失败: "+err.Error())
		return
	}
	response.Success(c, content)
}

// DeleteContent 删除内容
func DeleteContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	db := database.MustGetDB()
	err := models.Content{}.Delete(db, id)
	if err != nil {
		response.Error(c, 500, "删除内容失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
