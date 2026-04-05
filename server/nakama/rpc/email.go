package rpc

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"warforge-server/models"
	"warforge-server/utils"

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
}

func InitEmail(logger runtime.Logger, initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("send_email", sendEmail); err != nil {
		return err
	}
	logger.Info("Email RPC registered")
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

	var config *models.EmailConfigDTO
	var err error

	if req.ConfigCode != "" {
		config, err = models.EmailConfig{}.GetByCode(db, req.ConfigCode)
	} else {
		config, err = models.EmailConfig{}.GetDefault(db)
	}

	if err != nil {
		resp := SendEmailResponse{Success: false, Message: "邮箱配置不存在或未设置默认配置"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	var subject, content string

	if req.TemplateCode != "" {
		template, err := models.EmailTemplate{}.GetByCode(db, req.TemplateCode)
		if err != nil {
			resp := SendEmailResponse{Success: false, Message: "邮件模板不存在"}
			data, _ := json.Marshal(resp)
			return string(data), nil
		}

		subject = template.Subject
		content = template.Content

		if req.Variables != nil {
			for key, value := range req.Variables {
				placeholder := fmt.Sprintf("{{%s}}", key)
				content = strings.ReplaceAll(content, placeholder, fmt.Sprintf("%v", value))
				subject = strings.ReplaceAll(subject, placeholder, fmt.Sprintf("%v", value))
			}
		}
	} else {
		if req.Subject == "" {
			resp := SendEmailResponse{Success: false, Message: "邮件主题不能为空"}
			data, _ := json.Marshal(resp)
			return string(data), nil
		}
		if req.Content == "" {
			resp := SendEmailResponse{Success: false, Message: "邮件内容不能为空"}
			data, _ := json.Marshal(resp)
			return string(data), nil
		}
		subject = req.Subject
		content = req.Content
	}

	if err := utils.SendEmail(config, req.To, subject, content); err != nil {
		logger.Error("Failed to send email: %v", err)
		resp := SendEmailResponse{Success: false, Message: fmt.Sprintf("发送失败: %v", err)}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	logger.Info("Email sent successfully to: %s", req.To)
	resp := SendEmailResponse{Success: true, Message: "邮件发送成功"}
	data, _ := json.Marshal(resp)
	return string(data), nil
}
