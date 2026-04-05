// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义管理员用户相关的 API 处理函数
package handlers

import (
	"strconv"

	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// GetAdmins 获取管理员列表
func GetAdmins(c *gin.Context) {
	db := database.MustGetDB()
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
	users, total, err := models.AdminUser{}.List(db, page, pageSize)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{
		"list":     users,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetAdmin 获取管理员详情
func GetAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}
	response.Success(c, user)
}

// CreateAdminRequest 创建管理员请求
type CreateAdminRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Status   int    `json:"status"`
}

// CreateAdmin 创建管理员
func CreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	existing, _ := models.AdminUser{}.FindByUsername(db, req.Username)
	if existing != nil {
		response.Error(c, 400, "用户名已存在")
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Error(c, 500, "密码加密失败")
		return
	}
	user := &models.AdminUser{
		ID:       uuid.New().String(),
		Username: req.Username,
		Password: string(hashedPassword),
		Nickname: req.Nickname,
		Email:    req.Email,
		Phone:    req.Phone,
		Status:   req.Status,
	}
	if user.Status == 0 {
		user.Status = 1
	}
	if err := user.Create(db); err != nil {
		response.Error(c, 500, "创建管理员失败")
		return
	}
	response.Success(c, user)
}

// UpdateAdminRequest 更新管理员请求
type UpdateAdminRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Status   int    `json:"status"`
}

// UpdateAdmin 更新管理员
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
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}
	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			response.Error(c, 500, "密码加密失败")
			return
		}
		user.Password = string(hashedPassword)
	}
	user.Status = req.Status
	if err := user.Update(db); err != nil {
		response.Error(c, 500, "更新管理员失败")
		return
	}
	response.Success(c, user)
}

// DeleteAdmin 删除管理员
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
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		response.NotFound(c, "管理员不存在")
		return
	}
	if err := user.Delete(db); err != nil {
		response.Error(c, 500, "删除管理员失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetAdminRoles 获取管理员角色
func GetAdminRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	roles, err := models.AdminUser{}.GetRoleIDs(db, id)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{"roles": roles})
}

// UpdateAdminRolesRequest 更新管理员角色请求
type UpdateAdminRolesRequest struct {
	RoleIDs []string `json:"roleIds" binding:"required"`
}

// UpdateAdminRoles 更新管理员角色
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
	db := database.MustGetDB()
	if err := (&models.AdminUser{}).SetRoles(db, id, req.RoleIDs); err != nil {
		response.Error(c, 500, "更新角色失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
