package main

import (
	"database/sql"
	"flag"
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
	flag.Parse()

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

	fmt.Println("\n=== 完整菜单结构 ===")
	rows, err := db.Query(`
		SELECT id, name, code, type, parent_id, path, sort_order, show_in_menu, status
		FROM admin_permissions 
		WHERE type = 'menu'
		ORDER BY sort_order, name
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, name, code, permType string
		var parentID sql.NullString
		var path sql.NullString
		var sortOrder int
		var showInMenu bool
		var status int
		err := rows.Scan(&id, &name, &code, &permType, &parentID, &path, &sortOrder, &showInMenu, &status)
		if err != nil {
			log.Fatal(err)
		}
		parent := "顶级"
		if parentID.Valid && parentID.String != "" && parentID.String != "00000000-0000-0000-0000-000000000000" {
			var parentName string
			db.QueryRow(`SELECT name FROM admin_permissions WHERE id = $1`, parentID.String).Scan(&parentName)
			parent = parentName
		}
		show := "✓"
		if !showInMenu {
			show = "✗"
		}
		stat := "启用"
		if status != 1 {
			stat = "禁用"
		}
		fmt.Printf("排序%02d | %-12s | %-20s | 父: %-10s | 显示:%s | %s | %s\n",
			sortOrder, name, code, parent, show, stat, path.String)
	}
}
