// Package config 提供配置管理功能
//
// 本文件实现配置加载和环境变量覆盖，包括：
// - 服务器配置
// - 数据库配置
// - Redis 配置
// - WebAdmin 配置
// - 日志配置
package config

import (
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Config 应用配置结构
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Redis    RedisConfig    `yaml:"redis"`
	WebAdmin WebAdminConfig `yaml:"web_admin"`
	Log      LogConfig      `yaml:"log"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port          int `yaml:"port"`
	GrpcPort      int `yaml:"grpc_port"`
	WebsocketPort int `yaml:"websocket_port"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host         string `yaml:"host"`
	Port         int    `yaml:"port"`
	User         string `yaml:"user"`
	Password     string `yaml:"password"`
	Name         string `yaml:"name"`
	Sslmode      string `yaml:"sslmode"`
	MaxOpenConns int    `yaml:"max_open_conns"`
	MaxIdleConns int    `yaml:"max_idle_conns"`
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
}

// WebAdminConfig 管理后台配置
type WebAdminConfig struct {
	Enabled   bool   `yaml:"enabled"`
	Port      int    `yaml:"port"`
	SecretKey string `yaml:"secret_key"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

// AppConfig 全局配置实例
var AppConfig *Config

// LoadConfig 加载配置文件
//
// 从指定路径加载 YAML 配置文件，并支持环境变量覆盖
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	expandEnvVars(&cfg)

	AppConfig = &cfg
	return &cfg, nil
}

// expandEnvVars 使用环境变量覆盖配置
//
// 支持的环境变量：
// - DB_HOST: 数据库主机
// - DB_PORT: 数据库端口
// - DB_USER: 数据库用户
// - DB_PASSWORD: 数据库密码
// - DB_NAME: 数据库名称
// - REDIS_HOST: Redis 主机
// - REDIS_PORT: Redis 端口
// - REDIS_PASSWORD: Redis 密码
// - WEB_ADMIN_ENABLED: 是否启用管理后台
// - WEB_ADMIN_PORT: 管理后台端口
func expandEnvVars(cfg *Config) {
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			cfg.Database.Port = port
		}
	}
	if v := os.Getenv("DB_USER"); v != "" {
		cfg.Database.User = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Database.Password = v
	}
	if v := os.Getenv("DB_NAME"); v != "" {
		cfg.Database.Name = v
	}
	if v := os.Getenv("REDIS_HOST"); v != "" {
		cfg.Redis.Host = v
	}
	if v := os.Getenv("REDIS_PORT"); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			cfg.Redis.Port = port
		}
	}
	if v := os.Getenv("REDIS_PASSWORD"); v != "" {
		cfg.Redis.Password = v
	}
	if v := os.Getenv("WEB_ADMIN_ENABLED"); v != "" {
		if enabled, err := strconv.ParseBool(v); err == nil {
			cfg.WebAdmin.Enabled = enabled
		}
	}
	if v := os.Getenv("WEB_ADMIN_PORT"); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			cfg.WebAdmin.Port = port
		}
	}
}
