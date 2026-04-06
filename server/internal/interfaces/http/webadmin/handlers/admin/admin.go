package admin

import (
	"context"
	"strconv"

	"warforge-server/database"
	admindomain "warforge-server/internal/domain/admin"
	adminsvc "warforge-server/internal/application/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func getAdminUserService() *adminsvc.AdminUserService {
	db := database.MustGetDB()
	userRepo := adminpersistence.NewUserRepository(db)
	return adminsvc.NewAdminUserService(userRepo)
}

func GetAdmins(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		if _, err := strconv.Atoi(p); err == nil {
			page, _ = strconv.Atoi(p)
		}
	}
	if ps := c.Query("pageSize"); ps != "" {
		if _, err := strconv.Atoi(ps); err == nil {
			pageSize, _ = strconv.Atoi(ps)
		}
	}

	svc := getAdminUserService()
	filter := admindomain.AdminUserFilter{
		Page:     page,
		PageSize: pageSize,
	}
	result, err := svc.List(context.Background(), filter)
	if err != nil {
		response.DBError(c, "查询管理员失败")
		return
	}

	dtos := make([]*admindomain.AdminUserDTO, len(result.Items))
	for i, u := range result.Items {
		dtos[i] = u.ToDTO()
	}

	response.Success(c, gin.H{
		"list":     dtos,
		"total":    result.Total,
		"page":     result.Page,
		"pageSize": result.PageSize,
	})
}

func GetAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}

	svc := getAdminUserService()
	user, err := svc.FindByID(context.Background(), id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}
	response.Success(c, user.ToDTO())
}

type CreateAdminRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Status   int    `json:"status"`
}

func CreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	svc := getAdminUserService()
	exists, _ := svc.ExistsByUsername(context.Background(), req.Username)
	if exists {
		response.Error(c, 400, "用户名已存在")
		return
	}

	if req.Status == 0 {
		req.Status = 1
	}

	user, err := svc.Create(context.Background(), req.Username, req.Password, req.Nickname, req.Email, req.Phone, "", req.Status, nil)
	if err != nil {
		response.Error(c, 500, "创建管理员失败")
		return
	}
	response.Success(c, user.ToDTO())
}

type UpdateAdminRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Status   int    `json:"status"`
}

func UpdateAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	svc := getAdminUserService()
	user, err := svc.FindByID(context.Background(), id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}

	nickname := user.Nickname()
	email := user.Email()
	phone := user.Phone()
	status := int(user.Status())

	if req.Nickname != "" {
		nickname = req.Nickname
	}
	if req.Email != "" {
		email = req.Email
	}
	if req.Phone != "" {
		phone = req.Phone
	}
	if req.Status != 0 {
		status = req.Status
	}

	_, err = svc.Update(context.Background(), id, nickname, email, phone, user.Avatar(), status)
	if err != nil {
		response.Error(c, 500, "更新管理员失败")
		return
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			response.Error(c, 500, "密码加密失败")
			return
		}
		svc.UpdatePassword(context.Background(), id, string(hashedPassword))
	}

	response.Success(c, user.ToDTO())
}

func DeleteAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	userID, _ := c.Get("userID")
	if id == userID.(string) {
		response.Error(c, 400, "不能删除自己")
		return
	}

	svc := getAdminUserService()
	_, err := svc.FindByID(context.Background(), id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}
	if err := svc.Delete(context.Background(), id); err != nil {
		response.Error(c, 500, "删除管理员失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetAdminRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}

	svc := getAdminUserService()
	roles, err := svc.GetRoles(context.Background(), id)
	if err != nil {
		response.DBError(c, "查询角色失败")
		return
	}

	roleIDs := make([]string, len(roles))
	for i, r := range roles {
		roleIDs[i] = r.ID()
	}
	response.Success(c, gin.H{"roles": roleIDs})
}

type UpdateAdminRolesRequest struct {
	RoleIDs []string `json:"roleIds" binding:"required"`
}

func UpdateAdminRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdateAdminRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	svc := getAdminUserService()
	if err := svc.SetRoles(context.Background(), id, req.RoleIDs); err != nil {
		response.Error(c, 500, "更新角色失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
