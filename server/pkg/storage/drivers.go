package storage

func GetDriverInfo(driver Driver) map[string]interface{} {
	drivers := map[Driver]map[string]interface{}{
		DriverCloudflare: {
			"name":        "Cloudflare R2",
			"description": "Cloudflare R2 Storage - 无出站流量费用",
			"endpointTpl": "https://<account_id>.r2.cloudflarestorage.com",
			"region":      "auto",
		},
		DriverAWS: {
			"name":        "AWS S3",
			"description": "Amazon Simple Storage Service",
			"endpointTpl": "",
			"region":      "us-east-1",
		},
		DriverMinIO: {
			"name":        "MinIO",
			"description": "自建私有对象存储",
			"endpointTpl": "http://localhost:9000",
			"region":      "us-east-1",
		},
		DriverDigitalOcean: {
			"name":        "DigitalOcean Spaces",
			"description": "DigitalOcean 对象存储",
			"endpointTpl": "https://<region>.digitaloceanspaces.com",
			"region":      "nyc3",
		},
		DriverBackblaze: {
			"name":        "Backblaze B2",
			"description": "Backblaze B2 云存储",
			"endpointTpl": "https://s3.<region>.backblazeb2.com",
			"region":      "us-west-004",
		},
		DriverWasabi: {
			"name":        "Wasabi",
			"description": "Wasabi 云存储 - 无出站费用",
			"endpointTpl": "https://s3.<region>.wasabisys.com",
			"region":      "us-east-1",
		},
		DriverAliyunOSS: {
			"name":        "阿里云 OSS",
			"description": "阿里云对象存储服务",
			"endpointTpl": "https://oss-<region>.aliyuncs.com",
			"region":      "cn-hangzhou",
		},
		DriverTencentCOS: {
			"name":        "腾讯云 COS",
			"description": "腾讯云对象存储服务",
			"endpointTpl": "https://cos.<region>.myqcloud.com",
			"region":      "ap-guangzhou",
		},
		DriverHuaweiOBS: {
			"name":        "华为云 OBS",
			"description": "华为云对象存储服务",
			"endpointTpl": "https://obs.<region>.myhuaweicloud.com",
			"region":      "cn-north-4",
		},
		DriverQiniuKodo: {
			"name":        "七牛云 Kodo",
			"description": "七牛云对象存储服务",
			"endpointTpl": "https://s3-<region>.qiniucs.com",
			"region":      "z0",
		},
		DriverUpyunUSS: {
			"name":        "又拍云 USS",
			"description": "又拍云存储服务",
			"endpointTpl": "https://api.upyun.com",
			"region":      "default",
		},
	}

	if info, ok := drivers[driver]; ok {
		return info
	}
	return nil
}

func GetAllDrivers() []map[string]interface{} {
	drivers := []Driver{
		DriverCloudflare,
		DriverAWS,
		DriverMinIO,
		DriverDigitalOcean,
		DriverBackblaze,
		DriverWasabi,
		DriverAliyunOSS,
		DriverTencentCOS,
		DriverHuaweiOBS,
		DriverQiniuKodo,
		DriverUpyunUSS,
	}

	result := make([]map[string]interface{}, len(drivers))
	for i, driver := range drivers {
		info := GetDriverInfo(driver)
		info["driver"] = driver
		result[i] = info
	}
	return result
}
