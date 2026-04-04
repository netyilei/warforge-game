// Package storage 提供 Nakama Storage Collection 定义
//
// 本文件定义 Storage Collection 名称和相关数据结构，包括：
// - Collection 名称常量
// - 用户存储结构
// - 钱包存储结构
package storage

const (
	CollectionUser      = "user"      // 用户信息
	CollectionWallet    = "wallet"    // 钱包信息
	CollectionClub      = "club"      // 俱乐部
	CollectionMatch     = "match"     // 比赛记录
	CollectionConfig    = "config"    // 配置
	CollectionInventory = "inventory" // 背包
)

// UserStorage 用户存储结构
type UserStorage struct {
	UserID    string `json:"userId"`    // 用户ID
	Nickname  string `json:"nickname"`  // 昵称
	Avatar    string `json:"avatar"`    // 头像
	Level     int    `json:"level"`     // 等级
	Exp       int64  `json:"exp"`       // 经验值
	CreatedAt int64  `json:"createdAt"` // 创建时间
	UpdatedAt int64  `json:"updatedAt"` // 更新时间
}

// WalletStorage 钱包存储结构
type WalletStorage struct {
	UserID    string `json:"userId"`    // 用户ID
	Gold      int64  `json:"gold"`      // 金币
	Diamond   int64  `json:"diamond"`   // 钻石
	UpdatedAt int64  `json:"updatedAt"` // 更新时间
}
