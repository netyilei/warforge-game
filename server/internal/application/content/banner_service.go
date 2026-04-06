package content

import (
	"context"
	"time"

	contentdomain "warforge-server/internal/domain/content"
	"warforge-server/pkg/utils"
)

type BannerService struct {
	bannerRepo      contentdomain.BannerRepository
	bannerGroupRepo contentdomain.BannerGroupRepository
}

func NewBannerService(bannerRepo contentdomain.BannerRepository, bannerGroupRepo contentdomain.BannerGroupRepository) *BannerService {
	return &BannerService{
		bannerRepo:      bannerRepo,
		bannerGroupRepo: bannerGroupRepo,
	}
}

func (s *BannerService) GetBannerByID(ctx context.Context, id string) (*contentdomain.Banner, error) {
	return s.bannerRepo.FindByID(ctx, id)
}

func (s *BannerService) GetBannersByGroupID(ctx context.Context, groupID string) ([]*contentdomain.Banner, error) {
	return s.bannerRepo.FindByGroupID(ctx, groupID)
}

func (s *BannerService) ListAllBanners(ctx context.Context) ([]*contentdomain.Banner, error) {
	return s.bannerRepo.ListAll(ctx)
}

type CreateBannerInput struct {
	GroupID    string
	ImageURL   string
	LinkURL    *string
	LinkTarget string
	IsExternal bool
	ExtraData  contentdomain.BannerExtraData
	StartTime  *time.Time
	EndTime    *time.Time
	SortOrder  int
	Status     int
}

func (s *BannerService) CreateBanner(ctx context.Context, input CreateBannerInput) (*contentdomain.Banner, error) {
	banner := contentdomain.NewBanner(utils.GenerateUUID(), input.GroupID, input.ImageURL)
	banner.SetLinkURL(input.LinkURL)
	banner.SetLinkTarget(input.LinkTarget)
	banner.SetIsExternal(input.IsExternal)
	banner.SetExtraData(input.ExtraData)
	banner.SetStartTime(input.StartTime)
	banner.SetEndTime(input.EndTime)
	banner.SetSortOrder(input.SortOrder)
	banner.SetStatus(contentdomain.BannerStatus(input.Status))

	if err := s.bannerRepo.Save(ctx, banner); err != nil {
		return nil, err
	}

	return banner, nil
}

type UpdateBannerInput struct {
	ID         string
	ImageURL   string
	LinkURL    *string
	LinkTarget string
	IsExternal bool
	ExtraData  contentdomain.BannerExtraData
	StartTime  *time.Time
	EndTime    *time.Time
	SortOrder  int
	Status     int
}

func (s *BannerService) UpdateBanner(ctx context.Context, input UpdateBannerInput) error {
	banner, err := s.bannerRepo.FindByID(ctx, input.ID)
	if err != nil {
		return err
	}

	banner.SetImageURL(input.ImageURL)
	banner.SetLinkURL(input.LinkURL)
	banner.SetLinkTarget(input.LinkTarget)
	banner.SetIsExternal(input.IsExternal)
	banner.SetExtraData(input.ExtraData)
	banner.SetStartTime(input.StartTime)
	banner.SetEndTime(input.EndTime)
	banner.SetSortOrder(input.SortOrder)
	banner.SetStatus(contentdomain.BannerStatus(input.Status))

	return s.bannerRepo.Save(ctx, banner)
}

func (s *BannerService) DeleteBanner(ctx context.Context, id string) error {
	return s.bannerRepo.Delete(ctx, id)
}

func (s *BannerService) GetBannerTranslations(ctx context.Context, bannerID string) ([]*contentdomain.BannerTranslation, error) {
	return s.bannerRepo.FindTranslationsByBannerID(ctx, bannerID)
}

func (s *BannerService) SaveBannerTranslation(ctx context.Context, bannerID, lang, title, content string) error {
	translation := contentdomain.NewBannerTranslation(utils.GenerateUUID(), bannerID, lang, title, content)
	return s.bannerRepo.SaveTranslation(ctx, translation)
}

type BannerGroupService struct {
	repo      contentdomain.BannerGroupRepository
	checkCode func(ctx context.Context, code, excludeID string) (bool, error)
}

func NewBannerGroupService(repo contentdomain.BannerGroupRepository, checkCode func(ctx context.Context, code, excludeID string) (bool, error)) *BannerGroupService {
	return &BannerGroupService{repo: repo, checkCode: checkCode}
}

func (s *BannerGroupService) GetByID(ctx context.Context, id string) (*contentdomain.BannerGroup, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *BannerGroupService) GetByCode(ctx context.Context, code string) (*contentdomain.BannerGroup, error) {
	return s.repo.FindByCode(ctx, code)
}

func (s *BannerGroupService) ListAll(ctx context.Context) ([]*contentdomain.BannerGroup, error) {
	return s.repo.ListAll(ctx)
}

type CreateBannerGroupInput struct {
	Name        string
	Code        string
	Description *string
	Width       int
	Height      int
	SortOrder   int
	Status      int
}

func (s *BannerGroupService) Create(ctx context.Context, input CreateBannerGroupInput) (*contentdomain.BannerGroup, error) {
	exists, err := s.checkCode(ctx, input.Code, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, contentdomain.ErrBannerGroupCodeExists
	}

	group := contentdomain.NewBannerGroup(utils.GenerateUUID(), input.Name, input.Code)
	group.SetDescription(input.Description)
	group.SetSize(input.Width, input.Height)
	group.SetSortOrder(input.SortOrder)
	group.SetStatus(contentdomain.BannerGroupStatus(input.Status))

	if err := s.repo.Save(ctx, group); err != nil {
		return nil, err
	}

	return group, nil
}

type UpdateBannerGroupInput struct {
	ID          string
	Name        string
	Description *string
	Width       int
	Height      int
	SortOrder   int
	Status      int
}

func (s *BannerGroupService) Update(ctx context.Context, input UpdateBannerGroupInput) error {
	group, err := s.repo.FindByID(ctx, input.ID)
	if err != nil {
		return err
	}

	group.SetName(input.Name)
	group.SetDescription(input.Description)
	group.SetSize(input.Width, input.Height)
	group.SetSortOrder(input.SortOrder)
	group.SetStatus(contentdomain.BannerGroupStatus(input.Status))

	return s.repo.Save(ctx, group)
}

func (s *BannerGroupService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
