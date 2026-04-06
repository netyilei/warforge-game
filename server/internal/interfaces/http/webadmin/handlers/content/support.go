package content

import (
	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/email"

	"github.com/gin-gonic/gin"
)

type SendEmailRequest struct {
	To      string `json:"to" binding:"required,email"`
	Subject string `json:"subject" binding:"required"`
	Content string `json:"content" binding:"required"`
}

func SendSupportEmail(c *gin.Context) {
	var req SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	db := database.MustGetDB()
	repo := systempersistence.NewEmailConfigRepository(db)

	config, err := repo.FindDefault(c.Request.Context())
	if err != nil {
		response.Error(c, 500, "获取邮件配置失败: "+err.Error())
		return
	}

	if config == nil {
		response.Error(c, 400, "未配置邮件服务")
		return
	}

	if config.Status() != systemdomain.EmailConfigStatusActive {
		response.Error(c, 400, "邮件服务未启用")
		return
	}

	err = email.Send(config.ToDTO(), req.To, req.Subject, req.Content)
	if err != nil {
		response.Error(c, 500, "发送邮件失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "邮件发送成功",
	})
}
