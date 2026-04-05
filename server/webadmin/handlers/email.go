package handlers

import (
	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/utils"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

func GetEmailConfigs(c *gin.Context) {
	db := database.MustGetDB()
	configs, err := models.EmailConfig{}.GetAll(db)
	if err != nil {
		response.Error(c, 500, "获取邮箱配置失败: "+err.Error())
		return
	}
	if configs == nil {
		configs = []models.EmailConfigDTO{}
	}
	response.Success(c, gin.H{"configs": configs})
}

func GetEmailConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少配置ID")
		return
	}

	db := database.MustGetDB()
	config, err := models.EmailConfig{}.GetByID(db, id)
	if err != nil {
		response.Error(c, 500, "获取邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, config)
}

type CreateEmailConfigRequest struct {
	Name       string `json:"name" binding:"required"`
	Code       string `json:"code" binding:"required"`
	Protocol   string `json:"protocol" binding:"required"`
	Encryption string `json:"encryption"`
	Host       string `json:"host" binding:"required"`
	Port       int    `json:"port" binding:"required"`
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password"`
	FromName   string `json:"fromName"`
	FromEmail  string `json:"fromEmail" binding:"required"`
	IsDefault  bool   `json:"isDefault"`
	Status     int    `json:"status"`
	SortOrder  int    `json:"sortOrder"`
}

func CreateEmailConfig(c *gin.Context) {
	var req CreateEmailConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.Status == 0 {
		req.Status = 1
	}

	if req.Encryption == "" {
		req.Encryption = "tls"
	}

	db := database.MustGetDB()
	config, err := models.EmailConfig{}.Create(
		db, req.Name, req.Code, req.Protocol, req.Encryption, req.Host, req.Port,
		req.Username, req.Password, req.FromName, req.FromEmail,
		req.IsDefault, req.Status, req.SortOrder,
	)
	if err != nil {
		if err == models.ErrEmailConfigCodeExists {
			response.Error(c, 400, "配置标识已存在")
			return
		}
		response.Error(c, 500, "创建邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, config)
}

type UpdateEmailConfigRequest struct {
	Name       string `json:"name" binding:"required"`
	Protocol   string `json:"protocol" binding:"required"`
	Encryption string `json:"encryption"`
	Host       string `json:"host" binding:"required"`
	Port       int    `json:"port" binding:"required"`
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password"`
	FromName   string `json:"fromName"`
	FromEmail  string `json:"fromEmail" binding:"required"`
	IsDefault  bool   `json:"isDefault"`
	Status     int    `json:"status"`
	SortOrder  int    `json:"sortOrder"`
}

func UpdateEmailConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少配置ID")
		return
	}

	var req UpdateEmailConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.Encryption == "" {
		req.Encryption = "tls"
	}

	db := database.MustGetDB()
	err := models.EmailConfig{}.Update(
		db, id, req.Name, req.Protocol, req.Encryption, req.Host, req.Port,
		req.Username, req.Password, req.FromName, req.FromEmail,
		req.IsDefault, req.Status, req.SortOrder,
	)
	if err != nil {
		response.Error(c, 500, "更新邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

func DeleteEmailConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少配置ID")
		return
	}

	db := database.MustGetDB()
	err := models.EmailConfig{}.Delete(db, id)
	if err != nil {
		response.Error(c, 500, "删除邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetEmailTemplates(c *gin.Context) {
	db := database.MustGetDB()
	templates, err := models.EmailTemplate{}.GetAll(db)
	if err != nil {
		response.Error(c, 500, "获取邮件模板失败: "+err.Error())
		return
	}
	if templates == nil {
		templates = []models.EmailTemplateDTO{}
	}
	response.Success(c, gin.H{"templates": templates})
}

func GetEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少模板ID")
		return
	}

	db := database.MustGetDB()
	template, err := models.EmailTemplate{}.GetByID(db, id)
	if err != nil {
		response.Error(c, 500, "获取邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, template)
}

type CreateEmailTemplateRequest struct {
	Name        string       `json:"name" binding:"required"`
	Code        string       `json:"code" binding:"required"`
	Subject     string       `json:"subject" binding:"required"`
	ContentType string       `json:"contentType"`
	Content     string       `json:"content" binding:"required"`
	Description string       `json:"description"`
	Variables   models.JSONB `json:"variables"`
	Status      int          `json:"status"`
}

func CreateEmailTemplate(c *gin.Context) {
	var req CreateEmailTemplateRequest
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
	template, err := models.EmailTemplate{}.Create(
		db, req.Name, req.Code, req.Subject, req.ContentType,
		req.Content, req.Description, req.Variables, req.Status,
	)
	if err != nil {
		if err == models.ErrEmailTemplateCodeExists {
			response.Error(c, 400, "模板标识已存在")
			return
		}
		response.Error(c, 500, "创建邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, template)
}

type UpdateEmailTemplateRequest struct {
	Name        string       `json:"name" binding:"required"`
	Subject     string       `json:"subject" binding:"required"`
	ContentType string       `json:"contentType"`
	Content     string       `json:"content" binding:"required"`
	Description string       `json:"description"`
	Variables   models.JSONB `json:"variables"`
	Status      int          `json:"status"`
}

func UpdateEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少模板ID")
		return
	}

	var req UpdateEmailTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.ContentType == "" {
		req.ContentType = "html"
	}

	db := database.MustGetDB()
	err := models.EmailTemplate{}.Update(
		db, id, req.Name, req.Subject, req.ContentType,
		req.Content, req.Description, req.Variables, req.Status,
	)
	if err != nil {
		response.Error(c, 500, "更新邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{})
}

func DeleteEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少模板ID")
		return
	}

	db := database.MustGetDB()
	err := models.EmailTemplate{}.Delete(db, id)
	if err != nil {
		response.Error(c, 500, "删除邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

type SendTestEmailRequest struct {
	ConfigID string `json:"configId"`
	ToEmail  string `json:"toEmail" binding:"required,email"`
	Subject  string `json:"subject" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

func SendTestEmail(c *gin.Context) {
	var req SendTestEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	var config *models.EmailConfigDTO
	var err error

	if req.ConfigID != "" {
		config, err = models.EmailConfig{}.GetByID(db, req.ConfigID)
	} else {
		config, err = models.EmailConfig{}.GetDefault(db)
	}

	if err != nil {
		response.Error(c, 400, "邮箱配置不存在")
		return
	}

	err = utils.SendEmail(config, req.ToEmail, req.Subject, req.Content)
	if err != nil {
		response.Error(c, 500, "发送邮件失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{"success": true, "message": "邮件发送成功"})
}
