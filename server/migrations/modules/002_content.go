package modules

import (
	"database/sql"
	"fmt"

	"warforge-server/config"
	"warforge-server/migrations"
)

type ContentMigration struct {
	*migrations.BaseMigration
}

func NewContentMigration() *ContentMigration {
	return &ContentMigration{
		BaseMigration: migrations.NewBaseMigration("002", "content"),
	}
}

func (m *ContentMigration) Up(db *sql.DB) error {
	tables := []struct {
		name string
		sql  string
	}{
		{
			name: "languages",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					code VARCHAR(10) UNIQUE NOT NULL,
					name VARCHAR(100) NOT NULL,
					native_name VARCHAR(100),
					icon VARCHAR(100),
					status SMALLINT DEFAULT 1,
					is_default BOOLEAN DEFAULT FALSE,
					sort_order INT DEFAULT 0,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("languages")),
		},
		{
			name: "content_categories",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(100) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					icon VARCHAR(100),
					content_type VARCHAR(20) DEFAULT 'article',
					parent_id UUID,
					description VARCHAR(255),
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP,
					CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES %s(id) ON DELETE SET NULL
				)
			`, config.GetTableName("content_categories"), config.GetTableName("content_categories")),
		},
		{
			name: "contents",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					category_id UUID NOT NULL,
					author_id UUID,
					cover_image VARCHAR(500),
					is_marquee BOOLEAN DEFAULT FALSE,
					is_popup BOOLEAN DEFAULT FALSE,
					start_time TIMESTAMP,
					end_time TIMESTAMP,
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("contents")),
		},
		{
			name: "content_translations",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					content_id UUID NOT NULL,
					lang VARCHAR(10) NOT NULL,
					title VARCHAR(255) NOT NULL,
					summary TEXT,
					content TEXT,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(content_id, lang)
				)
			`, config.GetTableName("content_translations")),
		},
		{
			name: "banner_groups",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					name VARCHAR(100) NOT NULL,
					code VARCHAR(50) UNIQUE NOT NULL,
					description VARCHAR(255),
					width INT,
					height INT,
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("banner_groups")),
		},
		{
			name: "banners",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					group_id UUID NOT NULL,
					image_url VARCHAR(500) NOT NULL,
					link_url VARCHAR(500),
					link_target VARCHAR(20) DEFAULT '_blank',
					extra_data JSONB,
					sort_order INT DEFAULT 0,
					status SMALLINT DEFAULT 1,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					deleted_at TIMESTAMP
				)
			`, config.GetTableName("banners")),
		},
		{
			name: "banner_translations",
			sql: fmt.Sprintf(`
				CREATE TABLE IF NOT EXISTS %s (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					banner_id UUID NOT NULL,
					lang VARCHAR(10) NOT NULL,
					title VARCHAR(200) NOT NULL,
					content VARCHAR(500),
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(banner_id, lang)
				)
			`, config.GetTableName("banner_translations")),
		},
	}

	for _, table := range tables {
		tableName := config.GetTableName(table.name)
		exists, err := migrations.TableExists(db, tableName)
		if err != nil {
			return fmt.Errorf("检查表 %s 是否存在失败: %w", tableName, err)
		}

		if !exists {
			if _, err := db.Exec(table.sql); err != nil {
				return fmt.Errorf("创建表 %s 失败: %w", tableName, err)
			}
		}
	}

	indexes := []struct {
		name    string
		table   string
		columns string
	}{
		{"idx_wf_languages_status", "languages", "status"},
		{"idx_wf_content_categories_parent", "content_categories", "parent_id"},
		{"idx_wf_content_categories_status", "content_categories", "status"},
		{"idx_wf_contents_category", "contents", "category_id"},
		{"idx_wf_contents_status", "contents", "status"},
		{"idx_wf_contents_marquee", "contents", "is_marquee"},
		{"idx_wf_contents_popup", "contents", "is_popup"},
		{"idx_wf_content_translations_content", "content_translations", "content_id"},
		{"idx_wf_content_translations_lang", "content_translations", "lang"},
		{"idx_wf_banners_group", "banners", "group_id"},
		{"idx_wf_banners_status", "banners", "status"},
		{"idx_wf_banner_translations_banner", "banner_translations", "banner_id"},
		{"idx_wf_banner_translations_lang", "banner_translations", "lang"},
	}

	for _, idx := range indexes {
		tableName := config.GetTableName(idx.table)
		if err := migrations.CreateIndexIfNotExists(db, idx.name, tableName, idx.columns); err != nil {
			return fmt.Errorf("创建索引 %s 失败: %w", idx.name, err)
		}
	}

	return nil
}

func (m *ContentMigration) Seed(db *sql.DB) error {
	queries := []string{
		fmt.Sprintf(`
			INSERT INTO %s (id, code, name, native_name, icon, status, is_default, sort_order)
			VALUES 
				('10000000-0000-0000-0000-000000000001', 'zh-CN', '简体中文', '简体中文', 'twemoji:flag-china', 1, true, 1),
				('10000000-0000-0000-0000-000000000002', 'zh-TW', '繁体中文', '繁體中文', 'twemoji:flag-china', 1, false, 2),
				('10000000-0000-0000-0000-000000000003', 'en', '英语', 'English', 'twemoji:flag-united-states', 1, false, 3),
				('10000000-0000-0000-0000-000000000004', 'en-GB', '英式英语', 'English (UK)', 'twemoji:flag-united-kingdom', 0, false, 4),
				('10000000-0000-0000-0000-000000000005', 'ja', '日语', '日本語', 'twemoji:flag-japan', 1, false, 5),
				('10000000-0000-0000-0000-000000000006', 'ko', '韩语', '한국어', 'twemoji:flag-south-korea', 1, false, 6),
				('10000000-0000-0000-0000-000000000007', 'fr', '法语', 'Français', 'twemoji:flag-france', 0, false, 7),
				('10000000-0000-0000-0000-000000000008', 'de', '德语', 'Deutsch', 'twemoji:flag-germany', 0, false, 8),
				('10000000-0000-0000-0000-000000000009', 'es', '西班牙语', 'Español', 'twemoji:flag-spain', 0, false, 9),
				('10000000-0000-0000-0000-000000000010', 'pt', '葡萄牙语', 'Português', 'twemoji:flag-portugal', 0, false, 10),
				('10000000-0000-0000-0000-000000000011', 'pt-BR', '巴西葡萄牙语', 'Português (Brasil)', 'twemoji:flag-brazil', 0, false, 11),
				('10000000-0000-0000-0000-000000000012', 'ru', '俄语', 'Русский', 'twemoji:flag-russia', 0, false, 12),
				('10000000-0000-0000-0000-000000000013', 'it', '意大利语', 'Italiano', 'twemoji:flag-italy', 0, false, 13),
				('10000000-0000-0000-0000-000000000014', 'ar', '阿拉伯语', 'العربية', 'twemoji:flag-saudi-arabia', 0, false, 14),
				('10000000-0000-0000-0000-000000000015', 'th', '泰语', 'ไทย', 'twemoji:flag-thailand', 0, false, 15),
				('10000000-0000-0000-0000-000000000016', 'vi', '越南语', 'Tiếng Việt', 'twemoji:flag-vietnam', 0, false, 16),
				('10000000-0000-0000-0000-000000000017', 'id', '印尼语', 'Bahasa Indonesia', 'twemoji:flag-indonesia', 0, false, 17),
				('10000000-0000-0000-0000-000000000018', 'ms', '马来语', 'Bahasa Melayu', 'twemoji:flag-malaysia', 0, false, 18),
				('10000000-0000-0000-0000-000000000019', 'tr', '土耳其语', 'Türkçe', 'twemoji:flag-turkey', 0, false, 19),
				('10000000-0000-0000-0000-000000000020', 'pl', '波兰语', 'Polski', 'twemoji:flag-poland', 0, false, 20),
				('10000000-0000-0000-0000-000000000021', 'nl', '荷兰语', 'Nederlands', 'twemoji:flag-netherlands', 0, false, 21),
				('10000000-0000-0000-0000-000000000022', 'hi', '印地语', 'हिन्दी', 'twemoji:flag-india', 0, false, 22)
			ON CONFLICT (id) DO NOTHING
		`, config.GetTableName("languages")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, content_type, description, status, sort_order)
			VALUES 
				('20000000-0000-0000-0000-000000000001', '公告', 'notice', 'notice', '系统公告', 1, 1),
				('20000000-0000-0000-0000-000000000002', '新闻', 'news', 'news', '游戏新闻', 1, 2),
				('20000000-0000-0000-0000-000000000003', '活动', 'activity', 'article', '游戏活动', 1, 3),
				('20000000-0000-0000-0000-000000000004', '攻略', 'guide', 'article', '游戏攻略', 1, 4)
			ON CONFLICT (id) DO NOTHING
		`, config.GetTableName("content_categories")),
		fmt.Sprintf(`
			INSERT INTO %s (id, name, code, description, status)
			VALUES ('30000000-0000-0000-0000-000000000001', '首页轮播', 'home_banner', '首页轮播图', 1)
			ON CONFLICT (id) DO NOTHING
		`, config.GetTableName("banner_groups")),
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("插入默认数据失败: %w", err)
		}
	}

	return nil
}

func init() {
	migrations.Register(NewContentMigration())
}
