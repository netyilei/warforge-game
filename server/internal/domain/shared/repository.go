package shared

import (
	"fmt"
)

type Repository interface{}

type BaseRepository interface {
	Repository
}

type Specification interface {
	IsSatisfiedBy(entity Entity) bool
}

type QueryOptions struct {
	Page     int
	PageSize int
	OrderBy  string
	OrderDir string
}

func DefaultQueryOptions() QueryOptions {
	return QueryOptions{
		Page:     1,
		PageSize: 20,
		OrderBy:  "created_at",
		OrderDir: "DESC",
	}
}

type QueryResult[T any] struct {
	Items      []T
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

func NewQueryResult[T any](items []T, total int64, page, pageSize int) *QueryResult[T] {
	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}
	return &QueryResult[T]{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

type RepositoryError struct {
	Operation string
	Entity    string
	Err       error
}

func (e *RepositoryError) Error() string {
	return fmt.Sprintf("repository error: %s %s: %v", e.Operation, e.Entity, e.Err)
}

func (e *RepositoryError) Unwrap() error {
	return e.Err
}

func NewRepositoryError(operation, entity string, err error) *RepositoryError {
	return &RepositoryError{
		Operation: operation,
		Entity:    entity,
		Err:       err,
	}
}

var (
	ErrNotFound      = NewDomainError("entity not found", "NOT_FOUND")
	ErrAlreadyExists = NewDomainError("entity already exists", "ALREADY_EXISTS")
	ErrInvalidID     = NewDomainError("invalid id", "INVALID_ID")
)
