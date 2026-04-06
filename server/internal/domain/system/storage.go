package system

import (
	"warforge-server/internal/domain/shared"
	"warforge-server/pkg/storage"
)

type StorageDriver = storage.Driver

const (
	StorageDriverCloudflare   = storage.DriverCloudflare
	StorageDriverAWS          = storage.DriverAWS
	StorageDriverMinIO        = storage.DriverMinIO
	StorageDriverDigitalOcean = storage.DriverDigitalOcean
	StorageDriverBackblaze    = storage.DriverBackblaze
	StorageDriverWasabi       = storage.DriverWasabi
	StorageDriverAliyunOSS    = storage.DriverAliyunOSS
	StorageDriverTencentCOS   = storage.DriverTencentCOS
	StorageDriverHuaweiOBS    = storage.DriverHuaweiOBS
	StorageDriverQiniuKodo    = storage.DriverQiniuKodo
	StorageDriverUpyunUSS     = storage.DriverUpyunUSS
)

var (
	ErrStorageConfigNotFound   = shared.NewDomainError("storage_config_not_found", "存储配置不存在")
	ErrStorageConfigCodeExists = shared.NewDomainError("storage_config_code_exists", "存储配置标识已存在")
)

type StorageConfig struct {
	shared.BaseEntity
	name         string
	code         string
	driver       StorageDriver
	bucket       string
	endpoint     string
	region       string
	accessKey    string
	secretKey    string
	customURL    string
	maxFileSize  int64
	allowedTypes string
	isDefault    bool
	status       StorageConfigStatus
	sortOrder    int
}

type StorageConfigStatus int

const (
	StorageConfigStatusInactive StorageConfigStatus = 0
	StorageConfigStatusActive   StorageConfigStatus = 1
)

func NewStorageConfig(id, name string, driver StorageDriver, bucket string) *StorageConfig {
	return &StorageConfig{
		BaseEntity: shared.NewBaseEntity(id),
		name:       name,
		driver:     driver,
		bucket:     bucket,
		status:     StorageConfigStatusActive,
	}
}

func (c *StorageConfig) Name() string                { return c.name }
func (c *StorageConfig) Code() string                { return c.code }
func (c *StorageConfig) Driver() StorageDriver       { return c.driver }
func (c *StorageConfig) Bucket() string              { return c.bucket }
func (c *StorageConfig) Endpoint() string            { return c.endpoint }
func (c *StorageConfig) Region() string              { return c.region }
func (c *StorageConfig) AccessKey() string           { return c.accessKey }
func (c *StorageConfig) SecretKey() string           { return c.secretKey }
func (c *StorageConfig) CustomURL() string           { return c.customURL }
func (c *StorageConfig) MaxFileSize() int64          { return c.maxFileSize }
func (c *StorageConfig) AllowedTypes() string        { return c.allowedTypes }
func (c *StorageConfig) IsDefault() bool             { return c.isDefault }
func (c *StorageConfig) Status() StorageConfigStatus { return c.status }
func (c *StorageConfig) SortOrder() int              { return c.sortOrder }

func (c *StorageConfig) SetName(name string)                  { c.name = name; c.Touch() }
func (c *StorageConfig) SetCode(code string)                  { c.code = code; c.Touch() }
func (c *StorageConfig) SetDriver(driver StorageDriver)       { c.driver = driver; c.Touch() }
func (c *StorageConfig) SetBucket(bucket string)              { c.bucket = bucket; c.Touch() }
func (c *StorageConfig) SetEndpoint(endpoint string)          { c.endpoint = endpoint; c.Touch() }
func (c *StorageConfig) SetRegion(region string)              { c.region = region; c.Touch() }
func (c *StorageConfig) SetAccessKey(key string)              { c.accessKey = key; c.Touch() }
func (c *StorageConfig) SetSecretKey(key string)              { c.secretKey = key; c.Touch() }
func (c *StorageConfig) SetCustomURL(url string)              { c.customURL = url; c.Touch() }
func (c *StorageConfig) SetMaxFileSize(size int64)            { c.maxFileSize = size; c.Touch() }
func (c *StorageConfig) SetAllowedTypes(types string)         { c.allowedTypes = types; c.Touch() }
func (c *StorageConfig) SetDefault(isDefault bool)            { c.isDefault = isDefault; c.Touch() }
func (c *StorageConfig) SetStatus(status StorageConfigStatus) { c.status = status; c.Touch() }
func (c *StorageConfig) SetSortOrder(order int)               { c.sortOrder = order; c.Touch() }

func (c *StorageConfig) ToPkgConfig() *storage.Config {
	return &storage.Config{
		ID:           c.ID(),
		Name:         c.name,
		Driver:       c.driver,
		Bucket:       c.bucket,
		Endpoint:     c.endpoint,
		Region:       c.region,
		AccessKey:    c.accessKey,
		SecretKey:    c.secretKey,
		CustomURL:    c.customURL,
		MaxFileSize:  c.maxFileSize,
		AllowedTypes: c.allowedTypes,
		IsDefault:    c.isDefault,
		Status:       int(c.status),
	}
}

type StorageConfigDTO struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Code         string        `json:"code"`
	Driver       StorageDriver `json:"driver"`
	Bucket       string        `json:"bucket"`
	Endpoint     string        `json:"endpoint"`
	Region       string        `json:"region"`
	AccessKey    string        `json:"accessKey"`
	SecretKey    string        `json:"secretKey"`
	CustomURL    string        `json:"customUrl"`
	IsDefault    bool          `json:"isDefault"`
	Status       int           `json:"status"`
	SortOrder    int           `json:"sortOrder"`
	MaxFileSize  int64         `json:"maxFileSize"`
	AllowedTypes string        `json:"allowedTypes"`
}

func (c *StorageConfig) ToDTO() *StorageConfigDTO {
	return &StorageConfigDTO{
		ID:           c.ID(),
		Name:         c.name,
		Code:         c.code,
		Driver:       c.driver,
		Bucket:       c.bucket,
		Endpoint:     c.endpoint,
		Region:       c.region,
		AccessKey:    c.accessKey,
		SecretKey:    c.secretKey,
		CustomURL:    c.customURL,
		IsDefault:    c.isDefault,
		Status:       int(c.status),
		SortOrder:    c.sortOrder,
		MaxFileSize:  c.maxFileSize,
		AllowedTypes: c.allowedTypes,
	}
}
