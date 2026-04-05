package main

import (
	"database/sql"
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	password := "admin123"
	if len(os.Args) > 1 {
		password = os.Args[1]
	}
	
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	
	dsn := "postgres://root:123456@dev_cockroach:26257/nakama?sslmode=disable"
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	
	result, err := db.Exec("UPDATE wf_admin_users SET password_hash = $1 WHERE username = 'admin'", string(hash))
	if err != nil {
		panic(err)
	}
	rows, _ := result.RowsAffected()
	fmt.Printf("Updated %d rows with hash: %s\n", rows, string(hash))
}
