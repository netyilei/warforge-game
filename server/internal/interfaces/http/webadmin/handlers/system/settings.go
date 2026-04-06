package system

import (
	"warforge-server/database"
	admindomain "warforge-server/internal/domain/admin"
	adminpersistence "warforge-server/internal/infrastructure/persistence/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

func GetSettings(c *gin.Context) {
	db := database.MustGetDB()
	repo := adminpersistence.NewAdminSettingRepository(db)
	settings, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.Success(c, gin.H{"settings": []interface{}{}})
		return
	}
	dtos := make([]*admindomain.AdminSettingDTO, len(settings))
	for i, s := range settings {
		dtos[i] = s.ToDTO()
	}
	response.Success(c, gin.H{"settings": dtos})
}

type UpdateSettingsRequest struct {
	Settings []struct {
		Key         string `json:"key" binding:"required"`
		Value       string `json:"value" binding:"required"`
		Description string `json:"description"`
	} `json:"settings" binding:"required"`
}

func UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "Invalid request")
		return
	}

	db := database.MustGetDB()
	repo := adminpersistence.NewAdminSettingRepository(db)

	var settings []*admindomain.AdminSetting
	for _, s := range req.Settings {
		setting := admindomain.NewAdminSetting(s.Key, s.Value)
		setting.SetDescription(s.Description)
		settings = append(settings, setting)
	}

	if err := repo.BatchSave(c.Request.Context(), settings); err != nil {
		response.DBError(c, "保存设置失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
