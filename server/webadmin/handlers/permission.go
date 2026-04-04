// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义权限管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPermissions 获取权限列表
func GetPermissions(c *gin.Context) {
	db := database.MustGetDB()
	permissions, err := models.AdminPermission{}.List(db)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	if permissions == nil {
		permissions = []models.AdminPermission{}
	}
	response.Success(c, gin.H{"list": permissions})
}

// CreatePermissionRequest 创建权限请求
type CreatePermissionRequest struct {
	Name     string `json:"name" binding:"required"`
	Code     string `json:"code" binding:"required"`
	Type     string `json:"type"`
	ParentID string `json:"parentId"`
}

// CreatePermission 创建权限
func CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	existing, _ := models.AdminPermission{}.GetByCode(db, req.Code)
	if existing != nil {
		response.Error(c, 400, "权限代码已存在")
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
		response.Error(c, 500, "创建权限失败")
		return
	}
	response.Success(c, permission)
}

// UpdatePermissionRequest 更新权限请求
type UpdatePermissionRequest struct {
	Name string `json:"name"`
}

// UpdatePermission 更新权限
func UpdatePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	permission, err := models.AdminPermission{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	if req.Name != "" {
		permission.Name = req.Name
	}
	if err := permission.Update(db); err != nil {
		response.Error(c, 500, "更新权限失败")
		return
	}
	response.Success(c, permission)
}

// DeletePermission 删除权限
func DeletePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	permission, err := models.AdminPermission{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	if err := permission.Delete(db); err != nil {
		response.Error(c, 500, "删除权限失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
