package storage

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

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

type Client struct {
	config    *Config
	s3Client  *s3.Client
	presigner *s3.PresignClient
}

var defaultClient *Client

func InitDefault(cfg *Config) error {
	client, err := NewClient(cfg)
	if err != nil {
		return err
	}
	defaultClient = client
	return nil
}

func GetDefault() *Client {
	return defaultClient
}

func NewClient(cfg *Config) (*Client, error) {
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
			o.UsePathStyle = cfg.IsPathStyle()
		})
	}

	s3Client := s3.NewFromConfig(awsCfg, s3Opts...)

	return &Client{
		config:    cfg,
		s3Client:  s3Client,
		presigner: s3.NewPresignClient(s3Client),
	}, nil
}

func (c *Client) Config() *Config {
	return c.config
}

func (c *Client) GeneratePresignedUploadURL(ctx context.Context, uploadType, userID, originalFilename string, expiresIn time.Duration) (*PresignedUploadResult, error) {
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
	if c.config.CustomURL != "" {
		publicURL = fmt.Sprintf("%s/%s", strings.TrimSuffix(c.config.CustomURL, "/"), filePath)
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
		StorageID:   c.config.ID,
	}, nil
}

func (c *Client) GeneratePresignedDownloadURL(ctx context.Context, filePath string, expiresIn time.Duration) (string, error) {
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

func (c *Client) DeleteObject(ctx context.Context, filePath string) error {
	_, err := c.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	})
	return err
}

func (c *Client) ObjectExists(ctx context.Context, filePath string) (bool, error) {
	_, err := c.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.config.Bucket),
		Key:    aws.String(filePath),
	})
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (c *Client) GetPublicURL(filePath string) string {
	if c.config.CustomURL == "" {
		return ""
	}
	return fmt.Sprintf("%s/%s", strings.TrimSuffix(c.config.CustomURL, "/"), filePath)
}
