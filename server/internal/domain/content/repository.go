package content

import (
	"context"

	"warforge-server/internal/domain/shared"
)

type BannerRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*Banner, error)
	FindByGroupID(ctx context.Context, groupID string) ([]*Banner, error)
	ListAll(ctx context.Context) ([]*Banner, error)
	Save(ctx context.Context, banner *Banner) error
	Delete(ctx context.Context, id string) error
	FindTranslationsByBannerID(ctx context.Context, bannerID string) ([]*BannerTranslation, error)
	SaveTranslation(ctx context.Context, translation *BannerTranslation) error
}

type BannerGroupRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*BannerGroup, error)
	FindByCode(ctx context.Context, code string) (*BannerGroup, error)
	ListAll(ctx context.Context) ([]*BannerGroup, error)
	Save(ctx context.Context, group *BannerGroup) error
	Delete(ctx context.Context, id string) error
}

type ContentRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*Content, error)
	List(ctx context.Context, filter ContentFilter) (*ContentListResult, error)
	Save(ctx context.Context, content *Content) error
	Delete(ctx context.Context, id string) error
	FindTranslationsByContentID(ctx context.Context, contentID string) ([]*ContentTranslation, error)
	SaveTranslation(ctx context.Context, translation *ContentTranslation) error
}

type ContentCategoryRepository interface {
	shared.BaseRepository
	FindByID(ctx context.Context, id string) (*ContentCategory, error)
	FindByCode(ctx context.Context, code string) (*ContentCategory, error)
	ListAll(ctx context.Context) ([]*ContentCategory, error)
	Save(ctx context.Context, category *ContentCategory) error
	Delete(ctx context.Context, id string) error
}
