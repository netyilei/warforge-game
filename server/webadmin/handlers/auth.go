// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义认证相关的 API 处理函数，包括：
// - 管理员登录/登出
// - 密码修改
// - 用户信息获取
package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/jwtutil"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

// Login 管理员登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request")
		return
	}
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByUsername(db, req.Username)
	if err != nil {
		response.Error(c, 401, "User not found")
		return
	}
	if user.Status != 1 {
		response.Forbidden(c, "Account is disabled")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		response.Error(c, 401, "Invalid password")
		return
	}
	accessToken, refreshToken, err := jwtutil.GenerateToken(user.ID, user.Username)
	if err != nil {
		response.Error(c, 500, "Failed to generate token")
		return
	}
	models.AdminUser{}.UpdateLastLogin(db, user.ID)
	response.Success(c, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
	})
}

// Logout 管理员登出
func Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	jwtutil.InvalidateToken(userID.(string))
	response.Success(c, gin.H{"success": true})
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// ChangePassword 修改密码
func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByID(db, userID.(string))
	if err != nil {
		response.NotFound(c, "用户不存在")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		response.Error(c, 400, "原密码错误")
		return
	}
	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Error(c, 500, "密码加密失败")
		return
	}
	if err := (&models.AdminUser{}).UpdatePassword(db, userID.(string), string(newHashedPassword)); err != nil {
		response.Error(c, 500, "更新密码失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// UserInfoResponse 用户信息响应
type UserInfoResponse struct {
	UserID   string   `json:"userId"`
	UserName string   `json:"userName"`
	Roles    []string `json:"roles"`
	Buttons  []string `json:"buttons"`
}

// GetUserInfo 获取用户信息
func GetUserInfo(c *gin.Context) {
	userID, _ := c.Get("userID")
	db := database.MustGetDB()
	user, err := models.AdminUser{}.FindByID(db, userID.(string))
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}
	nickname := user.Nickname
	if nickname == "" {
		nickname = user.Username
	}
	roles, _ := models.AdminUser{}.GetRoleCodes(db, userID.(string))
	buttons, _ := models.AdminUser{}.GetButtonCodes(db, userID.(string))
	response.Success(c, UserInfoResponse{
		UserID:   userID.(string),
		UserName: nickname,
		Roles:    roles,
		Buttons:  buttons,
	})
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// RefreshToken 刷新访问令牌
func RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request")
		return
	}

	accessToken, refreshToken, err := jwtutil.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		response.Error(c, 401, "Invalid or expired refresh token")
		return
	}

	response.Success(c, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
	})
}
