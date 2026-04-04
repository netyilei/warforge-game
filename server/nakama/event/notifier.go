// Package event 提供 Nakama 事件处理函数
//
// 本文件实现通知发送功能，包括：
// - 用户通知发送
package event

import (
	"context"

	"github.com/heroiclabs/nakama-common/runtime"
)

// NotifyUser 向指定用户发送通知
//
// 参数：
// - ctx: 上下文
// - nk: Nakama 模块
// - userID: 目标用户ID
// - subject: 通知主题
// - content: 通知内容
func NotifyUser(ctx context.Context, nk runtime.NakamaModule, userID string, subject string, content string) error {
	notification := map[string]interface{}{
		"subject": subject,
		"content": content,
	}

	err := nk.NotificationsSend(ctx, []*runtime.NotificationSend{
		{
			UserID:     userID,
			Subject:    subject,
			Content:    notification,
			Code:       1,
			Persistent: true,
		},
	})

	return err
}
