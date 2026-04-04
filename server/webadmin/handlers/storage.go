// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义存储管理相关的 API 处理函数
package handlers

import (
	"strconv"

	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/modules/storage"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// GetStorageConfigs 获取存储配置列表
func GetStorageConfigs(c *gin.Context) {
	db := database.MustGetDB()
	configs, err := models.StorageConfig{}.ListAll(db)
	if err != nil {
		response.DBError(c, "数据库错误")
		return
	}
	response.Success(c, gin.H{"configs": configs})
}

// GetStorageConfig 获取单个存储配置
func GetStorageConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	config, err := models.StorageConfig{}.GetByID(db, id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	response.Success(c, config)
}

// CreateStorageConfigRequest 创建存储配置请求
type CreateStorageConfigRequest struct {
	Name      string               `json:"name" binding:"required"`
	Driver    models.StorageDriver `json:"driver" binding:"required"`
	Bucket    string               `json:"bucket" binding:"required"`
	Endpoint  string               `json:"endpoint"`
	Region    string               `json:"region"`
	AccessKey string               `json:"accessKey"`
	SecretKey string               `json:"secretKey"`
	IsDefault bool                 `json:"isDefault"`
}

// CreateStorageConfig 创建存储配置
func CreateStorageConfig(c *gin.Context) {
	var req CreateStorageConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	if req.IsDefault {
		models.StorageConfig{}.ClearDefault(db)
	}
	config := &models.StorageConfig{
		Name:      req.Name,
		Driver:    req.Driver,
		Bucket:    req.Bucket,
		Endpoint:  req.Endpoint,
		Region:    req.Region,
		AccessKey: req.AccessKey,
		SecretKey: req.SecretKey,
		IsDefault: req.IsDefault,
		Status:    1,
	}
	if err := config.Create(db); err != nil {
		response.Error(c, 500, "创建存储配置失败")
		return
	}
	response.Success(c, config)
}

// UpdateStorageConfigRequest 更新存储配置请求
type UpdateStorageConfigRequest struct {
	Name      string               `json:"name"`
	Driver    models.StorageDriver `json:"driver"`
	Bucket    string               `json:"bucket"`
	Endpoint  string               `json:"endpoint"`
	Region    string               `json:"region"`
	AccessKey string               `json:"accessKey"`
	SecretKey string               `json:"secretKey"`
	IsDefault bool                 `json:"isDefault"`
}

// UpdateStorageConfig 更新存储配置
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
	existing, err := models.StorageConfig{}.GetByID(db, id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	if req.IsDefault && !existing.IsDefault {
		models.StorageConfig{}.ClearDefault(db)
	}
	if req.SecretKey == "***" {
		req.SecretKey = existing.SecretKey
	}
	config := &models.StorageConfig{
		ID:        id,
		Name:      req.Name,
		Driver:    req.Driver,
		Bucket:    req.Bucket,
		Endpoint:  req.Endpoint,
		Region:    req.Region,
		AccessKey: req.AccessKey,
		SecretKey: req.SecretKey,
		IsDefault: req.IsDefault,
		Status:    existing.Status,
	}
	if err := config.Update(db); err != nil {
		response.Error(c, 500, "更新存储配置失败")
		return
	}
	response.Success(c, config)
}

// DeleteStorageConfig 删除存储配置
func DeleteStorageConfig(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	config, err := models.StorageConfig{}.GetByID(db, id)
	if err != nil {
		response.NotFound(c, "存储配置不存在")
		return
	}
	if config.IsDefault {
		response.Error(c, 400, "不能删除默认存储配置")
		return
	}
	if err := (models.StorageConfig{}).Delete(db, id); err != nil {
		response.Error(c, 500, "删除存储配置失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// SetDefaultStorage 设置默认存储
func SetDefaultStorage(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	if err := (models.StorageConfig{}).SetDefault(db, id); err != nil {
		response.Error(c, 500, "设置默认存储失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// GetStorageDrivers 获取存储驱动列表
func GetStorageDrivers(c *gin.Context) {
	drivers := storage.GetAllDrivers()
	response.Success(c, gin.H{"drivers": drivers})
}

// GetUploadRecords 获取上传记录列表
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
	records, total, err := models.UploadRecord{}.List(db, page, pageSize, userType, uploadType)
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

// DeleteUploadRecord 删除上传记录
func DeleteUploadRecord(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.Error(c, 400, "ID不能为空")
		return
	}
	db := database.MustGetDB()
	record, err := models.UploadRecord{}.GetByID(db, id)
	if err != nil {
		response.NotFound(c, "上传记录不存在")
		return
	}
	if record.StorageID != "" {
		storageConfig, err := models.StorageConfig{}.GetByID(db, record.StorageID)
		if err == nil {
			client, err := storage.NewClient(storageConfig)
			if err == nil {
				client.DeleteObject(c.Request.Context(), record.FilePath)
			}
		}
	}
	if err := (models.UploadRecord{}).Delete(db, id); err != nil {
		response.Error(c, 500, "删除上传记录失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}

// PresignedUploadRequest 预签名上传请求
type PresignedUploadRequest struct {
	UploadType       string `json:"uploadType" binding:"required"`
	OriginalFilename string `json:"originalFilename" binding:"required"`
	StorageID        string `json:"storageId"`
}

// GetPresignedUpload 获取预签名上传URL
func GetPresignedUpload(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req PresignedUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	var storageConfig *models.StorageConfig
	var err error
	if req.StorageID != "" {
		storageConfig, err = models.StorageConfig{}.GetByID(db, req.StorageID)
	} else {
		storageConfig, err = models.StorageConfig{}.GetDefault(db)
	}
	if err != nil {
		response.Error(c, 400, "没有可用的存储配置")
		return
	}
	client, err := storage.NewClient(storageConfig)
	if err != nil {
		response.Error(c, 500, "初始化存储客户端失败")
		return
	}
	result, err := client.GeneratePresignedUploadURL(c.Request.Context(), req.UploadType, userID.(string), req.OriginalFilename, 15*60*1000000000)
	if err != nil {
		response.Error(c, 500, "生成上传URL失败")
		return
	}
	result.StorageID = storageConfig.ID
	response.Success(c, result)
}

// ConfirmUploadRequest 确认上传请求
type ConfirmUploadRequest struct {
	FilePath     string `json:"filePath" binding:"required"`
	OriginalName string `json:"originalName"`
	FileSize     int64  `json:"fileSize"`
	MimeType     string `json:"mimeType"`
	StorageID    string `json:"storageId"`
	UploadType   string `json:"uploadType"`
}

// ConfirmUpload 确认上传
func ConfirmUpload(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req ConfirmUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c)
		return
	}
	db := database.MustGetDB()
	record := &models.UploadRecord{
		UserID:       userID.(string),
		UserType:     "admin",
		OriginalName: req.OriginalName,
		FilePath:     req.FilePath,
		FileSize:     req.FileSize,
		MimeType:     req.MimeType,
		StorageID:    req.StorageID,
		UploadType:   req.UploadType,
	}
	if err := record.Create(db); err != nil {
		response.Error(c, 500, "创建上传记录失败")
		return
	}
	response.Success(c, gin.H{"success": true})
}
