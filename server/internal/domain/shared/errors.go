package shared

import "fmt"

type DomainError struct {
	Message string
	Code    string
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func NewDomainError(message, code string) *DomainError {
	return &DomainError{
		Message: message,
		Code:    code,
	}
}

var (
	ErrInvalidState    = NewDomainError("invalid state", "INVALID_STATE")
	ErrInvalidArgument = NewDomainError("invalid argument", "INVALID_ARGUMENT")
	ErrPermissionDenied = NewDomainError("permission denied", "PERMISSION_DENIED")
	ErrOperationFailed = NewDomainError("operation failed", "OPERATION_FAILED")
)

type ErrorCollector struct {
	errors []*ValidationError
}

func NewErrorCollector() *ErrorCollector {
	return &ErrorCollector{
		errors: make([]*ValidationError, 0),
	}
}

func (c *ErrorCollector) Add(field, message string) {
	c.errors = append(c.errors, NewValidationError(field, message))
}

func (c *ErrorCollector) HasErrors() bool {
	return len(c.errors) > 0
}

func (c *ErrorCollector) Errors() []*ValidationError {
	return c.errors
}

func (c *ErrorCollector) ToError() error {
	if !c.HasErrors() {
		return nil
	}
	return &ValidationError{
		Field:   "multiple",
		Message: fmt.Sprintf("%d validation errors", len(c.errors)),
	}
}
