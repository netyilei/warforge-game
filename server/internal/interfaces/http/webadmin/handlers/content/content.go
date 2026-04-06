package content

import (
	"time"

	"warforge-server/database"
	contentdomain "warforge-server/internal/domain/content"
	contentpersistence "warforge-server/internal/infrastructure/persistence/content"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/utils"

	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	db := database.MustGetDB()
	repo := contentpersistence.NewContentCategoryRepository(db)
	categories, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "获取分类失败")
		return
	}
	dtos := make([]*contentdomain.ContentCategoryDTO, len(categories))
	for i, cat := range categories {
		dtos[i] = cat.ToDTO()
	}
	response.Success(c, gin.H{"categories": dtos})
}

type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required"`
	Code        string  `json:"code" binding:"required"`
	Icon        *string `json:"icon"`
	ParentID    *string `json:"parentId"`
	ContentType string  `json:"contentType"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sortOrder"`
	Status      int     `json:"status"`
}

func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.ContentType == "" {
		req.ContentType = "html"
	}
	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentCategoryRepository(db)

	cat := contentdomain.NewContentCategory(utils.GenerateUUID(), req.Name, req.Code)
	cat.SetIcon(req.Icon)
	cat.SetParentID(req.ParentID)
	cat.SetContentType(req.ContentType)
	cat.SetDescription(req.Description)
	cat.SetSortOrder(req.SortOrder)
	cat.SetStatus(contentdomain.CategoryStatus(req.Status))

	if err := repo.Save(c.Request.Context(), cat); err != nil {
		response.Error(c, 500, "创建分类失败: "+err.Error())
		return
	}
	response.Success(c, cat.ToDTO())
}

type UpdateCategoryRequest struct {
	Name        string  `json:"name" binding:"required"`
	Icon        *string `json:"icon"`
	ContentType string  `json:"contentType"`
	Description *string `json:"description"`
	SortOrder   int     `json:"sortOrder"`
	Status      int     `json:"status"`
}

