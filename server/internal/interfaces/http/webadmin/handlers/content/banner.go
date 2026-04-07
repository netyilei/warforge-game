package content

import (
	"warforge-server/database"
	contentdomain "warforge-server/internal/domain/content"
	contentpersistence "warforge-server/internal/infrastructure/persistence/content"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/utils"

	"github.com/gin-gonic/gin"
)

func GetBannerGroups(c *gin.Context) {
	db := database.MustGetDB()
	repo := contentpersistence.NewBannerGroupRepository(db)
	groups, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "获取Banner分组失败")
		return
	}
	dtos := make([]*contentdomain.BannerGroupDTO, len(groups))
	for i, g := range groups {
		dtos[i] = g.ToDTO()
	}
	response.Success(c, gin.H{"groups": dtos})
}

type CreateBannerGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Code        string  `json:"code" binding:"required"`
	Description *string `json:"description"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	Status      int     `json:"status"`
	SortOrder   int     `json:"sortOrder"`
}

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
	repo := contentpersistence.NewBannerGroupRepository(db)

	exists, err := repo.CheckCodeExists(c.Request.Context(), req.Code, "")
	if err != nil {
		response.Error(c, 500, "检查标识失败: "+err.Error())
		return
	}
	if exists {
		response.Error(c, 400, "分组标识已存在，请使用其他标识")
		return
	}

	group := contentdomain.NewBannerGroup(utils.GenerateUUID(), req.Name, req.Code)
	group.SetDescription(req.Description)
	group.SetSize(req.Width, req.Height)
	group.SetSortOrder(req.SortOrder)
	group.SetStatus(contentdomain.BannerGroupStatus(req.Status))

	if err := repo.Save(c.Request.Context(), group); err != nil {
		response.Error(c, 500, "创建分组失败: "+err.Error())
		return
	}
	response.Success(c, group.ToDTO())
}

type UpdateBannerGroupRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	Width       int     `json:"width"`
	Height      int     `json:"height"`
	Status      int     `json:"status"`
	SortOrder   int     `json:"sortOrder"`
}

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
	repo := contentpersistence.NewBannerGroupRepository(db)

	group, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取分组失败: "+err.Error())
		return
	}

	group.SetDescription(req.Description)
	group.SetSize(req.Width, req.Height)
	group.SetSortOrder(req.SortOrder)
	group.SetStatus(contentdomain.BannerGroupStatus(req.Status))

	if err := repo.Save(c.Request.Context(), group); err != nil {
		response.Error(c, 500, "更新分组失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

func DeleteBannerGroup(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分组ID")
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewBannerGroupRepository(db)
	err := repo.Delete(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "删除分组失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetBanners(c *gin.Context) {
	groupID := c.Query("groupId")
	if groupID == "" {
		response.Error(c, 400, "缺少分组ID")
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewBannerRepository(db)
	banners, err := repo.FindByGroupID(c.Request.Context(), groupID)
	if err != nil {
		response.DBError(c, "获取Banner列表失败")
		return
	}
	dtos := make([]*contentdomain.BannerDTO, len(banners))
	for i, b := range banners {
		dtos[i] = b.ToDTO()
	}
	response.Success(c, gin.H{"banners": dtos})
}

type CreateBannerRequest struct {
	GroupID      string                               `json:"groupId" binding:"required"`
	ImageURL     string                               `json:"imageUrl" binding:"required"`
	LinkURL      *string                              `json:"linkUrl"`
	LinkTarget   string                               `json:"linkTarget"`
	ExtraData    contentdomain.BannerExtraData        `json:"extraData"`
	SortOrder    int                                  `json:"sortOrder"`
	Status       int                                  `json:"status"`
	Translations []contentdomain.BannerTranslationDTO `json:"translations"`
}

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
	repo := contentpersistence.NewBannerRepository(db)

	banner := contentdomain.NewBanner(utils.GenerateUUID(), req.GroupID, req.ImageURL)
	banner.SetLinkURL(req.LinkURL)
	banner.SetLinkTarget(req.LinkTarget)
	banner.SetExtraData(req.ExtraData)
	banner.SetSortOrder(req.SortOrder)
	banner.SetStatus(contentdomain.BannerStatus(req.Status))

	if err := repo.Save(c.Request.Context(), banner); err != nil {
		response.Error(c, 500, "创建Banner失败: "+err.Error())
		return
	}

	for _, t := range req.Translations {
		translation := contentdomain.NewBannerTranslation(
			utils.GenerateUUID(), banner.ID(), t.Lang, t.Title, t.Content,
		)
		if err := repo.SaveTranslation(c.Request.Context(), translation); err != nil {
			response.Error(c, 500, "保存翻译失败: "+err.Error())
			return
		}
	}

	response.Success(c, banner.ToDTO())
}

type UpdateBannerRequest struct {
	ImageURL     string                               `json:"imageUrl" binding:"required"`
	LinkURL      *string                              `json:"linkUrl"`
	LinkTarget   string                               `json:"linkTarget"`
	ExtraData    contentdomain.BannerExtraData        `json:"extraData"`
	SortOrder    int                                  `json:"sortOrder"`
	Status       int                                  `json:"status"`
	Translations []contentdomain.BannerTranslationDTO `json:"translations"`
}

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
	repo := contentpersistence.NewBannerRepository(db)

	banner, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取Banner失败: "+err.Error())
		return
	}

	banner.SetImageURL(req.ImageURL)
	banner.SetLinkURL(req.LinkURL)
	banner.SetLinkTarget(req.LinkTarget)
	banner.SetExtraData(req.ExtraData)
	banner.SetSortOrder(req.SortOrder)
	banner.SetStatus(contentdomain.BannerStatus(req.Status))

	if err := repo.Save(c.Request.Context(), banner); err != nil {
		response.Error(c, 500, "更新Banner失败: "+err.Error())
		return
	}

	if len(req.Translations) > 0 {
		for _, t := range req.Translations {
			translation := contentdomain.NewBannerTranslation(
				utils.GenerateUUID(), id, t.Lang, t.Title, t.Content,
			)
			if err := repo.SaveTranslation(c.Request.Context(), translation); err != nil {
				response.Error(c, 500, "更新Banner翻译失败: "+err.Error())
				return
			}
		}
	}

	response.Success(c, gin.H{})
}

func DeleteBanner(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少Banner ID")
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewBannerRepository(db)
	err := repo.Delete(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "删除Banner失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
