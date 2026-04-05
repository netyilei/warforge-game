package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Database struct {
		Host     string `yaml:"host"`
		Port     int    `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		Name     string `yaml:"name"`
		SSLMode  string `yaml:"sslmode"`
	} `yaml:"database"`
}

func loadConfig() *Config {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config/config.yaml"
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		log.Fatal("读取配置文件失败:", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		log.Fatal("解析配置文件失败:", err)
	}

	if host := os.Getenv("DB_HOST"); host != "" {
		config.Database.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		fmt.Sscanf(port, "%d", &config.Database.Port)
	}

	return &config
}

func main() {
	config := loadConfig()

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
		config.Database.SSLMode,
	)

	fmt.Printf("连接数据库: %s:%d/%s\n", config.Database.Host, config.Database.Port, config.Database.Name)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	var superAdminRoleID string
	err = db.QueryRow(`SELECT id FROM admin_roles WHERE code = 'super_admin'`).Scan(&superAdminRoleID)
	if err != nil {
		log.Fatal("查找超级管理员角色失败:", err)
	}
	fmt.Println("超级管理员角色ID:", superAdminRoleID)

	var userManageID string
	err = db.QueryRow(`SELECT id FROM admin_permissions WHERE code = 'user' AND type = 'menu'`).Scan(&userManageID)
	if err != nil {
		log.Fatal("查找用户管理菜单失败:", err)
	}
	fmt.Println("用户管理菜单ID:", userManageID)

	_, err = db.Exec(`
		INSERT INTO admin_role_permissions (role_id, permission_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, superAdminRoleID, userManageID)
	if err != nil {
		log.Fatal("添加用户管理权限失败:", err)
	}
	fmt.Println("✓ 已为超级管理员添加用户管理权限")

	rows, err := db.Query(`
		SELECT p.name, p.code, p.type
		FROM admin_permissions p
		JOIN admin_role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1 AND p.type = 'menu'
		ORDER BY p.sort_order
	`, superAdminRoleID)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("\n超级管理员的菜单权限：")
	for rows.Next() {
		var name, code, permType string
		err := rows.Scan(&name, &code, &permType)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("  - %-12s | %s\n", name, code)
	}
}
