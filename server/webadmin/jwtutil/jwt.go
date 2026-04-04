// Package jwtutil 提供 JWT Token 管理功能
//
// 本文件实现管理后台的 JWT 认证，包括：
// - Token 生成
// - Token 验证
// - Token 失效
package jwtutil

import (
	"context"
	"errors"
	"time"

	"warforge-server/config"
	"warforge-server/database"

	"github.com/golang-jwt/jwt/v5"
)

// AdminClaims 管理员 JWT Claims
//
// 包含用户 ID、用户名和 Token 类型
type AdminClaims struct {
	UserID    string `json:"user_id"`
	Username  string `json:"username"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT Token
//
// 生成访问 Token 和刷新 Token，并将 Token 存储到 Redis
func GenerateToken(userID, username string) (string, string, error) {
	cfg := config.AppConfig
	secretKey := []byte(cfg.WebAdmin.SecretKey)

	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	claims := AdminClaims{
		UserID:    userID,
		Username:  username,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    "warforge-admin",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(secretKey)
	if err != nil {
		return "", "", err
	}

	refreshClaims := AdminClaims{
		UserID:    userID,
		Username:  username,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    "warforge-admin",
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(secretKey)
	if err != nil {
		return "", "", err
	}

	ctx := context.Background()
	redisClient := database.GetRedis()
	if redisClient != nil {
		tokenKey := database.GetAdminTokenKey(userID)
		redisClient.Set(ctx, tokenKey, accessToken, 24*time.Hour)

		refreshKey := database.GetAdminRefreshKey(userID)
		redisClient.Set(ctx, refreshKey, refreshTokenString, 7*24*time.Hour)
	}

	return accessToken, refreshTokenString, nil
}

// ValidateToken 验证 JWT Token
//
// 验证 Token 签名和有效期，并检查 Redis 中是否已失效
func ValidateToken(tokenString string) (*AdminClaims, error) {
	cfg := config.AppConfig
	secretKey := []byte(cfg.WebAdmin.SecretKey)

	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*AdminClaims); ok && token.Valid {
		redisClient := database.GetRedis()
		if redisClient != nil {
			ctx := context.Background()
			tokenKey := database.GetAdminTokenKey(claims.UserID)
			storedToken, err := redisClient.Get(ctx, tokenKey).Result()
			if err != nil || storedToken != tokenString {
				return nil, errors.New("token invalidated")
			}
		}
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// InvalidateToken 使 Token 失效
//
// 从 Redis 中删除用户的 Token，使其立即失效
func InvalidateToken(userID string) {
	redisClient := database.GetRedis()
	if redisClient != nil {
		ctx := context.Background()
		tokenKey := database.GetAdminTokenKey(userID)
		redisClient.Del(ctx, tokenKey)

		refreshKey := database.GetAdminRefreshKey(userID)
		redisClient.Del(ctx, refreshKey)
	}
}
