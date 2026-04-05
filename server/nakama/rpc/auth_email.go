package rpc

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"warforge-server/models"
	"warforge-server/utils"

	"github.com/heroiclabs/nakama-common/runtime"
)

type SendVerificationCodeRequest struct {
	Email        string `json:"email"`
	TemplateCode string `json:"templateCode,omitempty"`
}

type SendVerificationCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

type SendPasswordResetRequest struct {
	Email string `json:"email"`
}

type SendPasswordResetResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Token   string `json:"token,omitempty"`
}

type VerifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
	Type  string `json:"type"`
}

type VerifyCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

type ResetPasswordRequest struct {
	Email    string `json:"email"`
	Token    string `json:"token"`
	Password string `json:"password"`
}

type ResetPasswordResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

const (
	VerificationCodeExpiry = 10 * time.Minute
	PasswordResetExpiry    = 30 * time.Minute
)

func InitAuthEmail(logger runtime.Logger, initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("send_verification_code", sendVerificationCode); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("verify_code", verifyCode); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("send_password_reset", sendPasswordReset); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("reset_password", resetPassword); err != nil {
		return err
	}
	logger.Info("Auth Email RPC registered")
	return nil
}

func sendVerificationCode(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req SendVerificationCodeRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := SendVerificationCodeResponse{Success: false, Message: "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" {
		resp := SendVerificationCodeResponse{Success: false, Message: "邮箱地址不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	code := generateCode(6)

	templateCode := req.TemplateCode
	if templateCode == "" {
		templateCode = "verification_code"
	}

	template, err := models.EmailTemplate{}.GetByCode(db, templateCode)
	if err != nil {
		resp := SendVerificationCodeResponse{Success: false, Message: "验证码模板不存在，请先创建模板: " + templateCode}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	config, err := models.EmailConfig{}.GetDefault(db)
	if err != nil {
		resp := SendVerificationCodeResponse{Success: false, Message: "邮箱配置不存在"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	subject := template.Subject
	content := template.Content
	content = replaceVariable(content, "code", code)
	content = replaceVariable(content, "email", req.Email)
	subject = replaceVariable(subject, "code", code)

	if err := utils.SendEmail(config, req.Email, subject, content); err != nil {
		logger.Error("Failed to send verification code: %v", err)
		resp := SendVerificationCodeResponse{Success: false, Message: fmt.Sprintf("发送失败: %v", err)}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	expiry := time.Now().Add(VerificationCodeExpiry).Unix()
	storageKey := fmt.Sprintf("verification_code:%s", req.Email)
	codeData := fmt.Sprintf(`{"code":"%s","expiry":%d,"type":"verification"}`, code, expiry)

	_, err = nk.StorageWrite(ctx, []*runtime.StorageWrite{
		{
			Collection:      "email_codes",
			Key:             storageKey,
			Value:           codeData,
			PermissionRead:  1,
			PermissionWrite: 0,
		},
	})
	if err != nil {
		logger.Error("Failed to store verification code: %v", err)
	}

	logger.Info("Verification code sent to: %s", req.Email)
	resp := SendVerificationCodeResponse{Success: true, Message: "验证码已发送", Code: code}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func verifyCode(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req VerifyCodeRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := VerifyCodeResponse{Success: false, Message: "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" || req.Code == "" {
		resp := VerifyCodeResponse{Success: false, Message: "邮箱和验证码不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	storageKey := fmt.Sprintf("verification_code:%s", req.Email)
	objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
		{Collection: "email_codes", Key: storageKey},
	})
	if err != nil || len(objects) == 0 {
		resp := VerifyCodeResponse{Success: false, Message: "验证码不存在或已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	var storedData struct {
		Code   string `json:"code"`
		Expiry int64  `json:"expiry"`
		Type   string `json:"type"`
	}
	if err := json.Unmarshal([]byte(objects[0].Value), &storedData); err != nil {
		resp := VerifyCodeResponse{Success: false, Message: "验证码数据解析失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if time.Now().Unix() > storedData.Expiry {
		nk.StorageDelete(ctx, []*runtime.StorageDelete{
			{Collection: "email_codes", Key: storageKey},
		})
		resp := VerifyCodeResponse{Success: false, Message: "验证码已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if storedData.Code != req.Code {
		resp := VerifyCodeResponse{Success: false, Message: "验证码错误"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{Collection: "email_codes", Key: storageKey},
	})

	logger.Info("Code verified for: %s", req.Email)
	resp := VerifyCodeResponse{Success: true, Message: "验证成功"}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func sendPasswordReset(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req SendPasswordResetRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := SendPasswordResetResponse{Success: false, Message: "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" {
		resp := SendPasswordResetResponse{Success: false, Message: "邮箱地址不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	users, err := nk.UsersGetId(ctx, []string{}, []string{})
	if err != nil {
		logger.Error("Failed to check user: %v", err)
	}

	_ = users

	token := generateToken(32)

	template, err := models.EmailTemplate{}.GetByCode(db, "password_reset")
	if err != nil {
		resp := SendPasswordResetResponse{Success: false, Message: "密码重置模板不存在，请先创建模板: password_reset"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	config, err := models.EmailConfig{}.GetDefault(db)
	if err != nil {
		resp := SendPasswordResetResponse{Success: false, Message: "邮箱配置不存在"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	subject := template.Subject
	content := template.Content
	content = replaceVariable(content, "token", token)
	content = replaceVariable(content, "email", req.Email)
	subject = replaceVariable(subject, "token", token)

	if err := utils.SendEmail(config, req.Email, subject, content); err != nil {
		logger.Error("Failed to send password reset email: %v", err)
		resp := SendPasswordResetResponse{Success: false, Message: fmt.Sprintf("发送失败: %v", err)}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	expiry := time.Now().Add(PasswordResetExpiry).Unix()
	storageKey := fmt.Sprintf("password_reset:%s", req.Email)
	tokenData := fmt.Sprintf(`{"token":"%s","expiry":%d}`, token, expiry)

	_, err = nk.StorageWrite(ctx, []*runtime.StorageWrite{
		{
			Collection:      "email_codes",
			Key:             storageKey,
			Value:           tokenData,
			PermissionRead:  1,
			PermissionWrite: 0,
		},
	})
	if err != nil {
		logger.Error("Failed to store reset token: %v", err)
	}

	logger.Info("Password reset email sent to: %s", req.Email)
	resp := SendPasswordResetResponse{Success: true, Message: "密码重置邮件已发送", Token: token}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func resetPassword(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req ResetPasswordRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := ResetPasswordResponse{Success: false, Message: "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" || req.Token == "" || req.Password == "" {
		resp := ResetPasswordResponse{Success: false, Message: "参数不完整"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	storageKey := fmt.Sprintf("password_reset:%s", req.Email)
	objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
		{Collection: "email_codes", Key: storageKey},
	})
	if err != nil || len(objects) == 0 {
		resp := ResetPasswordResponse{Success: false, Message: "重置令牌不存在或已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	var storedData struct {
		Token  string `json:"token"`
		Expiry int64  `json:"expiry"`
	}
	if err := json.Unmarshal([]byte(objects[0].Value), &storedData); err != nil {
		resp := ResetPasswordResponse{Success: false, Message: "令牌数据解析失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if time.Now().Unix() > storedData.Expiry {
		nk.StorageDelete(ctx, []*runtime.StorageDelete{
			{Collection: "email_codes", Key: storageKey},
		})
		resp := ResetPasswordResponse{Success: false, Message: "重置令牌已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if storedData.Token != req.Token {
		resp := ResetPasswordResponse{Success: false, Message: "重置令牌无效"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	query := `UPDATE users SET password = $1, update_time = $2 WHERE email = $3`
	_, err = db.Exec(query, req.Password, time.Now(), req.Email)
	if err != nil {
		resp := ResetPasswordResponse{Success: false, Message: "密码重置失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{Collection: "email_codes", Key: storageKey},
	})

	logger.Info("Password reset for: %s", req.Email)
	resp := ResetPasswordResponse{Success: true, Message: "密码重置成功"}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func generateCode(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	for i := range bytes {
		bytes[i] = '0' + (bytes[i] % 10)
	}
	return string(bytes)
}

func generateToken(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func replaceVariable(content, key, value string) string {
	placeholder := fmt.Sprintf("{{%s}}", key)
	return strings.ReplaceAll(content, placeholder, value)
}
