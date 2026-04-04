package storage

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"warforge-server/models"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type PresignedUploadResult struct {
	UploadURL   string            `json:"uploadUrl"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers"`
	FilePath    string            `json:"filePath"`
	PublicURL   string            `json:"publicUrl"`
	ExpiresIn   int               `json:"expiresIn"`
	MaxFileSize int64             `json:"maxFileSize"`
	StorageID   string            `json:"storageId"`
}

type StorageClient struct {
	config    *models.StorageConfig
	s3Client  *s3.Client
	presigner *s3.PresignClient
}

var defaultClient *StorageClient

func InitDefault(config *models.StorageConfig) error {
	client, err := NewClient(config)
	if err != nil {
		return err
	}
	defaultClient = client
	return nil
}

func GetDefault() *StorageClient {
	return defaultClient
}

func NewClient(cfg *models.StorageConfig) (*StorageClient, error) {
	awsCfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKey,
			cfg.SecretKey,
			"",
		)),
		config.WithRegion(cfg.Region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	var s3Opts []func(*s3.Options)

	if cfg.Endpoint != "" {
		s3Opts = append(s3Opts, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
			o.UsePathStyle = cfg.Driver == models.StorageDriverMinIO
		})
	}

	s3Client := s3.NewFromConfig(awsCfg, s3Opts...)

	return &StorageClient{
		config:    cfg,
		s3Client:  s3Client,
		presigner: s3.NewPresignClient(s3Client),
	}, nil
}

func (c *StorageClient) GeneratePresignedUploadURL(ctx context.Context, uploadType, userID, originalFilename string, expiresIn time.Duration) (*PresignedUploadResult, error) {
	ext := filepath.Ext(originalFilename)
	timestamp := time.Now().Format("20060102/150405")
	filePath := fmt.Sprintf("%s/%s/%s%s", uploadType, userID, timestamp, ext)
	filePath = strings.ToLower(filePath)

	presignedReq, err := c.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiresIn
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	publicURL := ""
	if c.config.PublicDomain != "" {
		publicURL = fmt.Sprintf("%s/%s", strings.TrimSuffix(c.config.PublicDomain, "/"), filePath)
	}

	return &PresignedUploadResult{
		UploadURL: presignedReq.URL,
		Method:    presignedReq.Method,
		Headers: map[string]string{
			"Content-Type": "application/octet-stream",
		},
		FilePath:    filePath,
		PublicURL:   publicURL,
		ExpiresIn:   int(expiresIn.Seconds()),
		MaxFileSize: c.config.MaxFileSize,
	}, nil
}

func (c *StorageClient) GeneratePresignedDownloadURL(ctx context.Context, filePath string, expiresIn time.Duration) (string, error) {
	presignedReq, err := c.presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expiresIn
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download URL: %w", err)
	}
	return presignedReq.URL, nil
}

func (c *StorageClient) DeleteObject(ctx context.Context, filePath string) error {
	_, err := c.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	})
	return err
}

func (c *StorageClient) ObjectExists(ctx context.Context, filePath string) (bool, error) {
	_, err := c.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	})
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (c *StorageClient) GetPublicURL(filePath string) string {
	if c.config.PublicDomain == "" {
		return ""
	}
	return fmt.Sprintf("%s/%s", strings.TrimSuffix(c.config.PublicDomain, "/"), filePath)
}

func GetDriverInfo(driver models.StorageDriver) map[string]interface{} {
	drivers := map[models.StorageDriver]map[string]interface{}{
		models.StorageDriverCloudflare: {
			"name":        "Cloudflare R2",
			"description": "Cloudflare R2 Storage - 无出站流量费用",
			"endpointTpl": "https://<account_id>.r2.cloudflarestorage.com",
			"region":      "auto",
		},
		models.StorageDriverAWS: {
			"name":        "AWS S3",
			"description": "Amazon Simple Storage Service",
			"endpointTpl": "",
			"region":      "us-east-1",
		},
		models.StorageDriverMinIO: {
			"name":        "MinIO",
			"description": "自建私有对象存储",
			"endpointTpl": "http://localhost:9000",
			"region":      "us-east-1",
		},
		models.StorageDriverDigitalOcean: {
			"name":        "DigitalOcean Spaces",
			"description": "DigitalOcean 对象存储",
			"endpointTpl": "https://<region>.digitaloceanspaces.com",
			"region":      "nyc3",
		},
		models.StorageDriverBackblaze: {
			"name":        "Backblaze B2",
			"description": "Backblaze B2 云存储",
			"endpointTpl": "https://s3.<region>.backblazeb2.com",
			"region":      "us-west-004",
		},
		models.StorageDriverWasabi: {
			"name":        "Wasabi",
			"description": "Wasabi 云存储 - 无出站费用",
			"endpointTpl": "https://s3.<region>.wasabisys.com",
			"region":      "us-east-1",
		},
	}

	if info, ok := drivers[driver]; ok {
		return info
	}
	return nil
}

func GetAllDrivers() []map[string]interface{} {
	drivers := []models.StorageDriver{
		models.StorageDriverCloudflare,
		models.StorageDriverAWS,
		models.StorageDriverMinIO,
		models.StorageDriverDigitalOcean,
		models.StorageDriverBackblaze,
		models.StorageDriverWasabi,
	}

	result := make([]map[string]interface{}, len(drivers))
	for i, driver := range drivers {
		info := GetDriverInfo(driver)
		info["driver"] = driver
		result[i] = info
	}
	return result
}
