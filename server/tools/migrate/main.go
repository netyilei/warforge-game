package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	dsn := "postgres://root@localhost:26257/nakama?sslmode=disable"

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("Connected to database")

	fmt.Println("\n=== Checking wf_content_categories table ===")
	rows, err := db.Query(`
		SELECT column_name, data_type, is_nullable 
		FROM information_schema.columns 
		WHERE table_name = 'wf_content_categories' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Printf("Error querying columns: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var colName, dataType, isNullable string
			if err := rows.Scan(&colName, &dataType, &isNullable); err != nil {
				log.Printf("Error scanning row: %v", err)
				continue
			}
			fmt.Printf("  %s (%s, nullable: %s)\n", colName, dataType, isNullable)
		}
	}

	fmt.Println("\n=== Adding missing columns to wf_content_categories ===")
	_, err = db.Exec(`ALTER TABLE wf_content_categories ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'html'`)
	if err != nil {
		log.Printf("Warning: Failed to add content_type column: %v", err)
	} else {
		fmt.Println("content_type column added")
	}

	_, err = db.Exec(`ALTER TABLE wf_content_categories ADD COLUMN IF NOT EXISTS description VARCHAR(255)`)
	if err != nil {
		log.Printf("Warning: Failed to add description column: %v", err)
	} else {
		fmt.Println("description column added")
	}

	fmt.Println("\nDone!")
}
