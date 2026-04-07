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

	"warforge-server/database"
	"warforge-server/pkg/email"

	"github.com/heroiclabs/nakama-common/runtime"
)

const (
	VerificationCodeExpiry = 10 * time.Minute
	PasswordResetExpiry    = 30 * time.Minute
)

func RegisterAuthEmailRPC(initializer runtime.Initializer) error {
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
	return nil
}

func sendVerificationCode(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		Email        string `json:"email"`
		TemplateCode string `json:"templateCode,omitempty"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := map[string]interface{}{"success": false, "message": "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" {
		resp := map[string]interface{}{"success": false, "message": "邮箱地址不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	code := generateCode(6)

	templateCode := req.TemplateCode
	if templateCode == "" {
		templateCode = "verification_code"
	}

	redisClient := database.GetRedis()
	if redisClient == nil {
		resp := map[string]interface{}{"success": false, "message": "Redis 服务不可用"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	queueService := email.GetQueueService(redisClient)

	task := &email.EmailTask{
		To:           req.Email,
		TemplateCode: templateCode,
		Variables: map[string]interface{}{
			"code":  code,
			"email": req.Email,
		},
		Source: "nakama",
	}

	if err := queueService.Enqueue(ctx, task); err != nil {
		logger.Error("Failed to enqueue verification code: %v", err)
		resp := map[string]interface{}{"success": false, "message": "邮件任务入队失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	expiry := time.Now().Add(VerificationCodeExpiry).Unix()
	storageKey := fmt.Sprintf("verification_code:%s", req.Email)
	codeData := fmt.Sprintf(`{"code":"%s","expiry":%d,"type":"verification"}`, code, expiry)

	_, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{
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

	logger.Info("Verification code enqueued for: %s, taskId: %s", req.Email, task.ID)
	resp := map[string]interface{}{"success": true, "message": "验证码已加入发送队列", "code": code, "taskId": task.ID}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func verifyCode(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		Email string `json:"email"`
		Code  string `json:"code"`
		Type  string `json:"type"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := map[string]interface{}{"success": false, "message": "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" || req.Code == "" {
		resp := map[string]interface{}{"success": false, "message": "邮箱和验证码不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	storageKey := fmt.Sprintf("verification_code:%s", req.Email)
	objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
		{Collection: "email_codes", Key: storageKey},
	})
	if err != nil || len(objects) == 0 {
		resp := map[string]interface{}{"success": false, "message": "验证码不存在或已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	var storedData struct {
		Code   string `json:"code"`
		Expiry int64  `json:"expiry"`
		Type   string `json:"type"`
	}
	if err := json.Unmarshal([]byte(objects[0].Value), &storedData); err != nil {
		resp := map[string]interface{}{"success": false, "message": "验证码数据解析失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if time.Now().Unix() > storedData.Expiry {
		nk.StorageDelete(ctx, []*runtime.StorageDelete{
			{Collection: "email_codes", Key: storageKey},
		})
		resp := map[string]interface{}{"success": false, "message": "验证码已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if storedData.Code != req.Code {
		resp := map[string]interface{}{"success": false, "message": "验证码错误"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{Collection: "email_codes", Key: storageKey},
	})

	logger.Info("Code verified for: %s", req.Email)
	resp := map[string]interface{}{"success": true, "message": "验证成功"}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func sendPasswordReset(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := map[string]interface{}{"success": false, "message": "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" {
		resp := map[string]interface{}{"success": false, "message": "邮箱地址不能为空"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	token := generateToken(32)

	redisClient := database.GetRedis()
	if redisClient == nil {
		resp := map[string]interface{}{"success": false, "message": "Redis 服务不可用"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	queueService := email.GetQueueService(redisClient)

	task := &email.EmailTask{
		To:           req.Email,
		TemplateCode: "password_reset",
		Variables: map[string]interface{}{
			"token": token,
			"email": req.Email,
		},
		Source: "nakama",
	}

	if err := queueService.Enqueue(ctx, task); err != nil {
		logger.Error("Failed to enqueue password reset email: %v", err)
		resp := map[string]interface{}{"success": false, "message": "邮件任务入队失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	expiry := time.Now().Add(PasswordResetExpiry).Unix()
	storageKey := fmt.Sprintf("password_reset:%s", req.Email)
	tokenData := fmt.Sprintf(`{"token":"%s","expiry":%d}`, token, expiry)

	_, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{
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

	logger.Info("Password reset email enqueued for: %s, taskId: %s", req.Email, task.ID)
	resp := map[string]interface{}{"success": true, "message": "密码重置邮件已加入发送队列", "token": token, "taskId": task.ID}
	data, _ := json.Marshal(resp)
	return string(data), nil
}

func resetPassword(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		Email    string `json:"email"`
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		resp := map[string]interface{}{"success": false, "message": "无效的请求参数"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if req.Email == "" || req.Token == "" || req.Password == "" {
		resp := map[string]interface{}{"success": false, "message": "参数不完整"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	storageKey := fmt.Sprintf("password_reset:%s", req.Email)
	objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
		{Collection: "email_codes", Key: storageKey},
	})
	if err != nil || len(objects) == 0 {
		resp := map[string]interface{}{"success": false, "message": "重置令牌不存在或已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	var storedData struct {
		Token  string `json:"token"`
		Expiry int64  `json:"expiry"`
	}
	if err := json.Unmarshal([]byte(objects[0].Value), &storedData); err != nil {
		resp := map[string]interface{}{"success": false, "message": "令牌数据解析失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if time.Now().Unix() > storedData.Expiry {
		nk.StorageDelete(ctx, []*runtime.StorageDelete{
			{Collection: "email_codes", Key: storageKey},
		})
		resp := map[string]interface{}{"success": false, "message": "重置令牌已过期"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	if storedData.Token != req.Token {
		resp := map[string]interface{}{"success": false, "message": "重置令牌无效"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	query := `UPDATE users SET password = $1, update_time = $2 WHERE email = $3`
	_, err = db.Exec(query, req.Password, time.Now(), req.Email)
	if err != nil {
		resp := map[string]interface{}{"success": false, "message": "密码重置失败"}
		data, _ := json.Marshal(resp)
		return string(data), nil
	}

	nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{Collection: "email_codes", Key: storageKey},
	})

	logger.Info("Password reset for: %s", req.Email)
	resp := map[string]interface{}{"success": true, "message": "密码重置成功"}
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
