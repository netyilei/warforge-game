package handlers

import (
	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetRoles 获取角色列表
//
// 返回所有角色列表
func GetRoles(c *gin.Context) {
	db := database.GetDB()
	roles, err := models.AdminRole{}.ListAll(db)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"list": roles,
		},
	})
}

// GetRole 获取单个角色
//
// 返回指定角色的详细信息
func GetRole(c *gin.Context) {
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
	role, err := models.AdminRole{}.GetByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "角色不存在",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": role,
	})
}

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Status      int    `json:"status"`
}

// CreateRole 创建角色
//
// 创建新的角色
func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()

	existing, _ := models.AdminRole{}.GetByCode(db, req.Code)
	if existing != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "角色代码已存在",
			"data": nil,
		})
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
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "创建角色失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": role,
	})
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      int    `json:"status"`
}

// UpdateRole 更新角色
//
// 更新指定角色的信息
func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
			"data": nil,
		})
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	role, err := models.AdminRole{}.GetByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "角色不存在",
			"data": nil,
		})
		return
	}

	if req.Name != "" {
		role.Name = req.Name
	}
	role.Description = req.Description
	role.Status = req.Status

	if err := role.Update(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新角色失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": role,
	})
}

// DeleteRole 删除角色
//
// 删除指定的角色
func DeleteRole(c *gin.Context) {
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
	role, err := models.AdminRole{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "角色不存在",
			"data": nil,
		})
		return
	}

	if err := role.Delete(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "删除角色失败",
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

// GetRolePermissions 获取角色权限
//
// 返回指定角色的权限列表
func GetRolePermissions(c *gin.Context) {
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
	permissions, err := models.AdminRole{}.GetPermissions(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"permissions": permissions,
		},
	})
}

// UpdateRolePermissionsRequest 更新角色权限请求
type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds" binding:"required"`
}

// UpdateRolePermissions 更新角色权限
//
// 更新指定角色的权限列表
func UpdateRolePermissions(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
			"data": nil,
		})
		return
	}

	var req UpdateRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	if err := (&models.AdminRole{}).UpdatePermissions(db, id, req.PermissionIDs); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新角色权限失败",
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
