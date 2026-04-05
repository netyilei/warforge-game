// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义 Banner 管理相关的 API 处理函数
package handlers

import (
	"time"
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetBannerGroups 获取Banner分组列表
func GetBannerGroups(c *gin.Context) {
	db := database.MustGetDB()
	groups, err := models.BannerGroup{}.GetAllBannerGroups(db)
	if err != nil {
		response.DBError(c, "获取Banner分组失败")
		return
	}
	response.Success(c, gin.H{"groups": groups})
}

// CreateBannerGroupRequest 创建Banner分组请求
type CreateBannerGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Code        string  `json:"code" binding:"required"`
	Description *string `json:"description"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	Status      int     `json:"status"`
	SortOrder   int     `json:"sortOrder"`
}

// CreateBannerGroup 创建Banner分组
func CreateBannerGroup(c *gin.Context) {
	var req CreateBannerGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	group, err := models.BannerGroup{}.CreateBannerGroup(db, req.Name, req.Code, req.Description, req.Width, req.Height, req.Status, req.SortOrder)
	if err != nil {
		if err == models.ErrBannerGroupCodeExists {
			response.Error(c, 400, "分组标识已存在，请使用其他标识")
			return
		}
		response.Error(c, 500, "创建分组失败: "+err.Error())
		return
	}
	response.Success(c, group)
}

// UpdateBannerGroupRequest 更新Banner分组请求
type UpdateBannerGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	Status      int     `json:"status"`
	SortOrder   int     `json:"sortOrder"`
}

// UpdateBannerGroup 更新Banner分组
func UpdateBannerGroup(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分组ID")
		return
	}

	var req UpdateBannerGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	err := models.BannerGroup{}.UpdateBannerGroup(db, id, req.Name, req.Description, req.Width, req.Height, req.Status, req.SortOrder)
	if err != nil {
		response.Error(c, 500, "更新分组失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

// DeleteBannerGroup 删除Banner分组
func DeleteBannerGroup(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分组ID")
		return
	}

	db := database.MustGetDB()
	err := models.BannerGroup{}.DeleteBannerGroup(db, id)
	if err != nil {
		response.Error(c, 500, "删除分组失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetBanners 获取Banner列表
func GetBanners(c *gin.Context) {
	groupID := c.Query("groupId")
	if groupID == "" {
		response.Error(c, 400, "缺少分组ID")
		return
	}

	db := database.MustGetDB()
	banners, err := models.Banner{}.GetBannersByGroupID(db, groupID)
	if err != nil {
		response.DBError(c, "获取Banner列表失败")
		return
	}
	response.Success(c, gin.H{"banners": banners})
}

// CreateBannerRequest 创建Banner请求
type CreateBannerRequest struct {
	GroupID      string                    `json:"groupId" binding:"required"`
	ImageURL     string                    `json:"imageUrl" binding:"required"`
	LinkURL      *string                   `json:"linkUrl"`
	LinkTarget   string                    `json:"linkTarget"`
	IsExternal   bool                      `json:"isExternal"`
	ExtraData    models.BannerExtraData    `json:"extraData"`
	StartTime    *time.Time                `json:"startTime"`
	EndTime      *time.Time                `json:"endTime"`
	SortOrder    int                       `json:"sortOrder"`
	Status       int                       `json:"status"`
	Translations []models.BannerTranslationDTO `json:"translations"`
}

// CreateBanner 创建Banner
func CreateBanner(c *gin.Context) {
	var req CreateBannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.LinkTarget == "" {
		req.LinkTarget = "_blank"
	}
	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	banner, err := models.Banner{}.CreateBanner(
		db, req.GroupID, req.ImageURL, req.LinkURL, req.LinkTarget,
		req.IsExternal, req.ExtraData, req.StartTime, req.EndTime,
		req.SortOrder, req.Status, req.Translations,
	)
	if err != nil {
		response.Error(c, 500, "创建Banner失败: "+err.Error())
		return
	}
	response.Success(c, banner)
}

// UpdateBannerRequest 更新Banner请求
type UpdateBannerRequest struct {
	ImageURL     string                    `json:"imageUrl" binding:"required"`
	LinkURL      *string                   `json:"linkUrl"`
	LinkTarget   string                    `json:"linkTarget"`
	IsExternal   bool                      `json:"isExternal"`
	ExtraData    models.BannerExtraData    `json:"extraData"`
	StartTime    *time.Time                `json:"startTime"`
	EndTime      *time.Time                `json:"endTime"`
	SortOrder    int                       `json:"sortOrder"`
	Status       int                       `json:"status"`
	Translations []models.BannerTranslationDTO `json:"translations"`
}

// UpdateBanner 更新Banner
func UpdateBanner(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少Banner ID")
		return
	}

	var req UpdateBannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.LinkTarget == "" {
		req.LinkTarget = "_blank"
	}

	db := database.MustGetDB()
	err := models.Banner{}.UpdateBanner(
		db, id, req.ImageURL, req.LinkURL, req.LinkTarget,
		req.IsExternal, req.ExtraData, req.StartTime, req.EndTime,
		req.SortOrder, req.Status,
	)
	if err != nil {
		response.Error(c, 500, "更新Banner失败: "+err.Error())
		return
	}

	if len(req.Translations) > 0 {
		err = models.Banner{}.UpdateBannerTranslations(db, id, req.Translations)
		if err != nil {
			response.Error(c, 500, "更新Banner翻译失败: "+err.Error())
			return
		}
	}

	response.Success(c, gin.H{})
}

// DeleteBanner 删除Banner
func DeleteBanner(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少Banner ID")
		return
	}

	db := database.MustGetDB()
	err := models.Banner{}.DeleteBanner(db, id)
	if err != nil {
		response.Error(c, 500, "删除Banner失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
