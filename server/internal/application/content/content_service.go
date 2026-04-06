package content

import (
	"context"
	"time"

	contentdomain "warforge-server/internal/domain/content"
	"warforge-server/pkg/utils"
)

type ContentService struct {
	repo contentdomain.ContentRepository
}

func NewContentService(repo contentdomain.ContentRepository) *ContentService {
	return &ContentService{repo: repo}
}

func (s *ContentService) GetByID(ctx context.Context, id string) (*contentdomain.Content, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ContentService) List(ctx context.Context, filter contentdomain.ContentFilter) (*contentdomain.ContentListResult, error) {
	return s.repo.List(ctx, filter)
}

type CreateContentInput struct {
	CategoryID   string
	AuthorID     string
	CoverImage   *string
	IsMarquee    bool
	IsPopup      bool
	StartTime    *time.Time
	EndTime      *time.Time
	SortOrder    int
	Status       int
	Translations []contentdomain.ContentTranslationDTO
}

func (s *ContentService) Create(ctx context.Context, input CreateContentInput) (*contentdomain.Content, error) {
	content := contentdomain.NewContent(utils.GenerateUUID(), input.CategoryID)
	content.SetAuthorID(input.AuthorID)
	content.SetCoverImage(input.CoverImage)
	content.SetMarquee(input.IsMarquee)
	content.SetPopup(input.IsPopup)
	content.SetStartTime(input.StartTime)
	content.SetEndTime(input.EndTime)
	content.SetSortOrder(input.SortOrder)
	content.SetStatus(contentdomain.ContentStatus(input.Status))

	if err := s.repo.Save(ctx, content); err != nil {
		return nil, err
	}

	for _, t := range input.Translations {
		translation := contentdomain.NewContentTranslation(utils.GenerateUUID(), content.ID(), t.Lang, t.Title, t.Summary, t.Content)
		s.repo.SaveTranslation(ctx, translation)
	}

	return content, nil
}

type UpdateContentInput struct {
	ID           string
	CategoryID   string
	CoverImage   *string
	IsMarquee    bool
	IsPopup      bool
	StartTime    *time.Time
	EndTime      *time.Time
	SortOrder    int
	Status       int
}

func (s *ContentService) Update(ctx context.Context, input UpdateContentInput) error {
	content, err := s.repo.FindByID(ctx, input.ID)
	if err != nil {
		return err
	}

	content.SetCategoryID(input.CategoryID)
	content.SetCoverImage(input.CoverImage)
	content.SetMarquee(input.IsMarquee)
	content.SetPopup(input.IsPopup)
	content.SetStartTime(input.StartTime)
	content.SetEndTime(input.EndTime)
	content.SetSortOrder(input.SortOrder)
	content.SetStatus(contentdomain.ContentStatus(input.Status))

	return s.repo.Save(ctx, content)
}

func (s *ContentService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *ContentService) GetTranslations(ctx context.Context, contentID string) ([]*contentdomain.ContentTranslation, error) {
	return s.repo.FindTranslationsByContentID(ctx, contentID)
}

func (s *ContentService) SaveTranslation(ctx context.Context, contentID, lang, title, summary, content string) error {
	translation := contentdomain.NewContentTranslation(utils.GenerateUUID(), contentID, lang, title, summary, content)
	return s.repo.SaveTranslation(ctx, translation)
}

func (s *ContentService) UpdateTranslations(ctx context.Context, contentID string, translations []contentdomain.ContentTranslationDTO) error {
	for _, t := range translations {
		if err := s.SaveTranslation(ctx, contentID, t.Lang, t.Title, t.Summary, t.Content); err != nil {
			return err
		}
	}
	return nil
}

type ContentCategoryService struct {
	repo contentdomain.ContentCategoryRepository
}

func NewContentCategoryService(repo contentdomain.ContentCategoryRepository) *ContentCategoryService {
	return &ContentCategoryService{repo: repo}
}

func (s *ContentCategoryService) GetByID(ctx context.Context, id string) (*contentdomain.ContentCategory, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ContentCategoryService) GetByCode(ctx context.Context, code string) (*contentdomain.ContentCategory, error) {
	return s.repo.FindByCode(ctx, code)
}

func (s *ContentCategoryService) ListAll(ctx context.Context) ([]*contentdomain.ContentCategory, error) {
	return s.repo.ListAll(ctx)
}

type CreateCategoryInput struct {
	Name        string
	Code        string
	Icon        *string
	ParentID    *string
	ContentType string
	Description *string
	SortOrder   int
	Status      int
}

func (s *ContentCategoryService) Create(ctx context.Context, input CreateCategoryInput) (*contentdomain.ContentCategory, error) {
	cat := contentdomain.NewContentCategory(utils.GenerateUUID(), input.Name, input.Code)
	cat.SetIcon(input.Icon)
	cat.SetParentID(input.ParentID)
	cat.SetContentType(input.ContentType)
	cat.SetDescription(input.Description)
	cat.SetSortOrder(input.SortOrder)
	cat.SetStatus(contentdomain.CategoryStatus(input.Status))

	if err := s.repo.Save(ctx, cat); err != nil {
		return nil, err
	}

	return cat, nil
}

type UpdateCategoryInput struct {
	ID          string
	Name        string
	Icon        *string
	ContentType string
	Description *string
	SortOrder   int
	Status      int
}

func (s *ContentCategoryService) Update(ctx context.Context, input UpdateCategoryInput) error {
	cat, err := s.repo.FindByID(ctx, input.ID)
	if err != nil {
		return err
	}

	cat.SetName(input.Name)
	cat.SetIcon(input.Icon)
	cat.SetContentType(input.ContentType)
	cat.SetDescription(input.Description)
	cat.SetSortOrder(input.SortOrder)
	cat.SetStatus(contentdomain.CategoryStatus(input.Status))

	return s.repo.Save(ctx, cat)
}

func (s *ContentCategoryService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
