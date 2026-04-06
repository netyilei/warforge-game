package admin

import (
	"warforge-server/database"
	adminsvc "warforge-server/internal/application/admin"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

func getAdminRoleService() *adminsvc.AdminRoleService {
	db := database.MustGetDB()
	roleRepo := adminpersistence.NewRoleRepository(db)
	return adminsvc.NewAdminRoleService(roleRepo)
}

func GetRoles(c *gin.Context) {
	svc := getAdminRoleService()
	roles, err := svc.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	dtos := make([]*admindomain.AdminRoleDTO, len(roles))
	for i, r := range roles {
		dtos[i] = r.ToDTO()
	}
	response.Success(c, gin.H{"list": dtos})
}

func GetRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	svc := getAdminRoleService()
	role, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	response.Success(c, role.ToDTO())
}

type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Status      int    `json:"status"`
	SortOrder   int    `json:"sortOrder"`
}

func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	svc := getAdminRoleService()
	if req.Status == 0 {
		req.Status = 1
	}
	role, err := svc.Create(c.Request.Context(), req.Name, req.Code, req.Description, req.Status, req.SortOrder)
	if err != nil {
		if err == admindomain.ErrRoleCodeExists {
			response.Error(c, 400, "角色代码已存在")
			return
		}
		response.Error(c, 500, "创建角色失败")
		return
	}
	response.Success(c, role.ToDTO())
}

type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      int    `json:"status"`
	SortOrder   int    `json:"sortOrder"`
}

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
	svc := getAdminRoleService()
	role, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	name := role.Name()
	description := role.Description()
	status := int(role.Status())
	sortOrder := role.SortOrder()
	if req.Name != "" {
		name = req.Name
	}
	if req.Description != "" {
		description = req.Description
	}
	if req.Status != 0 {
		status = req.Status
	}
	if req.SortOrder != 0 {
		sortOrder = req.SortOrder
	}
	err = svc.Update(c.Request.Context(), id, name, description, status, sortOrder)
	if err != nil {
		response.Error(c, 500, "更新角色失败")
		return
	}
	response.Success(c, role.ToDTO())
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	svc := getAdminRoleService()
	_, err := svc.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "角色不存在")
		return
	}
	if err := svc.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "删除角色失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetRolePermissions(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	svc := getAdminRoleService()
	permissionIDs, err := svc.GetPermissions(c.Request.Context(), id)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{"permissions": permissionIDs})
}

type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds" binding:"required"`
}

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
	svc := getAdminRoleService()
	if err := svc.SetPermissions(c.Request.Context(), id, req.PermissionIDs); err != nil {
		response.Error(c, 500, "更新角色权限失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