func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分类ID")
		return
	}
	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.ContentType == "" {
		req.ContentType = "html"
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentCategoryRepository(db)

	cat, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取分类失败: "+err.Error())
		return
	}

	cat.SetName(req.Name)
	cat.SetIcon(req.Icon)
	cat.SetContentType(req.ContentType)
	cat.SetDescription(req.Description)
	cat.SetSortOrder(req.SortOrder)
	cat.SetStatus(contentdomain.CategoryStatus(req.Status))

	if err := repo.Save(c.Request.Context(), cat); err != nil {
		response.Error(c, 500, "更新分类失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

func DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少分类ID")
		return
	}
	db := database.MustGetDB()
	repo := contentpersistence.NewContentCategoryRepository(db)
	err := repo.Delete(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "删除分类失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

type ContentListRequest struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"pageSize"`
	CategoryID string `form:"categoryId"`
	Status     int    `form:"status"`
}

func GetContents(c *gin.Context) {
	db := database.MustGetDB()
	var req ContentListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}

	repo := contentpersistence.NewContentRepository(db)
	filter := contentdomain.ContentFilter{
		Page:       req.Page,
		PageSize:   req.PageSize,
		CategoryID: req.CategoryID,
		Status:     req.Status,
	}

	result, err := repo.List(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, 500, "获取内容列表失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"list":  result.Items,
		"total": result.Total,
	})
}

func GetContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentRepository(db)
	content, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取内容详情失败: "+err.Error())
		return
	}

	translations, err := repo.FindTranslationsByContentID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取翻译失败: "+err.Error())
		return
	}

	translationDTOs := make([]contentdomain.ContentTranslationDTO, len(translations))
	for i, t := range translations {
		translationDTOs[i] = *t.ToDTO()
	}

	result := &contentdomain.ContentWithTranslations{
		ContentDTO:   content.ToDTO(),
		Translations: translationDTOs,
	}
	response.Success(c, result)
}

type CreateContentRequest struct {
	CategoryID   string                              `json:"categoryId" binding:"required"`
	AuthorID     string                              `json:"authorId"`
	CoverImage   *string                             `json:"coverImage"`
	IsMarquee    bool                                `json:"isMarquee"`
	IsPopup      bool                                `json:"isPopup"`
	StartTime    *string                             `json:"startTime"`
	EndTime      *string                             `json:"endTime"`
	SortOrder    int                                 `json:"sortOrder"`
	Status       int                                 `json:"status"`
	Translations []contentdomain.ContentTranslationDTO `json:"translations" binding:"required"`
}

func CreateContent(c *gin.Context) {
	var req CreateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.Status == 0 {
		req.Status = 1
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentRepository(db)

	content := contentdomain.NewContent(utils.GenerateUUID(), req.CategoryID)
	content.SetAuthorID(req.AuthorID)
	content.SetCoverImage(req.CoverImage)
	content.SetMarquee(req.IsMarquee)
	content.SetPopup(req.IsPopup)
	content.SetSortOrder(req.SortOrder)
	content.SetStatus(contentdomain.ContentStatus(req.Status))

	if req.StartTime != nil {
		t, _ := time.Parse(time.RFC3339, *req.StartTime)
		content.SetStartTime(&t)
	}
	if req.EndTime != nil {
		t, _ := time.Parse(time.RFC3339, *req.EndTime)
		content.SetEndTime(&t)
	}

	if err := repo.Save(c.Request.Context(), content); err != nil {
		response.Error(c, 500, "创建内容失败: "+err.Error())
		return
	}

	for _, t := range req.Translations {
		translation := contentdomain.NewContentTranslation(
			utils.GenerateUUID(), content.ID(), t.Lang, t.Title, t.Summary, t.Content,
		)
		if err := repo.SaveTranslation(c.Request.Context(), translation); err != nil {
			response.Error(c, 500, "保存翻译失败: "+err.Error())
			return
		}
	}

	result := &contentdomain.ContentWithTranslations{
		ContentDTO:   content.ToDTO(),
		Translations: req.Translations,
	}
	response.Success(c, result)
}

type UpdateContentRequest struct {
	CategoryID   string                              `json:"categoryId" binding:"required"`
	CoverImage   *string                             `json:"coverImage"`
	IsMarquee    bool                                `json:"isMarquee"`
	IsPopup      bool                                `json:"isPopup"`
	StartTime    *string                             `json:"startTime"`
	EndTime      *string                             `json:"endTime"`
	SortOrder    int                                 `json:"sortOrder"`
	Status       int                                 `json:"status"`
	Translations []contentdomain.ContentTranslationDTO `json:"translations"`
}

func UpdateContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	var req UpdateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentRepository(db)

	content, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取内容失败: "+err.Error())
		return
	}

	content.SetCategoryID(req.CategoryID)
	content.SetCoverImage(req.CoverImage)
	content.SetMarquee(req.IsMarquee)
	content.SetPopup(req.IsPopup)
	content.SetSortOrder(req.SortOrder)
	content.SetStatus(contentdomain.ContentStatus(req.Status))

	if req.StartTime != nil {
		t, _ := time.Parse(time.RFC3339, *req.StartTime)
		content.SetStartTime(&t)
	}
	if req.EndTime != nil {
		t, _ := time.Parse(time.RFC3339, *req.EndTime)
		content.SetEndTime(&t)
	}

	if err := repo.Save(c.Request.Context(), content); err != nil {
		response.Error(c, 500, "更新内容失败: "+err.Error())
		return
	}

	if req.Translations != nil {
		for _, t := range req.Translations {
			translation := contentdomain.NewContentTranslation(
				utils.GenerateUUID(), id, t.Lang, t.Title, t.Summary, t.Content,
			)
			if err := repo.SaveTranslation(c.Request.Context(), translation); err != nil {
				response.Error(c, 500, "更新翻译失败: "+err.Error())
				return
			}
		}
	}

	translations, _ := repo.FindTranslationsByContentID(c.Request.Context(), id)
	translationDTOs := make([]contentdomain.ContentTranslationDTO, len(translations))
	for i, t := range translations {
		translationDTOs[i] = *t.ToDTO()
	}

	result := &contentdomain.ContentWithTranslations{
		ContentDTO:   content.ToDTO(),
		Translations: translationDTOs,
	}
	response.Success(c, result)
}

func DeleteContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少内容ID")
		return
	}

	db := database.MustGetDB()
	repo := contentpersistence.NewContentRepository(db)
	err := repo.Delete(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "删除内容失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
