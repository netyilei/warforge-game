package rpc

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

func jsonMarshal(v interface{}) (string, error) {
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "")
	err := encoder.Encode(v)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func RegisterAdminRPC(initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("admin_get_players", adminGetPlayers); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("admin_get_player", adminGetPlayer); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("admin_ban_player", adminBanPlayer); err != nil {
		return err
	}
	if err := initializer.RegisterRpc("admin_unban_player", adminUnbanPlayer); err != nil {
		return err
	}
	return nil
}

func adminGetPlayers(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		Page     int    `json:"page"`
		PageSize int    `json:"pageSize"`
		Search   string `json:"search"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		req.Page = 1
		req.PageSize = 20
	}
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	offset := (req.Page - 1) * req.PageSize

	query := "SELECT id, username, create_time, update_time FROM users WHERE disabled = false"
	args := []interface{}{}

	if req.Search != "" {
		query += " AND username LIKE $1"
		args = append(args, "%"+req.Search+"%")
	}

	query += " ORDER BY create_time DESC LIMIT $2 OFFSET $3"
	args = append(args, req.PageSize, offset)

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		logger.Error("Failed to query players: %v", err)
		return `{"error":"Failed to get players"}`, nil
	}
	defer rows.Close()

	type Player struct {
		ID         string `json:"id"`
		Username   string `json:"username"`
		CreateTime string `json:"createTime"`
		UpdateTime string `json:"updateTime"`
	}

	players := []Player{}
	for rows.Next() {
		var p Player
		if err := rows.Scan(&p.ID, &p.Username, &p.CreateTime, &p.UpdateTime); err != nil {
			logger.Error("Failed to scan player: %v", err)
			continue
		}
		players = append(players, p)
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM users WHERE disabled = false"
	if req.Search != "" {
		countQuery += " AND username LIKE $1"
		db.QueryRowContext(ctx, countQuery, "%"+req.Search+"%").Scan(&total)
	} else {
		db.QueryRowContext(ctx, countQuery).Scan(&total)
	}

	response := map[string]interface{}{
		"list":     players,
		"total":    total,
		"page":     req.Page,
		"pageSize": req.PageSize,
	}

	data, _ := jsonMarshal(response)
	return data, nil
}

func adminGetPlayer(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}

	query := "SELECT id, username, email, display_name, avatar_url, lang_tag, location, timezone, metadata, wallet, create_time, update_time, disabled FROM users WHERE id = $1"

	var player struct {
		ID          string `json:"id"`
		Username    string `json:"username"`
		Email       string `json:"email"`
		DisplayName string `json:"displayName"`
		AvatarURL   string `json:"avatarUrl"`
		LangTag     string `json:"langTag"`
		Location    string `json:"location"`
		Timezone    string `json:"timezone"`
		Metadata    string `json:"metadata"`
		Wallet      string `json:"wallet"`
		CreateTime  string `json:"createTime"`
		UpdateTime  string `json:"updateTime"`
		Disabled    bool   `json:"disabled"`
	}

	err := db.QueryRowContext(ctx, query, req.UserID).Scan(
		&player.ID, &player.Username, &player.Email, &player.DisplayName,
		&player.AvatarURL, &player.LangTag, &player.Location, &player.Timezone,
		&player.Metadata, &player.Wallet, &player.CreateTime, &player.UpdateTime, &player.Disabled,
	)
	if err != nil {
		logger.Error("Failed to get player: %v", err)
		return `{"error":"Player not found"}`, nil
	}

	data, _ := jsonMarshal(player)
	return data, nil
}

func adminBanPlayer(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		UserID string `json:"userId"`
		Reason string `json:"reason"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}

	query := "UPDATE users SET disabled = true, update_time = NOW() WHERE id = $1"
	_, err := db.ExecContext(ctx, query, req.UserID)
	if err != nil {
		logger.Error("Failed to ban player: %v", err)
		return `{"error":"Failed to ban player"}`, nil
	}

	return `{"success":true}`, nil
}

func adminUnbanPlayer(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	var req struct {
		UserID string `json:"userId"`
	}
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		return `{"error":"Invalid request"}`, nil
	}

	query := "UPDATE users SET disabled = false, update_time = NOW() WHERE id = $1"
	_, err := db.ExecContext(ctx, query, req.UserID)
	if err != nil {
		logger.Error("Failed to unban player: %v", err)
		return `{"error":"Failed to unban player"}`, nil
	}

	return `{"success":true}`, nil
}
