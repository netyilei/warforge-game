package rpc

import (
	"context"
	"database/sql"
	"encoding/json"

	"warforge-server/database"
	"warforge-server/pkg/email"

	"github.com/heroiclabs/nakama-common/runtime"
)

type SendEmailRequest struct {
	ConfigCode   string                 `json:"configCode,omitempty"`
	TemplateCode string                 `json:"templateCode,omitempty"`
	To           string                 `json:"to"`
	Subject      string                 `json:"subject,omitempty"`
	Content      string                 `json:"content,omitempty"`
	Variables    map[string]interface{} `json:"variables,omitempty"`
}

type SendEmailResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	TaskID  string `json:"taskId,omitempty"`
}

func RegisterEmailRPC(initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("send_email", sendEmail); err != nil {
		return err
	}
	return nil
}

func sendEmail(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req SendEmailRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := SendEmailResponse{Success: false, Message: "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.To == "" {
		resp := SendEmailResponse{Success: false, Message: "收件人地址不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.TemplateCode == "" && (req.Subject == "" || req.Content == "") {
		resp := SendEmailResponse{Success: false, Message: "使用模板时需要提供 templateCode，否则需要提供 subject 和 content"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	redisClient := database.GetRedis()
	if redisClient == nil {
		resp := SendEmailResponse{Success: false, Message: "Redis 服务不可用"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	queueService := email.GetQueueService(redisClient)

	task := &email.EmailTask{
		To:           req.To,
		Subject:      req.Subject,
		Content:      req.Content,
		TemplateCode: req.TemplateCode,
		ConfigCode:   req.ConfigCode,
		Variables:    req.Variables,
		Source:       "nakama",
	}

	if err := queueService.Enqueue(ctx, task); err != nil {
		logger.Error("Failed to enqueue email task: %v", err)
		resp := SendEmailResponse{Success: false, Message: "邮件任务入队失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	logger.Info("Email task enqueued: %s, to: %s", task.ID, req.To)
	resp := SendEmailResponse{
		Success: true,
		Message: "邮件任务已加入发送队列",
		TaskID:  task.ID,
	}
	data, _ := json.Marshal(resp)
	return string(data), nil
}
