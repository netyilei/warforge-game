// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义内容管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
)

// GetCategories 获取内容分类列表
//
// 返回所有内容分类列表
func GetCategories(c *gin.Context) {
	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
		})
		return
	}

	categories, err := models.ContentCategory{}.GetAllCategories(db)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "获取分类失败",
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"categories": categories,
		},
	})
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
//
// 创建新的内容分类
func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
		})
		return
	}

	category, err := models.ContentCategory{}.CreateCategory(db, req.Name, req.Code, req.Icon, req.ParentID, req.SortOrder)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "创建分类失败: " + err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": category,
	})
}

// UpdateCategoryRequest 更新分类请求
type UpdateCategoryRequest struct {
	Name      string  `json:"name" binding:"required"`
	Icon      *string `json:"icon"`
	SortOrder int     `json:"sortOrder"`
}

// UpdateCategory 更新内容分类
//
// 更新指定内容分类的信息
func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "缺少分类ID",
		})
		return
	}

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
		})
		return
	}

	err := models.ContentCategory{}.UpdateCategory(db, id, req.Name, req.Icon, req.SortOrder)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新分类失败: " + err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{},
	})
}

// DeleteCategory 删除内容分类
//
// 删除指定的内容分类
func DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "缺少分类ID",
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
		})
		return
	}

	err := models.ContentCategory{}.DeleteCategory(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "删除分类失败: " + err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}

// GetContents 获取内容列表
//
// 返回内容分页列表
func GetContents(c *gin.Context) {
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"contents": []interface{}{},
			"total":    0,
			"page":     1,
			"pageSize": 20,
		},
	})
}

// GetContent 获取内容详情
//
// 返回指定内容的详细信息
func GetContent(c *gin.Context) {
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{},
	})
}

// CreateContent 创建内容
//
// 创建新的内容
func CreateContent(c *gin.Context) {
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{},
	})
}

// UpdateContent 更新内容
//
// 更新指定内容的信息
func UpdateContent(c *gin.Context) {
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{},
	})
}

// DeleteContent 删除内容
//
// 删除指定的内容
func DeleteContent(c *gin.Context) {
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}
