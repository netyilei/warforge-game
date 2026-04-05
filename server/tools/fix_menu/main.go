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

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}

	_, err = tx.Exec(`
		UPDATE admin_permissions 
		SET code = 'support_send_email', path = '/support/send-email', sort_order = 1 
		WHERE name = '发送邮件' AND type = 'menu'
	`)
	if err != nil {
		tx.Rollback()
		log.Fatal("更新发送邮件失败:", err)
	}
	fmt.Println("✓ 发送邮件：code 改为 support_send_email，路径改为 /support/send-email")

	userManageID := "10000000-0000-0000-0000-000000000001"

	_, err = tx.Exec(`
		INSERT INTO admin_permissions (id, name, code, type, parent_id, path, component, icon, sort_order, show_in_menu, status)
		VALUES ($1, '用户管理', 'user', 'menu', '00000000-0000-0000-0000-000000000000', '/user', 'layout.base', 'ic:outline-people', 1, true, 1)
		ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
	`, userManageID)
	if err != nil {
		tx.Rollback()
		log.Fatal("添加用户管理菜单失败:", err)
	}
	fmt.Println("✓ 添加一级菜单：用户管理 (code: user)")

	_, err = tx.Exec(`
		UPDATE admin_permissions 
		SET parent_id = $1, sort_order = 1 
		WHERE code = 'user_manage'
	`, userManageID)
	if err != nil {
		tx.Rollback()
		log.Fatal("更新用户列表失败:", err)
	}
	fmt.Println("✓ 用户列表移到用户管理下")

	_, err = tx.Exec(`
		UPDATE admin_permissions 
		SET parent_id = $1, sort_order = 2 
		WHERE code = 'user_approval'
	`, userManageID)
	if err != nil {
		tx.Rollback()
		log.Fatal("更新用户审批失败:", err)
	}
	fmt.Println("✓ 用户审批移到用户管理下")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 2 WHERE code = 'admin'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 系统管理排序改为 2")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 3 WHERE code = 'content'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 内容管理排序改为 3")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 4 WHERE code = 'storage'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 存储管理排序改为 4")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 5 WHERE code = 'support'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 客服排序改为 5")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 6 WHERE code = 'operations'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 运维管理排序改为 6")

	_, err = tx.Exec(`UPDATE admin_permissions SET sort_order = 7 WHERE code = 'settings'`)
	if err != nil {
		tx.Rollback()
		log.Fatal(err)
	}
	fmt.Println("✓ 设置排序改为 7")

	err = tx.Commit()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("\n修复完成！")
}
