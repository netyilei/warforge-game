// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义角色管理相关的 API 处理函数
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetRoles 获取角色列表
func GetRoles(c *gin.Context) {
	db := database.MustGetDB()
	roles, err := models.AdminRole{}.ListAll(db)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{"list": roles})
}

// GetRole 获取单个角色
func GetRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	role, err := models.AdminRole{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	response.Success(c, role)
}

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Status      int    `json:"status"`
}

// CreateRole 创建角色
func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	db := database.MustGetDB()
	existing, _ := models.AdminRole{}.GetByCode(db, req.Code)
	if existing != nil {
		response.Error(c, 400, "角色代码已存在")
		return
	}
	role := &models.AdminRole{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      req.Status,
	}
	if role.Status == 0 {
		role.Status = 1
	}
	if err := role.Create(db); err != nil {
		response.Error(c, 500, "创建角色失败")
		return
	}
	response.Success(c, role)
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      int    `json:"status"`
}

// UpdateRole 更新角色
func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	db := database.MustGetDB()
	role, err := models.AdminRole{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	if req.Name != "" {
		role.Name = req.Name
	}
	role.Description = req.Description
	role.Status = req.Status
	if err := role.Update(db); err != nil {
		response.Error(c, 500, "更新角色失败")
		return
	}
	response.Success(c, role)
}

// DeleteRole 删除角色
func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	role, err := models.AdminRole{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	if err := role.Delete(db); err != nil {
		response.Error(c, 500, "删除角色失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetRolePermissions 获取角色权限
func GetRolePermissions(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	permissions, err := models.AdminRole{}.GetPermissions(db, id)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{"permissions": permissions})
}

// UpdateRolePermissionsRequest 更新角色权限请求
type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds" binding:"required"`
}

// UpdateRolePermissions 更新角色权限
func UpdateRolePermissions(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdateRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	db := database.MustGetDB()
	if err := (&models.AdminRole{}).UpdatePermissions(db, id, req.PermissionIDs); err != nil {
		response.Error(c, 500, "更新角色权限失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
