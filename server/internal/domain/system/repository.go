package system

import (
	"context"

	"warforge-server/internal/domain/shared"
)

type EmailConfigRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*EmailConfig, error)
	FindByCode(ctx context.Context, code string) (*EmailConfig, error)
	FindDefault(ctx context.Context) (*EmailConfig, error)
	ListAll(ctx context.Context) ([]*EmailConfig, error)
	Save(ctx context.Context, config *EmailConfig) error
	Delete(ctx context.Context, id string) error
}

type EmailTemplateRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*EmailTemplate, error)
	FindByCode(ctx context.Context, code string) (*EmailTemplate, error)
	ListAll(ctx context.Context) ([]*EmailTemplate, error)
	Save(ctx context.Context, template *EmailTemplate) error
	Delete(ctx context.Context, id string) error
}

type StorageConfigRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*StorageConfig, error)
	FindDefault(ctx context.Context) (*StorageConfig, error)
	ListAll(ctx context.Context) ([]*StorageConfig, error)
	Save(ctx context.Context, config *StorageConfig) error
	Delete(ctx context.Context, id string) error
	SetDefault(ctx context.Context, id string) error
	ClearDefault(ctx context.Context) error
}

type LanguageRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*Language, error)
	FindByCode(ctx context.Context, code string) (*Language, error)
	ListAll(ctx context.Context) ([]*Language, error)
	Save(ctx context.Context, lang *Language) error
	Delete(ctx context.Context, id string) error
	SetDefault(ctx context.Context, id string) error
	SetSupported(ctx context.Context, languageIDs []string) error
}

type SystemConfigRepository interface {
	shared.BaseRepository
	FindByKey(ctx context.Context, key string) (*SystemConfig, error)
	ListAll(ctx context.Context) ([]*SystemConfig, error)
	Save(ctx context.Context, config *SystemConfig) error
	Delete(ctx context.Context, key string) error
}

type UploadRecordRepository interface {
	FindByID(ctx context.Context, id string) (*UploadRecord, error)
	FindByUser(ctx context.Context, userID string, userType UserType, page, pageSize int) (*shared.QueryResult[*UploadRecord], error)
	List(ctx context.Context, filter UploadRecordFilter) (*shared.QueryResult[*UploadRecord], error)
	Save(ctx context.Context, record *UploadRecord) error
	Delete(ctx context.Context, id string) error
	DeleteByUser(ctx context.Context, userID string, userType UserType) error
	Create(ctx context.Context, userID, userType, originalName, filePath string, fileSize int64, mimeType, storageID, uploadType string) (string, error)
	ListWithDetails(ctx context.Context, page, pageSize int, userType, uploadType string) ([]UploadRecordListDTO, int64, error)
	GetByIDSimple(ctx context.Context, id string) (string, string, string, string, int64, string, string, string, error)
}
