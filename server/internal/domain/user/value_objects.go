package user

import (
	"regexp"
	"strings"

	"warforge-server/internal/domain/shared"
)

type UserID string

func (id UserID) String() string {
	return string(id)
}

func (id UserID) IsValid() bool {
	return len(id) > 0
}

type Username string

var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`)

func (u Username) String() string {
	return string(u)
}

func (u Username) IsValid() bool {
	return usernameRegex.MatchString(string(u))
}

func (u Username) Equals(other shared.ValueObject) bool {
	if o, ok := other.(Username); ok {
		return u == o
	}
	return false
}

func NewUsername(s string) (Username, error) {
	s = strings.TrimSpace(s)
	if !usernameRegex.MatchString(s) {
		return "", shared.NewValidationError("username", "must be 3-20 characters, alphanumeric and underscore only")
	}
	return Username(s), nil
}

type Email string

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func (e Email) String() string {
	return string(e)
}

func (e Email) IsValid() bool {
	return emailRegex.MatchString(string(e))
}

func (e Email) Equals(other shared.ValueObject) bool {
	if o, ok := other.(Email); ok {
		return e == o
	}
	return false
}

func NewEmail(s string) (Email, error) {
	s = strings.TrimSpace(s)
	if !emailRegex.MatchString(s) {
		return "", shared.NewValidationError("email", "invalid email format")
	}
	return Email(s), nil
}

type Password string

func (p Password) IsValid() bool {
	return len(p) >= 6
}

func (p Password) Equals(other shared.ValueObject) bool {
	if o, ok := other.(Password); ok {
		return p == o
	}
	return false
}

func NewPassword(s string) (Password, error) {
	if len(s) < 6 {
		return "", shared.NewValidationError("password", "must be at least 6 characters")
	}
	return Password(s), nil
}
