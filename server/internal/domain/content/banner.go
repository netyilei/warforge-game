package content

import (
	"time"

	"warforge-server/internal/domain/shared"
)

type BannerStatus int

const (
	BannerStatusInactive BannerStatus = 0
	BannerStatusActive   BannerStatus = 1
)

type Banner struct {
	shared.BaseEntity
	groupID    string
	imageURL   string
	linkURL    *string
	linkTarget string
	extraData  BannerExtraData
	sortOrder  int
	status     BannerStatus
	deletedAt  *time.Time
}

func NewBanner(id, groupID, imageURL string) *Banner {
	return &Banner{
		BaseEntity: shared.NewBaseEntity(id),
		groupID:    groupID,
		imageURL:   imageURL,
		linkTarget: "_blank",
		status:     BannerStatusActive,
	}
}

func (b *Banner) GroupID() string            { return b.groupID }
func (b *Banner) ImageURL() string           { return b.imageURL }
func (b *Banner) LinkURL() *string           { return b.linkURL }
func (b *Banner) LinkTarget() string         { return b.linkTarget }
func (b *Banner) ExtraData() BannerExtraData { return b.extraData }
func (b *Banner) SortOrder() int             { return b.sortOrder }
func (b *Banner) Status() BannerStatus       { return b.status }
func (b *Banner) DeletedAt() *time.Time      { return b.deletedAt }

func (b *Banner) SetImageURL(url string) {
	b.imageURL = url
	b.Touch()
}

func (b *Banner) SetLinkURL(url *string) {
	b.linkURL = url
	b.Touch()
}

func (b *Banner) SetLinkTarget(target string) {
	b.linkTarget = target
	b.Touch()
}

func (b *Banner) SetExtraData(data BannerExtraData) {
	b.extraData = data
	b.Touch()
}

func (b *Banner) SetSortOrder(order int) {
	b.sortOrder = order
	b.Touch()
}

func (b *Banner) SetStatus(status BannerStatus) {
	b.status = status
	b.Touch()
}

func (b *Banner) IsDeleted() bool {
	return b.deletedAt != nil
}

type BannerExtraData map[string]interface{}

type BannerDTO struct {
	ID         string          `json:"id"`
	GroupID    string          `json:"groupId"`
	ImageURL   string          `json:"imageUrl"`
	LinkURL    string          `json:"linkUrl"`
	LinkTarget string          `json:"linkTarget"`
	ExtraData  BannerExtraData `json:"extraData"`
	SortOrder  int             `json:"sortOrder"`
	Status     int             `json:"status"`
}

func (b *Banner) ToDTO() *BannerDTO {
	dto := &BannerDTO{
		ID:         b.ID(),
		GroupID:    b.groupID,
		ImageURL:   b.imageURL,
		LinkTarget: b.linkTarget,
		ExtraData:  b.extraData,
		SortOrder:  b.sortOrder,
		Status:     int(b.status),
	}
	if b.linkURL != nil {
		dto.LinkURL = *b.linkURL
	}
	return dto
}

type BannerTranslation struct {
	id       string
	bannerID string
	lang     string
	title    string
	content  string
}

func NewBannerTranslation(id, bannerID, lang, title, content string) *BannerTranslation {
	return &BannerTranslation{
		id:       id,
		bannerID: bannerID,
		lang:     lang,
		title:    title,
		content:  content,
	}
}

func (t *BannerTranslation) ID() string       { return t.id }
func (t *BannerTranslation) BannerID() string { return t.bannerID }
func (t *BannerTranslation) Lang() string     { return t.lang }
func (t *BannerTranslation) Title() string    { return t.title }
func (t *BannerTranslation) Content() string  { return t.content }

type BannerTranslationDTO struct {
	Lang    string `json:"lang"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

func (t *BannerTranslation) ToDTO() *BannerTranslationDTO {
	return &BannerTranslationDTO{
		Lang:    t.lang,
		Title:   t.title,
		Content: t.content,
	}
}
