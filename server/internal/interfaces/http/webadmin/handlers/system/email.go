package system

import (
	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/email"

	"github.com/gin-gonic/gin"
)

func GetEmailConfigs(c *gin.Context) {
	db := database.MustGetDB()
	repo := systempersistence.NewEmailConfigRepository(db)
	configs, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取邮箱配置失败: "+err.Error())
		return
	}
	dtos := make([]*systemdomain.EmailConfigDTO, len(configs))
	for i, cfg := range configs {
		dtos[i] = cfg.ToDTO()
	}
	response.Success(c, gin.H{"configs": dtos})
}

func GetEmailConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少配置ID")
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewEmailConfigRepository(db)
	config, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, config.ToDTO())
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
	repo := systempersistence.NewEmailConfigRepository(db)

	config := systemdomain.NewEmailConfig("", req.Name, req.Code, systemdomain.EmailProtocol(req.Protocol), req.Host, req.Port)
	config.SetEncryption(systemdomain.EmailEncryption(req.Encryption))
	config.SetUsername(req.Username)
	config.SetPassword(req.Password)
	config.SetFromName(req.FromName)
	config.SetFromEmail(req.FromEmail)
	config.SetDefault(req.IsDefault)
	config.SetStatus(systemdomain.EmailConfigStatus(req.Status))
	config.SetSortOrder(req.SortOrder)

	if err := repo.Save(c.Request.Context(), config); err != nil {
		response.Error(c, 500, "创建邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, config.ToDTO())
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
	repo := systempersistence.NewEmailConfigRepository(db)

	config, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取邮箱配置失败: "+err.Error())
		return
	}

	config.SetName(req.Name)
	config.SetProtocol(systemdomain.EmailProtocol(req.Protocol))
	config.SetEncryption(systemdomain.EmailEncryption(req.Encryption))
	config.SetHost(req.Host)
	config.SetPort(req.Port)
	config.SetUsername(req.Username)
	config.SetPassword(req.Password)
	config.SetFromName(req.FromName)
	config.SetFromEmail(req.FromEmail)
	config.SetDefault(req.IsDefault)
	config.SetStatus(systemdomain.EmailConfigStatus(req.Status))
	config.SetSortOrder(req.SortOrder)

	if err := repo.Save(c.Request.Context(), config); err != nil {
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
	repo := systempersistence.NewEmailConfigRepository(db)
	err := repo.Delete(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "删除邮箱配置失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetEmailTemplates(c *gin.Context) {
	db := database.MustGetDB()
	repo := systempersistence.NewEmailTemplateRepository(db)
	templates, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取邮件模板失败: "+err.Error())
		return
	}
	dtos := make([]*systemdomain.EmailTemplateDTO, len(templates))
	for i, t := range templates {
		dtos[i] = t.ToDTO()
	}
	response.Success(c, gin.H{"templates": dtos})
}

func GetEmailTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "缺少模板ID")
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewEmailTemplateRepository(db)
	template, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, template.ToDTO())
}

type CreateEmailTemplateRequest struct {
	Name        string             `json:"name" binding:"required"`
	Code        string             `json:"code" binding:"required"`
	Subject     string             `json:"subject" binding:"required"`
	ContentType string             `json:"contentType"`
	Content     string             `json:"content" binding:"required"`
	Description string             `json:"description"`
	Variables   systemdomain.JSONB `json:"variables"`
	Status      int                `json:"status"`
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
	repo := systempersistence.NewEmailTemplateRepository(db)

	template := systemdomain.NewEmailTemplate("", req.Name, req.Code, req.Subject)
	template.SetContentType(req.ContentType)
	template.SetContent(req.Content)
	template.SetDescription(req.Description)
	template.SetVariables(req.Variables)
	template.SetStatus(systemdomain.EmailTemplateStatus(req.Status))

	if err := repo.Save(c.Request.Context(), template); err != nil {
		response.Error(c, 500, "创建邮件模板失败: "+err.Error())
		return
	}
	response.Success(c, template.ToDTO())
}

type UpdateEmailTemplateRequest struct {
	Name        string             `json:"name" binding:"required"`
	Subject     string             `json:"subject" binding:"required"`
	ContentType string             `json:"contentType"`
	Content     string             `json:"content" binding:"required"`
	Description string             `json:"description"`
	Variables   systemdomain.JSONB `json:"variables"`
	Status      int                `json:"status"`
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
	repo := systempersistence.NewEmailTemplateRepository(db)

	template, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "获取邮件模板失败: "+err.Error())
		return
	}

	template.SetName(req.Name)
	template.SetSubject(req.Subject)
	template.SetContentType(req.ContentType)
	template.SetContent(req.Content)
	template.SetDescription(req.Description)
	template.SetVariables(req.Variables)
	template.SetStatus(systemdomain.EmailTemplateStatus(req.Status))

	if err := repo.Save(c.Request.Context(), template); err != nil {
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
	repo := systempersistence.NewEmailTemplateRepository(db)
	err := repo.Delete(c.Request.Context(), id)
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

	redisClient := database.MustGetRedis()
	queueService := email.GetQueueService(redisClient)

	task := &email.EmailTask{
		To:         req.ToEmail,
		Subject:    req.Subject,
		Content:    req.Content,
		ConfigCode: req.ConfigID,
		Source:     "gin",
	}

	if err := queueService.Enqueue(c.Request.Context(), task); err != nil {
		response.Error(c, 500, "邮件任务入队失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "邮件任务已加入发送队列",
		"taskId":  task.ID,
	})
}

type SendEmailRequest struct {
	ConfigCode   string                 `json:"configCode,omitempty"`
	TemplateCode string                 `json:"templateCode,omitempty"`
	To           string                 `json:"to" binding:"required,email"`
	Subject      string                 `json:"subject,omitempty"`
	Content      string                 `json:"content,omitempty"`
	Variables    map[string]interface{} `json:"variables,omitempty"`
}

func SendEmail(c *gin.Context) {
	var req SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	if req.TemplateCode == "" && (req.Subject == "" || req.Content == "") {
		response.Error(c, 400, "使用模板时需要提供 templateCode，否则需要提供 subject 和 content")
		return
	}

	redisClient := database.MustGetRedis()
	queueService := email.GetQueueService(redisClient)

	task := &email.EmailTask{
		To:           req.To,
		Subject:      req.Subject,
		Content:      req.Content,
		TemplateCode: req.TemplateCode,
		ConfigCode:   req.ConfigCode,
		Variables:    req.Variables,
		Source:       "gin",
	}

	if err := queueService.Enqueue(c.Request.Context(), task); err != nil {
		response.Error(c, 500, "邮件任务入队失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"success": true,
		"message": "邮件任务已加入发送队列",
		"taskId":  task.ID,
	})
}

func GetEmailQueueStatus(c *gin.Context) {
	redisClient := database.MustGetRedis()
	queueService := email.GetQueueService(redisClient)

	queueLength, err := queueService.GetQueueLength(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取队列状态失败: "+err.Error())
		return
	}

	retryLength, err := queueService.GetRetryQueueLength(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取重试队列状态失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"queueLength":      queueLength,
		"retryQueueLength": retryLength,
	})
}
