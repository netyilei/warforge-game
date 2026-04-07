package system

import (
	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/utils"

	"github.com/gin-gonic/gin"
)

func GetLanguages(c *gin.Context) {
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)
	languages, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.Success(c, gin.H{"languages": []interface{}{}})
		return
	}
	dtos := make([]*systemdomain.LanguageDTO, len(languages))
	for i, lang := range languages {
		dtos[i] = lang.ToDTO()
	}
	response.Success(c, gin.H{"languages": dtos})
}

type CreateLanguageRequest struct {
	Code       string `json:"code" binding:"required"`
	Name       string `json:"name" binding:"required"`
	NativeName string `json:"nativeName" binding:"required"`
	Icon       string `json:"icon"`
	SortOrder  int    `json:"sortOrder"`
	Status     int    `json:"status"`
}

func CreateLanguage(c *gin.Context) {
	var req CreateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)

	lang := systemdomain.NewLanguage(utils.GenerateUUID(), req.Code, req.Name)
	lang.SetNativeName(req.NativeName)
	if req.Status > 0 {
		lang.SetStatus(systemdomain.LanguageStatus(req.Status))
	} else {
		lang.SetStatus(systemdomain.LanguageStatusActive)
	}
	lang.SetSortOrder(req.SortOrder)
	if req.Icon != "" {
		lang.SetIcon(&req.Icon)
	}

	if err := repo.Save(c.Request.Context(), lang); err != nil {
		response.Error(c, 500, "创建失败: "+err.Error())
		return
	}
	response.Success(c, lang.ToDTO())
}

type UpdateLanguageRequest struct {
	Name       string `json:"name"`
	NativeName string `json:"nativeName"`
	Icon       string `json:"icon"`
	Status     int    `json:"status"`
	SortOrder  int    `json:"sortOrder"`
}

func UpdateLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少ID参数")
		return
	}
	var req UpdateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)

	lang, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取语言失败: "+err.Error())
		return
	}

	lang.SetName(req.Name)
	lang.SetNativeName(req.NativeName)
	lang.SetStatus(systemdomain.LanguageStatus(req.Status))
	lang.SetSortOrder(req.SortOrder)
	if req.Icon != "" {
		lang.SetIcon(&req.Icon)
	}

	if err := repo.Save(c.Request.Context(), lang); err != nil {
		response.Error(c, 500, "更新失败: "+err.Error())
		return
	}
	response.Success(c, lang.ToDTO())
}

func DeleteLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少ID参数")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)
	if err := repo.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "删除失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func SetDefaultLanguage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少ID参数")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)
	if err := repo.SetDefault(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "设置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetSupportedLanguages(c *gin.Context) {
	GetLanguages(c)
}

type SetSupportedLanguagesRequest struct {
	LanguageIDs []string `json:"languageIds" binding:"required"`
}

func SetSupportedLanguages(c *gin.Context) {
	var req SetSupportedLanguagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewLanguageRepository(db)
	if err := repo.SetSupported(c.Request.Context(), req.LanguageIDs); err != nil {
		response.Error(c, 500, "设置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
