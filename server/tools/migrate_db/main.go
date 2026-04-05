package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

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

	if err := db.Ping(); err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	fmt.Println("数据库连接成功!")

	sqlFile := "migrations/001_complete_schema.sql"
	if len(os.Args) > 1 {
		sqlFile = os.Args[1]
	}

	fmt.Printf("\n执行迁移文件: %s\n", sqlFile)

	content, err := os.ReadFile(sqlFile)
	if err != nil {
		log.Fatal("读取SQL文件失败:", err)
	}

	statements := splitSQLStatements(string(content))

	successCount := 0
	errorCount := 0

	for i, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		_, err := db.Exec(stmt)
		if err != nil {
			if strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "duplicate key") {
				fmt.Printf("[%d] 跳过 (已存在): %s...\n", i+1, getFirstLine(stmt))
			} else {
				fmt.Printf("[%d] 错误: %v\n", i+1, err)
				errorCount++
			}
		} else {
			successCount++
			fmt.Printf("[%d] 成功: %s\n", i+1, getFirstLine(stmt))
		}
	}

	fmt.Printf("\n迁移完成! 成功: %d, 错误: %d\n", successCount, errorCount)

	fmt.Println("\n=== 验证表结构 ===")

	tables := []string{
		"wf_admin_users",
		"wf_admin_roles",
		"wf_admin_permissions",
		"wf_admin_user_roles",
		"wf_admin_role_permissions",
		"wf_admin_operation_logs",
		"wf_admin_settings",
		"wf_languages",
		"wf_user_profiles",
		"wf_content_categories",
		"wf_contents",
		"wf_content_translations",
		"wf_banner_groups",
		"wf_banners",
		"wf_banner_translations",
		"wf_email_configs",
		"wf_email_templates",
		"wf_storage_configs",
		"wf_upload_records",
		"wf_system_settings",
	}

	for _, table := range tables {
		var exists bool
		err := db.QueryRow(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = $1
			)
		`, table).Scan(&exists)

		if err != nil {
			fmt.Printf("  ✗ %s: 查询失败 - %v\n", table, err)
		} else if exists {
			var count int
			db.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
			fmt.Printf("  ✓ %s: 存在 (记录数: %d)\n", table, count)
		} else {
			fmt.Printf("  ✗ %s: 不存在\n", table)
		}
	}

	fmt.Println("\n=== 验证默认数据 ===")

	var adminCount, roleCount, permCount, langCount int
	db.QueryRow("SELECT COUNT(*) FROM wf_admin_users").Scan(&adminCount)
	db.QueryRow("SELECT COUNT(*) FROM wf_admin_roles").Scan(&roleCount)
	db.QueryRow("SELECT COUNT(*) FROM wf_admin_permissions").Scan(&permCount)
	db.QueryRow("SELECT COUNT(*) FROM wf_languages").Scan(&langCount)

	fmt.Printf("  管理员: %d\n", adminCount)
	fmt.Printf("  角色: %d\n", roleCount)
	fmt.Printf("  权限/菜单: %d\n", permCount)
	fmt.Printf("  语言: %d\n", langCount)
}

func splitSQLStatements(content string) []string {
	var statements []string
	var current strings.Builder
	inDollarQuote := false
	dollarTag := ""

	lines := strings.Split(content, "\n")

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "--") && !inDollarQuote {
			continue
		}

		if !inDollarQuote {
			if idx := strings.Index(trimmed, "$"); idx != -1 {
				rest := trimmed[idx+1:]
				if endIdx := strings.Index(rest, "$"); endIdx != -1 {
					dollarTag = "$" + rest[:endIdx+1]
					inDollarQuote = true
				}
			}
		} else {
			if strings.Contains(trimmed, dollarTag) {
				inDollarQuote = false
				dollarTag = ""
			}
		}

		current.WriteString(line)
		current.WriteString("\n")

		if !inDollarQuote && strings.HasSuffix(trimmed, ";") {
			statements = append(statements, current.String())
			current.Reset()
		}
	}

	if current.Len() > 0 {
		statements = append(statements, current.String())
	}

	return statements
}

func getFirstLine(stmt string) string {
	lines := strings.Split(stmt, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "--") {
			if len(line) > 80 {
				return line[:80] + "..."
			}
			return line
		}
	}
	return ""
}
