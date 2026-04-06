package system

import (
	"warforge-server/internal/domain/shared"
)

type UploadType string

const (
	UploadTypeAvatar   UploadType = "avatar"
	UploadTypeDocument UploadType = "document"
	UploadTypeImage    UploadType = "image"
	UploadTypeOther    UploadType = "other"
)

type UserType string

const (
	UserTypeAdmin  UserType = "admin"
	UserTypePlayer UserType = "player"
)

var (
	ErrUploadRecordNotFound = shared.NewDomainError("upload_record_not_found", "上传记录不存在")
)

type UploadRecord struct {
	shared.BaseEntity
	userID       string
	userType     UserType
	originalName string
	filePath     string
	fileSize     int64
	mimeType     string
	storageID    string
	uploadType   UploadType
}

func NewUploadRecord(id, userID string, userType UserType) *UploadRecord {
	return &UploadRecord{
		BaseEntity: shared.NewBaseEntity(id),
		userID:     userID,
		userType:   userType,
	}
}

func (r *UploadRecord) UserID() string         { return r.userID }
func (r *UploadRecord) UserType() UserType     { return r.userType }
func (r *UploadRecord) OriginalName() string   { return r.originalName }
func (r *UploadRecord) FilePath() string       { return r.filePath }
func (r *UploadRecord) FileSize() int64        { return r.fileSize }
func (r *UploadRecord) MimeType() string       { return r.mimeType }
func (r *UploadRecord) StorageID() string      { return r.storageID }
func (r *UploadRecord) UploadType() UploadType { return r.uploadType }

func (r *UploadRecord) SetOriginalName(name string) { r.originalName = name; r.Touch() }
func (r *UploadRecord) SetFilePath(path string)     { r.filePath = path; r.Touch() }
func (r *UploadRecord) SetFileSize(size int64)      { r.fileSize = size; r.Touch() }
func (r *UploadRecord) SetMimeType(mime string)     { r.mimeType = mime; r.Touch() }
func (r *UploadRecord) SetStorageID(id string)      { r.storageID = id; r.Touch() }
func (r *UploadRecord) SetUploadType(t UploadType)  { r.uploadType = t; r.Touch() }

type UploadRecordDTO struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	UserType     string `json:"userType"`
	OriginalName string `json:"originalName"`
	FilePath     string `json:"filePath"`
	FileSize     int64  `json:"fileSize"`
	MimeType     string `json:"mimeType"`
	StorageID    string `json:"storageId"`
	UploadType   string `json:"uploadType"`
	CreatedAt    string `json:"createdAt"`
}

func (r *UploadRecord) ToDTO() *UploadRecordDTO {
	var createdAt string
	if !r.CreatedAt().IsZero() {
		createdAt = r.CreatedAt().Format("2006-01-02T15:04:05Z07:00")
	}
	return &UploadRecordDTO{
		ID:           r.ID(),
		UserID:       r.userID,
		UserType:     string(r.userType),
		OriginalName: r.originalName,
		FilePath:     r.filePath,
		FileSize:     r.fileSize,
		MimeType:     r.mimeType,
		StorageID:    r.storageID,
		UploadType:   string(r.uploadType),
		CreatedAt:    createdAt,
	}
}

type UploadRecordFilter struct {
	UserID     string
	UserType   UserType
	UploadType UploadType
	Page       int
	PageSize   int
}

type UploadRecordListDTO struct {
	ID           string `json:"id"`
	UserID       string `json:"userId"`
	UserType     string `json:"userType"`
	UserName     string `json:"userName"`
	OriginalName string `json:"originalName"`
	FilePath     string `json:"filePath"`
	FileSize     int64  `json:"fileSize"`
	MimeType     string `json:"mimeType"`
	StorageID    string `json:"storageId"`
	StorageName  string `json:"storageName"`
	UploadType   string `json:"uploadType"`
	CreatedAt    string `json:"createdAt"`
}
