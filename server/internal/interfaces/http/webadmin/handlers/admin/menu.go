package admin

import (
	admindomain "warforge-server/internal/domain/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

func GetMenus(c *gin.Context) {
	svc := getAdminPermissionService()
	permissions, err := svc.ListActive(c.Request.Context())
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
