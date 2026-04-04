package handlers

import (
	"fmt"

	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/jwtutil"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Invalid request",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		fmt.Println("Database connection is nil")
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Database not connected",
			"data": nil,
		})
		return
	}

	user, err := models.AdminUser{}.FindByUsername(db, req.Username)
	if err != nil {
		fmt.Printf("FindByUsername error: %v\n", err)
		c.JSON(200, gin.H{
			"code": 401,
			"msg":  "User not found",
			"data": nil,
		})
		return
	}

	if user.Status != 1 {
		c.JSON(200, gin.H{
			"code": 403,
			"msg":  "Account is disabled",
			"data": nil,
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(200, gin.H{
			"code": 401,
			"msg":  "Invalid password",
			"data": nil,
		})
		return
	}

	accessToken, refreshToken, err := jwtutil.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to generate token",
			"data": nil,
		})
		return
	}

	models.AdminUser{}.UpdateLastLogin(db, user.ID)

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": LoginResponse{
			Token:        accessToken,
			RefreshToken: refreshToken,
		},
	})
}

func Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	jwtutil.InvalidateToken(userID.(string))
	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "请求参数无效",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	user, err := models.AdminUser{}.FindByID(db, userID.(string))
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "用户不存在",
			"data": nil,
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "原密码错误",
			"data": nil,
		})
		return
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "密码加密失败",
			"data": nil,
		})
		return
	}

	if err := (&models.AdminUser{}).UpdatePassword(db, userID.(string), string(newHashedPassword)); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "更新密码失败",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{"success": true},
	})
}

type UserInfoResponse struct {
	UserID   string   `json:"userId"`
	UserName string   `json:"userName"`
	Roles    []string `json:"roles"`
	Buttons  []string `json:"buttons"`
}

func GetUserInfo(c *gin.Context) {
	userID, _ := c.Get("userID")

	db := database.GetDB()
	user, err := models.AdminUser{}.FindByID(db, userID.(string))
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "User not found",
			"data": nil,
		})
		return
	}

	nickname := user.Nickname
	if nickname == "" {
		nickname = user.Username
	}

	roles, _ := models.AdminUser{}.GetRoleCodes(db, userID.(string))
	buttons, _ := models.AdminUser{}.GetButtonCodes(db, userID.(string))

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": UserInfoResponse{
			UserID:   userID.(string),
			UserName: nickname,
			Roles:    roles,
			Buttons:  buttons,
		},
	})
}
