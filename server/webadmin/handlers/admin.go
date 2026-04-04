// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义管理员用户相关的 API 处理函数
package handlers

import (
	"strconv"

	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// GetAdmins 获取管理员列表
//
// 返回管理员分页列表
func GetAdmins(c *gin.Context) {
	db := database.GetDB()

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
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Database error",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"list":     users,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// GetAdmin 获取管理员详情
//
// 返回指定管理员的详细信息
func GetAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID is required",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "Admin not found",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": user,
	})
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
//
// 创建新的管理员账户
func CreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Invalid request",
			"data": nil,
		})
		return
	}

	db := database.GetDB()

	existing, _ := models.AdminUser{}.FindByUsername(db, req.Username)
	if existing != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Username already exists",
			"data": nil,
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to hash password",
			"data": nil,
		})
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
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to create admin",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": user,
	})
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
//
// 更新指定管理员的信息
func UpdateAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID is required",
			"data": nil,
		})
		return
	}

	var req UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Invalid request",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "Admin not found",
			"data": nil,
		})
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
			c.JSON(200, gin.H{
				"code": 500,
				"msg":  "Failed to hash password",
				"data": nil,
			})
			return
		}
		user.Password = string(hashedPassword)
	}
	user.Status = req.Status

	if err := user.Update(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to update admin",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": user,
	})
}

// DeleteAdmin 删除管理员
//
// 删除指定的管理员账户
func DeleteAdmin(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID is required",
			"data": nil,
		})
		return
	}

	userID, _ := c.Get("userID")
	if id == userID.(string) {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Cannot delete yourself",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	user, err := models.AdminUser{}.FindByID(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 404,
			"msg":  "Admin not found",
			"data": nil,
		})
		return
	}

	if err := user.Delete(db); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to delete admin",
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

// GetAdminRoles 获取管理员角色
//
// 返回指定管理员的角色列表
func GetAdminRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID is required",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	roles, err := models.AdminUser{}.GetRoles(db, id)
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Database error",
			"data": nil,
		})
		return
	}

	c.JSON(200, gin.H{
		"code": 0,
		"msg":  "success",
		"data": gin.H{
			"roles": roles,
		},
	})
}

// UpdateAdminRolesRequest 更新管理员角色请求
type UpdateAdminRolesRequest struct {
	RoleIDs []string `json:"roleIds" binding:"required"`
}

// UpdateAdminRoles 更新管理员角色
//
// 更新指定管理员的角色列表
func UpdateAdminRoles(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "ID is required",
			"data": nil,
		})
		return
	}

	var req UpdateAdminRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(200, gin.H{
			"code": 400,
			"msg":  "Invalid request",
			"data": nil,
		})
		return
	}

	db := database.GetDB()
	if err := (&models.AdminUser{}).SetRoles(db, id, req.RoleIDs); err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "Failed to update admin roles",
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
