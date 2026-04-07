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

	fmt.Printf("连接数据库: %s:%d/%s\n\n", config.Database.Host, config.Database.Port, config.Database.Name)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("=== 检查客服菜单 ===")
	var supportMenuID string
	err = db.QueryRow(`SELECT id FROM admin_permissions WHERE code = 'support' AND type = 'menu'`).Scan(&supportMenuID)
	if err == sql.ErrNoRows {
		fmt.Println("  ✗ 缺失客服一级菜单")
	} else if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("  ✓ 客服一级菜单存在:", supportMenuID[:8])
	}

	var sendEmailMenuID string
	err = db.QueryRow(`SELECT id FROM admin_permissions WHERE code = 'support_send_email' AND type = 'menu'`).Scan(&sendEmailMenuID)
	if err == sql.ErrNoRows {
		fmt.Println("  ✗ 缺失发送邮件二级菜单")
	} else if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("  ✓ 发送邮件二级菜单存在:", sendEmailMenuID[:8])
	}

	fmt.Println("\n=== 检查用户管理菜单 ===")
	var userMenuID string
	err = db.QueryRow(`SELECT id FROM admin_permissions WHERE code = 'user' AND type = 'menu'`).Scan(&userMenuID)
	if err == sql.ErrNoRows {
		fmt.Println("  ✗ 缺失用户管理一级菜单")
	} else if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("  ✓ 用户管理一级菜单存在:", userMenuID[:8])
	}

	fmt.Println("\n=== 检查超级管理员权限 ===")
	var superAdminRoleID string
	err = db.QueryRow(`SELECT id FROM admin_roles WHERE code = 'super_admin'`).Scan(&superAdminRoleID)
	if err != nil {
		log.Fatal("查找超级管理员角色失败:", err)
	}
	fmt.Println("  超级管理员角色ID:", superAdminRoleID)

	rows, err := db.Query(`
		SELECT p.code, p.name
		FROM admin_permissions p
		JOIN admin_role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1 AND p.type = 'menu'
		ORDER BY p.sort_order
	`, superAdminRoleID)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("\n  超级管理员的菜单权限：")
	for rows.Next() {
		var code, name string
		err := rows.Scan(&code, &name)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("    - %-20s | %s\n", code, name)
	}

	fmt.Println("\n=== 检查邮件配置 ===")
	var emailConfigCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM email_configs WHERE deleted_at IS NULL`).Scan(&emailConfigCount)
	if err != nil {
		fmt.Println("  ✗ email_configs 表不存在或查询失败:", err)
	} else {
		fmt.Printf("  ✓ email_configs 表存在，记录数: %d\n", emailConfigCount)
	}

	fmt.Println("\n=== 检查邮件模板 ===")
	var emailTemplateCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM email_templates WHERE deleted_at IS NULL`).Scan(&emailTemplateCount)
	if err != nil {
		fmt.Println("  ✗ email_templates 表不存在或查询失败:", err)
	} else {
		fmt.Printf("  ✓ email_templates 表存在，记录数: %d\n", emailTemplateCount)
	}

	fmt.Println("\n=== 检查语言设置 ===")
	var languageCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM wf_languages`).Scan(&languageCount)
	if err != nil {
		fmt.Println("  ✗ wf_languages 表不存在或查询失败:", err)
	} else {
		fmt.Printf("  ✓ wf_languages 表存在，记录数: %d\n", languageCount)
	}

	fmt.Println("\n=== 检查存储配置 ===")
	var storageConfigCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM wf_storage_configs`).Scan(&storageConfigCount)
	if err != nil {
		fmt.Println("  ✗ wf_storage_configs 表不存在或查询失败:", err)
	} else {
		fmt.Printf("  ✓ wf_storage_configs 表存在，记录数: %d\n", storageConfigCount)
	}
}
