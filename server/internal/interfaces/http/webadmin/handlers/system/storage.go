package system

import (
	"strconv"
	"time"

	"warforge-server/database"
	systemdomain "warforge-server/internal/domain/system"
	systempersistence "warforge-server/internal/infrastructure/persistence/system"
	"warforge-server/internal/interfaces/http/webadmin/response"
	"warforge-server/pkg/storage"

	"github.com/gin-gonic/gin"
)

func GetStorageConfigs(c *gin.Context) {
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	configs, err := repo.ListAll(c.Request.Context())
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	dtos := make([]*systemdomain.StorageConfigDTO, len(configs))
	for i, config := range configs {
		dtos[i] = config.ToDTO()
	}
	response.Success(c, gin.H{"configs": dtos})
}

func GetStorageConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	config, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	response.Success(c, config.ToDTO())
}

type CreateStorageConfigRequest struct {
	Name         string                     `json:"name" binding:"required"`
	Code         string                     `json:"code"`
	Driver       systemdomain.StorageDriver `json:"driver" binding:"required"`
	Bucket       string                     `json:"bucket" binding:"required"`
	Endpoint     string                     `json:"endpoint"`
	Region       string                     `json:"region"`
	AccessKey    string                     `json:"accessKey"`
	SecretKey    string                     `json:"secretKey"`
	CustomURL    string                     `json:"customUrl"`
	IsDefault    bool                       `json:"isDefault"`
	Status       int                        `json:"status"`
	SortOrder    int                        `json:"sortOrder"`
	MaxFileSize  int64                      `json:"maxFileSize"`
	AllowedTypes string                     `json:"allowedTypes"`
}

func CreateStorageConfig(c *gin.Context) {
	var req CreateStorageConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	if req.Status == 0 {
		req.Status = 1
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)

	if req.IsDefault {
		repo.ClearDefault(c.Request.Context())
	}

	config := systemdomain.NewStorageConfig("", req.Name, req.Driver, req.Bucket)
	config.SetCode(req.Code)
	config.SetEndpoint(req.Endpoint)
	config.SetRegion(req.Region)
	config.SetAccessKey(req.AccessKey)
	config.SetSecretKey(req.SecretKey)
	config.SetCustomURL(req.CustomURL)
	config.SetDefault(req.IsDefault)
	config.SetStatus(systemdomain.StorageConfigStatus(req.Status))
	config.SetSortOrder(req.SortOrder)
	config.SetMaxFileSize(req.MaxFileSize)
	config.SetAllowedTypes(req.AllowedTypes)

	if err := repo.Save(c.Request.Context(), config); err != nil {
		response.Error(c, 500, "创建存储配置失败")
		return
	}
	response.Success(c, config.ToDTO())
}

type UpdateStorageConfigRequest struct {
	Name         string                     `json:"name"`
	Driver       systemdomain.StorageDriver `json:"driver"`
	Bucket       string                     `json:"bucket"`
	Endpoint     string                     `json:"endpoint"`
	Region       string                     `json:"region"`
	AccessKey    string                     `json:"accessKey"`
	SecretKey    string                     `json:"secretKey"`
	CustomURL    string                     `json:"customUrl"`
	IsDefault    bool                       `json:"isDefault"`
	Status       int                        `json:"status"`
	SortOrder    int                        `json:"sortOrder"`
	MaxFileSize  int64                      `json:"maxFileSize"`
	AllowedTypes string                     `json:"allowedTypes"`
}

func UpdateStorageConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	var req UpdateStorageConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	existing, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	if req.IsDefault && !existing.IsDefault() {
		repo.ClearDefault(c.Request.Context())
	}
	secretKey := req.SecretKey
	if secretKey == "***" {
		secretKey = existing.SecretKey()
	}

	existing.SetName(req.Name)
	existing.SetDriver(req.Driver)
	existing.SetBucket(req.Bucket)
	existing.SetEndpoint(req.Endpoint)
	existing.SetRegion(req.Region)
	existing.SetAccessKey(req.AccessKey)
	existing.SetSecretKey(secretKey)
	existing.SetCustomURL(req.CustomURL)
	existing.SetDefault(req.IsDefault)
	existing.SetStatus(systemdomain.StorageConfigStatus(req.Status))
	existing.SetSortOrder(req.SortOrder)
	existing.SetMaxFileSize(req.MaxFileSize)
	existing.SetAllowedTypes(req.AllowedTypes)

	if err := repo.Save(c.Request.Context(), existing); err != nil {
		response.Error(c, 500, "更新存储配置失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func DeleteStorageConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	config, err := repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	if config.IsDefault() {
		response.Error(c, 400, "不能删除默认存储配置")
		return
	}
	if err := repo.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "删除存储配置失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func SetDefaultStorage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	if err := repo.SetDefault(c.Request.Context(), id); err != nil {
		response.Error(c, 500, "设置默认存储失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

func GetStorageDrivers(c *gin.Context) {
	drivers := storage.GetAllDrivers()
	response.Success(c, gin.H{"drivers": drivers})
}

func GetUploadRecords(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		if val, err := strconv.Atoi(p); err == nil {
			page = val
		}
	}
	if ps := c.Query("pageSize"); ps != "" {
		if val, err := strconv.Atoi(ps); err == nil {
			pageSize = val
		}
	}
	userType := c.Query("userType")
	uploadType := c.Query("uploadType")
	db := database.MustGetDB()
	repo := systempersistence.NewUploadRecordRepository(db)
	records, total, err := repo.ListWithDetails(c.Request.Context(), page, pageSize, userType, uploadType)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{
		"list":     records,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func DeleteUploadRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewUploadRecordRepository(db)
	recordID, _, _, _, _, filePath, _, storageID, err := repo.GetByIDSimple(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "上传记录不存在")
		return
	}
	if storageID != "" {
		storageRepo := systempersistence.NewStorageConfigRepository(db)
		storageConfig, err := storageRepo.FindByID(c.Request.Context(), storageID)
		if err == nil {
			client, err := storage.NewClient(storageConfig.ToPkgConfig())
			if err == nil {
				client.DeleteObject(c.Request.Context(), filePath)
			}
		}
	}
	if err := repo.Delete(c.Request.Context(), recordID); err != nil {
		response.Error(c, 500, "删除上传记录失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

type PresignedUploadRequest struct {
	UploadType       string `json:"uploadType" binding:"required"`
	OriginalFilename string `json:"originalFilename" binding:"required"`
	StorageID        string `json:"storageId"`
}

func GetPresignedUpload(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req PresignedUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewStorageConfigRepository(db)
	var storageConfig *systemdomain.StorageConfig
	var err error
	if req.StorageID != "" {
		storageConfig, err = repo.FindByID(c.Request.Context(), req.StorageID)
	} else {
		storageConfig, err = repo.FindDefault(c.Request.Context())
	}
	if err != nil {
		response.Error(c, 400, "没有可用的存储配置")
		return
	}
	client, err := storage.NewClient(storageConfig.ToPkgConfig())
	if err != nil {
		response.Error(c, 500, "初始化存储客户端失败")
		return
	}
	result, err := client.GeneratePresignedUploadURL(c.Request.Context(), req.UploadType, userID.(string), req.OriginalFilename, 15*time.Minute)
	if err != nil {
		response.Error(c, 500, "生成上传URL失败")
		return
	}
	result.StorageID = storageConfig.ID()
	response.Success(c, result)
}

type ConfirmUploadRequest struct {
	FilePath     string `json:"filePath" binding:"required"`
	OriginalName string `json:"originalName"`
	FileSize     int64  `json:"fileSize"`
	MimeType     string `json:"mimeType"`
	StorageID    string `json:"storageId"`
	UploadType   string `json:"uploadType"`
}

func ConfirmUpload(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req ConfirmUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	repo := systempersistence.NewUploadRecordRepository(db)
	_, err := repo.Create(c.Request.Context(), userID.(string), "admin", req.OriginalName, req.FilePath, req.FileSize, req.MimeType, req.StorageID, req.UploadType)
	if err != nil {
		response.Error(c, 500, "创建上传记录失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
