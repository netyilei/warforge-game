package logger

import (
	"context"
	"log/slog"
	"os"
)

type contextKey string

const (
	TraceIDKey contextKey = "trace_id"
	UserIDKey  contextKey = "user_id"
)

type Config struct {
	Level     slog.Level
	Format    string
	AddSource bool
}

func DefaultConfig() Config {
	return Config{
		Level:     slog.LevelInfo,
		Format:    "json",
		AddSource: true,
	}
}

func NewLogger(config Config) *slog.Logger {
	var handler slog.Handler

	opts := &slog.HandlerOptions{
		Level:     config.Level,
		AddSource: config.AddSource,
	}

	if config.Format == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return slog.New(handler)
}

func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, TraceIDKey, traceID)
}

func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

func GetTraceID(ctx context.Context) string {
	if id, ok := ctx.Value(TraceIDKey).(string); ok {
		return id
	}
	return ""
}

func GetUserID(ctx context.Context) string {
	if id, ok := ctx.Value(UserIDKey).(string); ok {
		return id
	}
	return ""
}

func LogCtx(ctx context.Context, logger *slog.Logger, level slog.Level, msg string, args ...any) {
	traceID := GetTraceID(ctx)
	userID := GetUserID(ctx)

	if traceID != "" {
		args = append(args, "trace_id", traceID)
	}
	if userID != "" {
		args = append(args, "user_id", userID)
	}

	logger.Log(ctx, level, msg, args...)
}

func InfoCtx(ctx context.Context, logger *slog.Logger, msg string, args ...any) {
	LogCtx(ctx, logger, slog.LevelInfo, msg, args...)
}

func ErrorCtx(ctx context.Context, logger *slog.Logger, msg string, args ...any) {
	LogCtx(ctx, logger, slog.LevelError, msg, args...)
}

func DebugCtx(ctx context.Context, logger *slog.Logger, msg string, args ...any) {
	LogCtx(ctx, logger, slog.LevelDebug, msg, args...)
}

func WarnCtx(ctx context.Context, logger *slog.Logger, msg string, args ...any) {
	LogCtx(ctx, logger, slog.LevelWarn, msg, args...)
}
