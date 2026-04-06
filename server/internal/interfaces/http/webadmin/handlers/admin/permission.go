package admin

import (
	"warforge-server/database"
	adminsvc "warforge-server/internal/application/admin"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getAdminPermissionService() *adminsvc.AdminPermissionService {
	db := database.MustGetDB()
	permRepo := adminpersistence.NewPermissionRepository(db)
	return adminsvc.NewAdminPermissionService(permRepo)
}

func GetPermissions(c *gin.Context) {
	svc := getAdminPermissionService()
	permissions, err := svc.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	dtos := make([]*admindomain.AdminPermissionDTO, len(permissions))
	for i, p := range permissions {
		dtos[i] = p.ToDTO()
	}
	response.Success(c, gin.H{"list": dtos})
}

func GetPermissionTree(c *gin.Context) {
	svc := getAdminPermissionService()
	permissions, err := svc.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	dtos := make([]*admindomain.AdminPermissionDTO, len(permissions))
	for i, p := range permissions {
		dtos[i] = p.ToDTO()
	}
	tree := buildPermissionTree(dtos, "")
	response.Success(c, gin.H{"tree": tree})
}

func GetPermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	svc := getAdminPermissionService()
	permission, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	response.Success(c, permission.ToDTO())
}

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

func buildPermissionTree(permissions []*admindomain.AdminPermissionDTO, parentID string) []PermissionTreeNode {
	var nodes []PermissionTreeNode
	for _, perm := range permissions {
		if perm.ParentID == parentID {
			node := PermissionTreeNode{
				ID:         perm.ID,
				Name:       perm.Name,
				Code:       perm.Code,
				Type:       string(perm.Type),
				Path:       perm.Path,
				Component:  perm.Component,
				Icon:       perm.Icon,
				Href:       perm.Href,
				ShowInMenu: perm.ShowInMenu,
				SortOrder:  perm.SortOrder,
				Status:     int(perm.Status),
			}
			node.Children = buildPermissionTree(permissions, perm.ID)
			if len(node.Children) == 0 {
				node.Children = nil
			}
			nodes = append(nodes, node)
		}
	}
	return nodes
}

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

func CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	svc := getAdminPermissionService()
	existing, _ := svc.FindByCode(c.Request.Context(), req.Code)
	if existing != nil {
		response.Error(c, 400, "权限代码已存在")
		return
	}
	var parentID *string
	if req.ParentID != "" {
		parentID = &req.ParentID
	}
	perm := admindomain.NewAdminPermission(uuid.New().String(), req.Name, req.Code, admindomain.PermissionType(req.Type))
	if parentID != nil {
		perm.SetParentID(parentID)
	}
	if req.Path != "" {
		perm.SetPath(&req.Path)
	}
	if req.Component != "" {
		perm.SetComponent(&req.Component)
	}
	if req.Icon != "" {
		perm.SetIcon(&req.Icon)
	}
	if req.Href != "" {
		perm.SetHref(&req.Href)
	}
	perm.SetShowInMenu(req.ShowInMenu)
	perm.SetSortOrder(req.SortOrder)
	perm.SetStatus(admindomain.AdminPermissionStatusActive)

	if err := svc.CreateFromEntity(c.Request.Context(), perm); err != nil {
		response.Error(c, 500, "创建权限失败")
		return
	}
	response.Success(c, perm.ToDTO())
}

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
	svc := getAdminPermissionService()
	permission, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	if req.Name != "" {
		permission.SetName(req.Name)
	}
	if req.Code != "" {
		existing, _ := svc.FindByCode(c.Request.Context(), req.Code)
		if existing != nil && existing.ID() != id {
			response.Error(c, 400, "权限代码已存在")
			return
		}
		permission.SetCode(req.Code)
	}
	if req.Path != "" {
		permission.SetPath(&req.Path)
	}
	if req.Component != "" {
		permission.SetComponent(&req.Component)
	}
	if req.Icon != "" {
		permission.SetIcon(&req.Icon)
	}
	if req.Href != "" {
		permission.SetHref(&req.Href)
	}
	if req.ShowInMenu != nil {
		permission.SetShowInMenu(*req.ShowInMenu)
	}
	if req.SortOrder != nil {
		permission.SetSortOrder(*req.SortOrder)
	}
	if req.Status != nil {
		permission.SetStatus(admindomain.AdminPermissionStatus(*req.Status))
	}
	if err := svc.UpdateFromEntity(c.Request.Context(), permission); err != nil {
		response.Error(c, 500, "更新权限失败")
		return
	}
	response.Success(c, permission.ToDTO())
}

type MovePermissionRequest struct {
	ParentID  string `json:"parentId"`
	SortOrder int    `json:"sortOrder"`
}

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
	svc := getAdminPermissionService()
	permission, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	if req.ParentID != "" {
		if req.ParentID == id {
			response.Error(c, 400, "父级不能是自己")
			return
		}
		parent, err := svc.FindByID(c.Request.Context(), req.ParentID)
		if err != nil {
			response.Error(c, 400, "父级权限不存在")
			return
		}
		permission.SetParentID(&req.ParentID)
		_ = parent
	} else {
		permission.SetParentID(nil)
	}
	permission.SetSortOrder(req.SortOrder)
	if err := svc.UpdateFromEntity(c.Request.Context(), permission); err != nil {
		response.Error(c, 500, "移动权限失败")
		return
	}
	response.Success(c, permission.ToDTO())
}

func DeletePermission(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	svc := getAdminPermissionService()
	permission, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "权限不存在")
		return
	}
	children, _ := svc.GetByParentID(c.Request.Context(), id)
	if len(children) > 0 {
		response.Error(c, 400, "存在子权限，无法删除")
		return
	}
	_ = permission
	if err := svc.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "删除权限失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

type BatchUpdateSortOrderRequest struct {
	Items []SortOrderItem `json:"items" binding:"required"`
}

type SortOrderItem struct {
	ID        string `json:"id" binding:"required"`
	SortOrder int    `json:"sortOrder"`
}

func BatchUpdateSortOrder(c *gin.Context) {
	var req BatchUpdateSortOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	svc := getAdminPermissionService()
	for _, item := range req.Items {
		permission, err := svc.FindByID(c.Request.Context(), item.ID)
		if err != nil {
			continue
		}
		permission.SetSortOrder(item.SortOrder)
		svc.UpdateFromEntity(c.Request.Context(), permission)
	}
	response.Success(c, gin.H{"success": true})
}
