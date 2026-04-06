package system

import (
	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

func GetSystemConfigs(c *gin.Context) {
	db := database.MustGetDB()
	repo := systempersistence.NewSystemConfigRepository(db)
	configs, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取系统配置失败: "+err.Error())
		return
	}
	dtos := make([]*systemdomain.SystemConfigDTO, len(configs))
	for i, config := range configs {
		dtos[i] = config.ToDTO()
	}
	response.Success(c, gin.H{"configs": dtos})
}

func GetSystemConfig(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		response.Error(c, 400, "缺少配置Key")
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewSystemConfigRepository(db)
	config, err := repo.FindByKey(c.Request.Context(), key)
	if err != nil {
		response.Error(c, 500, "获取系统配置失败: "+err.Error())
		return
	}
	response.Success(c, config.ToDTO())
}

type CreateSystemConfigRequest struct {
	Key         string                `json:"key" binding:"required"`
	Value       systemdomain.JSONB    `json:"value" binding:"required"`
	Description string                `json:"description"`
}

func CreateSystemConfig(c *gin.Context) {
	var req CreateSystemConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewSystemConfigRepository(db)
	config := systemdomain.NewSystemConfig(req.Key, req.Value)
	config.SetDescription(req.Description)

	if err := repo.Save(c.Request.Context(), config); err != nil {
		response.Error(c, 500, "创建系统配置失败: "+err.Error())
		return
	}
	response.Success(c, config.ToDTO())
}

type UpdateSystemConfigRequest struct {
	Value       systemdomain.JSONB    `json:"value" binding:"required"`
	Description string                `json:"description"`
}

func UpdateSystemConfig(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		response.Error(c, 400, "缺少配置Key")
		return
	}

	var req UpdateSystemConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewSystemConfigRepository(db)
	config, err := repo.FindByKey(c.Request.Context(), key)
	if err != nil {
		response.Error(c, 500, "获取系统配置失败: "+err.Error())
		return
	}

	config.SetValue(req.Value)
	config.SetDescription(req.Description)

	if err := repo.Save(c.Request.Context(), config); err != nil {
		response.Error(c, 500, "更新系统配置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

func DeleteSystemConfig(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		response.Error(c, 400, "缺少配置Key")
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewSystemConfigRepository(db)
	err := repo.Delete(c.Request.Context(), key)
	if err != nil {
		response.Error(c, 500, "删除系统配置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}
