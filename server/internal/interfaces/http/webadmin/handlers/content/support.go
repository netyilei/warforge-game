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
	To      interface{} `json:"to" binding:"required"`
	Subject string      `json:"subject" binding:"required"`
	Content string      `json:"content" binding:"required"`
}

func SendSupportEmail(c *gin.Context) {
	var req SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}

	var toList []string
	switch v := req.To.(type) {
	case string:
		if v == "" {
			response.Error(c, 400, "收件人邮箱不能为空")
			return
		}
		toList = []string{v}
	case []interface{}:
		for _, item := range v {
			if emailStr, ok := item.(string); ok && emailStr != "" {
				toList = append(toList, emailStr)
			}
		}
		if len(toList) == 0 {
			response.Error(c, 400, "收件人邮箱不能为空")
			return
		}
	default:
		response.Error(c, 400, "收件人格式错误，应为字符串或数组")
		return
	}

	if len(toList) > 100 {
		response.Error(c, 400, "单次最多发送100封邮件")
		return
	}

	for _, to := range toList {
		if !isValidEmail(to) {
			response.Error(c, 400, "邮箱地址格式无效: "+to)
			return
		}
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

	redisClient := database.MustGetRedis()
	queueService := email.GetQueueService(redisClient)

	var taskIDs []string
	for _, to := range toList {
		task := &email.EmailTask{
			To:      to,
			Subject: req.Subject,
			Content: req.Content,
			Source:  "support",
		}
		if err := queueService.Enqueue(c.Request.Context(), task); err != nil {
			response.Error(c, 500, "邮件任务入队失败: "+err.Error())
			return
		}
		taskIDs = append(taskIDs, task.ID)
	}

	if len(toList) == 1 {
		response.Success(c, gin.H{
			"message": "邮件已加入发送队列",
			"taskId":  taskIDs[0],
			"count":   1,
		})
	} else {
		response.Success(c, gin.H{
			"message": "批量邮件已加入发送队列",
			"taskIds": taskIDs,
			"count":   len(toList),
		})
	}
}

func isValidEmail(email string) bool {
	if len(email) == 0 || len(email) > 254 {
		return false
	}
	atIndex := -1
	for i, c := range email {
		if c == '@' {
			if atIndex != -1 {
				return false
			}
			atIndex = i
		}
	}
	if atIndex <= 0 || atIndex >= len(email)-1 {
		return false
	}
	return true
}
