package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

func main() {
	connStr := "postgres://root@localhost:26257/nakama?sslmode=disable"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close(context.Background())

	fmt.Println("=== 获取邮件配置菜单的 ID ===")
	var menuID string
	err = conn.QueryRow(context.Background(), `
		SELECT id FROM admin_permissions WHERE code = 'settings_email'
	`).Scan(&menuID)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("邮件配置菜单 ID: %s\n", menuID)

	fmt.Println("\n=== 更新按钮权限的 parent_id ===")
	result, err := conn.Exec(context.Background(), `
		UPDATE admin_permissions 
		SET parent_id = $1 
		WHERE code IN ('email_config_view', 'email_config_create', 'email_config_edit', 'email_config_delete', 
		               'email_template_view', 'email_template_create', 'email_template_edit', 'email_template_delete', 
		               'email_send_test')
	`, menuID)
	if err != nil {
		fmt.Printf("更新失败: %v\n", err)
	} else {
		fmt.Printf("更新了 %d 行\n", result.RowsAffected())
	}

	fmt.Println("\n=== 添加邮件配置菜单权限到超级管理员角色 ===")
	result2, err := conn.Exec(context.Background(), `
		INSERT INTO admin_role_permissions (role_id, permission_id)
		SELECT '00000000-0000-0000-0000-000000000001', id 
		FROM admin_permissions 
		WHERE code = 'settings_email'
		AND NOT EXISTS (
			SELECT 1 FROM admin_role_permissions 
			WHERE role_id = '00000000-0000-0000-0000-000000000001' 
			AND permission_id = (SELECT id FROM admin_permissions WHERE code = 'settings_email')
		)
	`)
	if err != nil {
		fmt.Printf("添加失败: %v\n", err)
	} else {
		fmt.Printf("添加了 %d 行\n", result2.RowsAffected())
	}

	fmt.Println("\n=== 验证结果 ===")
	rows, err := conn.Query(context.Background(), `
		SELECT p.code, p.name, p.type
		FROM admin_role_permissions rp
		JOIN admin_permissions p ON rp.permission_id = p.id
		WHERE rp.role_id = '00000000-0000-0000-0000-000000000001'
		AND p.code LIKE '%email%'
		ORDER BY p.code
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var code, name, ptype string
		rows.Scan(&code, &name, &ptype)
		fmt.Printf("Code: %s, Name: %s, Type: %s\n", code, name, ptype)
	}
}
