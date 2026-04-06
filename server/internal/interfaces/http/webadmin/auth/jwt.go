package auth

import (
	"context"
	"errors"
	"time"

	"warforge-server/config"
	"warforge-server/database"

	"github.com/golang-jwt/jwt/v5"
)

type AdminClaims struct {
	UserID    string `json:"user_id"`
	Username  string `json:"username"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

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

func RefreshAccessToken(refreshTokenString string) (string, string, error) {
	cfg := config.AppConfig
	secretKey := []byte(cfg.WebAdmin.SecretKey)

	token, err := jwt.ParseWithClaims(refreshTokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secretKey, nil
	})

	if err != nil {
		return "", "", err
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return "", "", errors.New("invalid refresh token")
	}

	if claims.TokenType != "refresh" {
		return "", "", errors.New("token is not a refresh token")
	}

	redisClient := database.GetRedis()
	if redisClient != nil {
		ctx := context.Background()
		refreshKey := database.GetAdminRefreshKey(claims.UserID)
		storedToken, err := redisClient.Get(ctx, refreshKey).Result()
		if err != nil || storedToken != refreshTokenString {
			return "", "", errors.New("refresh token invalidated")
		}
	}

	return GenerateToken(claims.UserID, claims.Username)
}
