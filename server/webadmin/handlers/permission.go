package handlers

import (
	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPermissions 获取权限列表
//
// 返回所有权限列表
func GetPermissions(c *gin.Context) {
	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库连接未初始化",
			"data": nil,
		})
		return
	}

	permissions, err := models.AdminPermission{}.List(db)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误: " + err.Error(),
			"data": nil,
		})
		return
	}

	if permissions == nil {
		permissions = []models.AdminPermission{}
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"list": permissions,
		},
	})
}

// CreatePermissionRequest 创建权限请求
type CreatePermissionRequest struct {
	Name     string `json:"name" binding:"required"`
	Code     string `json:"code" binding:"required"`
	Type     string `json:"type"`
	ParentID string `json:"parentId"`
}

// CreatePermission 创建权限
//
// 创建新的权限项
func CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()

	existing, _ := models.AdminPermission{}.GetByCode(db, req.Code)
	if existing != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "权限代码已存在",
			"data": nil,
		})
		return
	}

	var parentID *string
	if req.ParentID != "" {
		parentID = &req.ParentID
	}

	permission := &models.AdminPermission{
		ID:       uuid.New().String(),
		Name:     req.Name,
		Code:     req.Code,
		Type:     req.Type,
		ParentID: parentID,
	}

	if err := permission.Create(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "创建权限失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": permission,
	})
}

// UpdatePermissionRequest 更新权限请求
type UpdatePermissionRequest struct {
	Name string `json:"name"`
}

// UpdatePermission 更新权限
//
// 更新指定权限的信息
func UpdatePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
			"data": nil,
		})
		return
	}

	var req UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	permission, err := models.AdminPermission{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "权限不存在",
			"data": nil,
		})
		return
	}

	if req.Name != "" {
		permission.Name = req.Name
	}

	if err := permission.Update(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新权限失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": permission,
	})
}

// DeletePermission 删除权限
//
// 删除指定的权限
func DeletePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	permission, err := models.AdminPermission{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "权限不存在",
			"data": nil,
		})
		return
	}

	if err := permission.Delete(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "删除权限失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"success": true,
		},
	})
}
