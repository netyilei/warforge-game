// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义权限管理相关的 API 处理函数
// 权限表同时承担菜单管理功能，通过 type 字段区分类型
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPermissions 获取权限列表（扁平结构）
func GetPermissions(c *gin.Context) {
	db := database.MustGetDB()
	permissions, err := models.AdminPermission{}.ListAll(db)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	if permissions == nil {
		permissions = []models.AdminPermission{}
	}
	response.Success(c, gin.H{"list": permissions})
}

// GetPermissionTree 获取权限树形结构
func GetPermissionTree(c *gin.Context) {
	db := database.MustGetDB()
	permissions, err := models.AdminPermission{}.ListAll(db)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	tree := buildPermissionTree(permissions, nil)
	response.Success(c, gin.H{"tree": tree})
}

// GetPermission 获取单个权限详情
func GetPermission(c *gin.Context) {
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
	response.Success(c, permission)
}

// PermissionTreeNode 权限树节点
type PermissionTreeNode struct {
	ID         string               `json:"id"`
	Name       string               `json:"name"`
	Code       string               `json:"code"`
	Type       string               `json:"type"`
	Path       string               `json:"path"`
	Component  string               `json:"component"`
	Icon       string               `json:"icon"`
	Href       string               `json:"href"`
	ShowInMenu bool                 `json:"showInMenu"`
	SortOrder  int                  `json:"sortOrder"`
	Status     int                  `json:"status"`
	Children   []PermissionTreeNode `json:"children"`
}

// buildPermissionTree 构建权限树
func buildPermissionTree(permissions []models.AdminPermission, parentID *string) []PermissionTreeNode {
	var nodes []PermissionTreeNode
	for _, perm := range permissions {
		if (parentID == nil && perm.ParentID == nil) || (parentID != nil && perm.ParentID != nil && *perm.ParentID == *parentID) {
			node := PermissionTreeNode{
				ID:         perm.ID,
				Name:       perm.Name,
				Code:       perm.Code,
				Type:       perm.Type,
				ShowInMenu: perm.ShowInMenu,
				SortOrder:  perm.SortOrder,
				Status:     perm.Status,
			}
			if perm.Path != nil {
				node.Path = *perm.Path
			}
			if perm.Component != nil {
				node.Component = *perm.Component
			}
			if perm.Icon != nil {
				node.Icon = *perm.Icon
			}
			if perm.Href != nil {
				node.Href = *perm.Href
			}
			node.Children = buildPermissionTree(permissions, &perm.ID)
			if len(node.Children) == 0 {
				node.Children = nil
			}
			nodes = append(nodes, node)
		}
	}
	return nodes
}

// CreatePermissionRequest 创建权限请求
type CreatePermissionRequest struct {
	Name       string `json:"name" binding:"required"`
	Code       string `json:"code" binding:"required"`
	Type       string `json:"type" binding:"required"`
	ParentID   string `json:"parentId"`
	Path       string `json:"path"`
	Component  string `json:"component"`
	Icon       string `json:"icon"`
	Href       string `json:"href"`
	ShowInMenu bool   `json:"showInMenu"`
	SortOrder  int    `json:"sortOrder"`
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
	var path, component, icon, href *string
	if req.Path != "" {
		path = &req.Path
	}
	if req.Component != "" {
		component = &req.Component
	}
	if req.Icon != "" {
		icon = &req.Icon
	}
	if req.Href != "" {
		href = &req.Href
	}
	permission := &models.AdminPermission{
		ID:         uuid.New().String(),
		Name:       req.Name,
		Code:       req.Code,
		Type:       req.Type,
		ParentID:   parentID,
		Path:       path,
		Component:  component,
		Icon:       icon,
		Href:       href,
		ShowInMenu: req.ShowInMenu,
		SortOrder:  req.SortOrder,
		Status:     1,
	}
	if err := permission.Create(db); err != nil {
		response.Error(c, 500, "创建权限失败")
		return
	}
	response.Success(c, permission)
}

// UpdatePermissionRequest 更新权限请求
type UpdatePermissionRequest struct {
	Name       string `json:"name"`
	Code       string `json:"code"`
	Path       string `json:"path"`
	Component  string `json:"component"`
	Icon       string `json:"icon"`
	Href       string `json:"href"`
	ShowInMenu *bool  `json:"showInMenu"`
	SortOrder  *int   `json:"sortOrder"`
	Status     *int   `json:"status"`
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
	if req.Code != "" {
		existing, _ := models.AdminPermission{}.GetByCode(db, req.Code)
		if existing != nil && existing.ID != id {
			response.Error(c, 400, "权限代码已存在")
			return
		}
		permission.Code = req.Code
	}
	if req.Path != "" {
		permission.Path = &req.Path
	}
	if req.Component != "" {
		permission.Component = &req.Component
	}
	if req.Icon != "" {
		permission.Icon = &req.Icon
	}
	if req.Href != "" {
		permission.Href = &req.Href
	}
	if req.ShowInMenu != nil {
		permission.ShowInMenu = *req.ShowInMenu
	}
	if req.SortOrder != nil {
		permission.SortOrder = *req.SortOrder
	}
	if req.Status != nil {
		permission.Status = *req.Status
	}
	if err := permission.Update(db); err != nil {
		response.Error(c, 500, "更新权限失败")
		return
	}
	response.Success(c, permission)
}

// MovePermissionRequest 移动权限请求
type MovePermissionRequest struct {
	ParentID  string `json:"parentId"`
	SortOrder int    `json:"sortOrder"`
}

// MovePermission 移动权限位置
func MovePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req MovePermissionRequest
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
	if req.ParentID != "" {
		if req.ParentID == id {
			response.Error(c, 400, "父级不能是自己")
			return
		}
		parent, err := models.AdminPermission{}.FindByID(db, req.ParentID)
		if err != nil {
			response.Error(c, 400, "父级权限不存在")
			return
		}
		permission.ParentID = &parent.ID
	} else {
		permission.ParentID = nil
	}
	permission.SortOrder = req.SortOrder
	if err := permission.Update(db); err != nil {
		response.Error(c, 500, "移动权限失败")
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
	children, _ := models.AdminPermission{}.GetChildren(db, id)
	if len(children) > 0 {
		response.Error(c, 400, "存在子权限，无法删除")
		return
	}
	if err := permission.Delete(db); err != nil {
		response.Error(c, 500, "删除权限失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// BatchUpdateSortOrderRequest 批量更新排序请求
type BatchUpdateSortOrderRequest struct {
	Items []SortOrderItem `json:"items" binding:"required"`
}

// SortOrderItem 排序项
type SortOrderItem struct {
	ID        string `json:"id" binding:"required"`
	SortOrder int    `json:"sortOrder"`
}

// BatchUpdateSortOrder 批量更新排序
func BatchUpdateSortOrder(c *gin.Context) {
	var req BatchUpdateSortOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	for _, item := range req.Items {
		permission, err := models.AdminPermission{}.FindByID(db, item.ID)
		if err != nil {
			continue
		}
		permission.SortOrder = item.SortOrder
		permission.Update(db)
	}
	response.Success(c, gin.H{"success": true})
}
