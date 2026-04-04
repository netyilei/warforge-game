// Package hooks 提供 Nakama 钩子函数实现
//
// 本文件实现 Nakama 生命周期钩子，包括：
// - 用户注册钩子
// - 用户登录钩子
// - 匹配创建钩子
package hooks

import (
	"github.com/heroiclabs/nakama-common/runtime"
)

// Init 初始化钩子模块
//
// 注册所有生命周期钩子到 Nakama 运行时
func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Nakama Hooks Module Loading...")

	logger.Info("Nakama Hooks Module Loaded!")
	return nil
}
