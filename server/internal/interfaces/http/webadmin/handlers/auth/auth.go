package auth

import (
	"warforge-server/database"
	adminsvc "warforge-server/internal/application/admin"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/auth"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func getAdminUserService() *adminsvc.AdminUserService {
	db := database.MustGetDB()
	userRepo := adminpersistence.NewUserRepository(db)
	return adminsvc.NewAdminUserService(userRepo)
}

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
		response.Error(c, 400, "Invalid request")
		return
	}
	svc := getAdminUserService()
	user, err := svc.FindByUsername(c.Request.Context(), req.Username)
	if err != nil {
		response.Error(c, 401, "User not found")
		return
	}
	if user.Status() != admindomain.AdminUserStatusActive {
		response.Forbidden(c, "Account is disabled")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password()), []byte(req.Password)); err != nil {
		response.Error(c, 401, "Invalid password")
		return
	}
	accessToken, refreshToken, err := auth.GenerateToken(user.ID(), user.Username())
	if err != nil {
		response.Error(c, 500, "Failed to generate token")
		return
	}
	svc.UpdateLastLogin(c.Request.Context(), user.ID())
	response.Success(c, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
	})
}

func Logout(c *gin.Context) {
	userID, _ := c.Get("userID")
	auth.InvalidateToken(userID.(string))
	response.Success(c, gin.H{"success": true})
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	svc := getAdminUserService()
	user, err := svc.FindByID(c.Request.Context(), userID.(string))
	if err != nil {
		response.NotFound(c, "用户不存在")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password()), []byte(req.OldPassword)); err != nil {
		response.Error(c, 400, "原密码错误")
		return
	}
	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Error(c, 500, "密码加密失败")
		return
	}
	if err := svc.UpdatePassword(c.Request.Context(), userID.(string), string(newHashedPassword)); err != nil {
		response.Error(c, 500, "更新密码失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "请求参数无效")
		return
	}
	svc := getAdminUserService()
	user, err := svc.Update(c.Request.Context(), userID.(string), req.Nickname, req.Email, req.Phone, "", 0)
	if err != nil {
		response.Error(c, 500, "更新资料失败")
		return
	}
	nickname := user.Nickname()
	if nickname == "" {
		nickname = user.Username()
	}
	response.Success(c, gin.H{
		"success":  true,
		"nickname": nickname,
	})
}

type UserInfoResponse struct {
	UserID   string   `json:"userId"`
	UserName string   `json:"userName"`
	Roles    []string `json:"roles"`
	Menus    []string `json:"menus"`
	Buttons  []string `json:"buttons"`
}

func GetUserInfo(c *gin.Context) {
	userID, _ := c.Get("userID")
	svc := getAdminUserService()
	user, err := svc.FindByID(c.Request.Context(), userID.(string))
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}
	nickname := user.Nickname()
	if nickname == "" {
		nickname = user.Username()
	}
	roles, _ := svc.GetRoleCodes(c.Request.Context(), userID.(string))
	menus, _ := svc.GetMenuCodes(c.Request.Context(), userID.(string))
	buttons, _ := svc.GetButtonCodes(c.Request.Context(), userID.(string))
	response.Success(c, UserInfoResponse{
		UserID:   userID.(string),
		UserName: nickname,
		Roles:    roles,
		Menus:    menus,
		Buttons:  buttons,
	})
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

func RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request")
		return
	}

	accessToken, refreshToken, err := auth.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		response.Error(c, 401, "Invalid or expired refresh token")
		return
	}

	response.Success(c, LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
	})
}
