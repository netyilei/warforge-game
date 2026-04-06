package storage

type Driver string

const (
	DriverCloudflare   Driver = "cloudflare"
	DriverAWS          Driver = "aws"
	DriverMinIO        Driver = "minio"
	DriverDigitalOcean Driver = "digitalocean"
	DriverBackblaze    Driver = "backblaze"
	DriverWasabi       Driver = "wasabi"
	DriverAliyunOSS    Driver = "aliyun"
	DriverTencentCOS   Driver = "tencent"
	DriverHuaweiOBS    Driver = "huawei"
	DriverQiniuKodo    Driver = "qiniu"
	DriverUpyunUSS     Driver = "upyun"
)

type Config struct {
	ID           string
	Name         string
	Driver       Driver
	Bucket       string
	Endpoint     string
	Region       string
	AccessKey    string
	SecretKey    string
	CustomURL    string
	MaxFileSize  int64
	AllowedTypes string
	IsDefault    bool
	Status       int
}

func (c *Config) IsPathStyle() bool {
	return c.Driver == DriverMinIO
}
