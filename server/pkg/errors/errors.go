package errors

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code       string
	Message    string
	HTTPStatus int
	Details    map[string]interface{}
	Err        error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewAppError(code, message string, httpStatus int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
		Details:    make(map[string]interface{}),
	}
}

func (e *AppError) WithDetail(key string, value interface{}) *AppError {
	e.Details[key] = value
	return e
}

func (e *AppError) WithError(err error) *AppError {
	e.Err = err
	return e
}

func BadRequest(code, message string) *AppError {
	return NewAppError(code, message, http.StatusBadRequest)
}

func Unauthorized(code, message string) *AppError {
	return NewAppError(code, message, http.StatusUnauthorized)
}

func Forbidden(code, message string) *AppError {
	return NewAppError(code, message, http.StatusForbidden)
}

func NotFound(code, message string) *AppError {
	return NewAppError(code, message, http.StatusNotFound)
}

func Conflict(code, message string) *AppError {
	return NewAppError(code, message, http.StatusConflict)
}

func Internal(code, message string) *AppError {
	return NewAppError(code, message, http.StatusInternalServerError)
}

var (
	ErrInvalidRequest   = BadRequest("INVALID_REQUEST", "Invalid request")
	ErrUnauthorized     = Unauthorized("UNAUTHORIZED", "Unauthorized")
	ErrForbidden        = Forbidden("FORBIDDEN", "Forbidden")
	ErrNotFound         = NotFound("NOT_FOUND", "Resource not found")
	ErrInternal         = Internal("INTERNAL_ERROR", "Internal server error")
)

func IsAppError(err error) bool {
	_, ok := err.(*AppError)
	return ok
}

func GetAppError(err error) *AppError {
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}
	return Internal("INTERNAL_ERROR", err.Error()).WithError(err)
}
