package utils

import (
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

func TrimStrings(s string) string {
	return strings.TrimSpace(s)
}

func ToSnakeCase(s string) string {
	var matchFirstCap = regexp.MustCompile("(.)([A-Z][a-z]+)")
	var matchAllCap = regexp.MustCompile("([a-z0-9])([A-Z])")

	snake := matchFirstCap.ReplaceAllString(s, "${1}_${2}")
	snake = matchAllCap.ReplaceAllString(snake, "${1}_${2}")
	return strings.ToLower(snake)
}

func ToCamelCase(s string) string {
	words := strings.Split(s, "_")
	for i := 1; i < len(words); i++ {
		words[i] = cases.Title(language.English).String(words[i])
	}
	return strings.Join(words, "")
}

func ContainsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

func RemoveString(slice []string, s string) []string {
	result := make([]string, 0)
	for _, item := range slice {
		if item != s {
			result = append(result, item)
		}
	}
	return result
}

func UniqueStrings(slice []string) []string {
	seen := make(map[string]bool)
	result := make([]string, 0)
	for _, item := range slice {
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}
	return result
}

func ParseTime(s string, layouts ...string) (time.Time, error) {
	defaultLayouts := []string{
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	if len(layouts) > 0 {
		defaultLayouts = layouts
	}

	for _, layout := range defaultLayouts {
		t, err := time.Parse(layout, s)
		if err == nil {
			return t, nil
		}
	}

	return time.Time{}, nil
}

func FormatTime(t time.Time, layout string) string {
	if layout == "" {
		layout = time.RFC3339
	}
	return t.Format(layout)
}

func Ptr[T any](v T) *T {
	return &v
}

func Value[T any](p *T, defaultValue T) T {
	if p == nil {
		return defaultValue
	}
	return *p
}

func Map[T, U any](slice []T, fn func(T) U) []U {
	result := make([]U, len(slice))
	for i, v := range slice {
		result[i] = fn(v)
	}
	return result
}

func Filter[T any](slice []T, fn func(T) bool) []T {
	result := make([]T, 0)
	for _, v := range slice {
		if fn(v) {
			result = append(result, v)
		}
	}
	return result
}

func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
	result := initial
	for _, v := range slice {
		result = fn(result, v)
	}
	return result
}

func GenerateUUID() string {
	return uuid.New().String()
}

func RandomString(n int) string {
	bytes := make([]byte, n)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:n]
}
