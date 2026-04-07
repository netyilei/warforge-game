package shared

import "time"

type Entity interface {
	ID() string
	CreatedAt() time.Time
	UpdatedAt() time.Time
}

type BaseEntity struct {
	id        string
	createdAt time.Time
	updatedAt time.Time
}

func NewBaseEntity(id string) BaseEntity {
	now := time.Now()
	return BaseEntity{
		id:        id,
		createdAt: now,
		updatedAt: now,
	}
}

func (e *BaseEntity) ID() string {
	return e.id
}

func (e *BaseEntity) SetID(id string) {
	e.id = id
}

func (e *BaseEntity) CreatedAt() time.Time {
	return e.createdAt
}

func (e *BaseEntity) UpdatedAt() time.Time {
	return e.updatedAt
}

func (e *BaseEntity) SetUpdatedAt(t time.Time) {
	e.updatedAt = t
}

func (e *BaseEntity) Touch() {
	e.updatedAt = time.Now()
}
