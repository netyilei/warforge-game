package webadmin

import (
	"warforge-server/webadmin/handlers"

	"github.com/gin-gonic/gin"
)

func registerRoutes(router *gin.Engine) {
	api := router.Group("/api-v1")
	api.Use(OperationLogMiddleware())
	{
		api.POST("/login", handlers.Login)
		api.POST("/logout", AuthMiddleware(), handlers.Logout)
		api.GET("/userinfo", AuthMiddleware(), handlers.GetUserInfo)
		api.POST("/change-password", AuthMiddleware(), handlers.ChangePassword)
		api.POST("/refresh-token", handlers.RefreshToken)
	}

	routes := api.Group("/routes", AuthMiddleware())
	{
		routes.GET("", handlers.GetUserRoutes)
		routes.GET("/check", handlers.CheckRouteExist)
	}

	admin := api.Group("/admin", AuthMiddleware())
	{
		admin.GET("", handlers.GetAdmins)
		admin.GET("/:id", handlers.GetAdmin)
		admin.POST("", handlers.CreateAdmin)
		admin.PUT("/:id", handlers.UpdateAdmin)
		admin.DELETE("/:id", handlers.DeleteAdmin)
		admin.GET("/:id/roles", handlers.GetAdminRoles)
		admin.PUT("/:id/roles", handlers.UpdateAdminRoles)
	}

	roles := api.Group("/roles", AuthMiddleware())
	{
		roles.GET("", handlers.GetRoles)
		roles.GET("/:id", handlers.GetRole)
		roles.POST("", handlers.CreateRole)
		roles.PUT("/:id", handlers.UpdateRole)
		roles.DELETE("/:id", handlers.DeleteRole)
		roles.GET("/:id/permissions", handlers.GetRolePermissions)
		roles.PUT("/:id/permissions", handlers.UpdateRolePermissions)
	}

	permissions := api.Group("/permissions", AuthMiddleware())
	{
		permissions.GET("", handlers.GetPermissions)
		permissions.GET("/tree", handlers.GetPermissionTree)
		permissions.GET("/:id", handlers.GetPermission)
		permissions.POST("", handlers.CreatePermission)
		permissions.PUT("/:id", handlers.UpdatePermission)
		permissions.PUT("/:id/move", handlers.MovePermission)
		permissions.PUT("/batch-sort", handlers.BatchUpdateSortOrder)
		permissions.DELETE("/:id", handlers.DeletePermission)
	}

	storage := api.Group("/storage", AuthMiddleware())
	{
		storage.GET("/configs", handlers.GetStorageConfigs)
		storage.GET("/config/:id", handlers.GetStorageConfig)
		storage.POST("/config", handlers.CreateStorageConfig)
		storage.PUT("/config/:id", handlers.UpdateStorageConfig)
		storage.DELETE("/config/:id", handlers.DeleteStorageConfig)
		storage.PUT("/config/:id/default", handlers.SetDefaultStorage)
		storage.GET("/drivers", handlers.GetStorageDrivers)
		storage.GET("/records", handlers.GetUploadRecords)
		storage.DELETE("/record/:id", handlers.DeleteUploadRecord)
		storage.POST("/presigned", handlers.GetPresignedUpload)
		storage.POST("/confirm", handlers.ConfirmUpload)
	}

	settings := api.Group("/settings", AuthMiddleware())
	{
		settings.GET("", handlers.GetSettings)
		settings.PUT("", handlers.UpdateSettings)
	}

	languages := api.Group("/languages", AuthMiddleware())
	{
		languages.GET("", handlers.GetLanguages)
		languages.POST("", handlers.CreateLanguage)
		languages.PUT("/:id", handlers.UpdateLanguage)
		languages.DELETE("/:id", handlers.DeleteLanguage)
		languages.PUT("/supported", handlers.SetSupportedLanguages)
		languages.GET("/supported", handlers.GetSupportedLanguages)
		languages.PUT("/:id/default", handlers.SetDefaultLanguage)
	}

	bannerGroups := api.Group("/banner-groups", AuthMiddleware())
	{
		bannerGroups.GET("", handlers.GetBannerGroups)
		bannerGroups.POST("", handlers.CreateBannerGroup)
		bannerGroups.PUT("/:id", handlers.UpdateBannerGroup)
		bannerGroups.DELETE("/:id", handlers.DeleteBannerGroup)
	}

	banners := api.Group("/banners", AuthMiddleware())
	{
		banners.GET("", handlers.GetBanners)
		banners.POST("", handlers.CreateBanner)
		banners.PUT("/:id", handlers.UpdateBanner)
		banners.DELETE("/:id", handlers.DeleteBanner)
	}

	content := api.Group("/content", AuthMiddleware())
	{
		content.GET("/categories", handlers.GetCategories)
		content.POST("/categories", handlers.CreateCategory)
		content.PUT("/categories/:id", handlers.UpdateCategory)
		content.DELETE("/categories/:id", handlers.DeleteCategory)
		content.GET("", handlers.GetContents)
		content.GET("/:id", handlers.GetContent)
		content.POST("", handlers.CreateContent)
		content.PUT("/:id", handlers.UpdateContent)
		content.DELETE("/:id", handlers.DeleteContent)
	}

	operations := api.Group("/operations", AuthMiddleware())
	{
		operations.GET("/logs", handlers.GetOperationLogs)
	}

	email := api.Group("/email", AuthMiddleware())
	{
		email.GET("/configs", handlers.GetEmailConfigs)
		email.GET("/configs/:id", handlers.GetEmailConfig)
		email.POST("/configs", handlers.CreateEmailConfig)
		email.PUT("/configs/:id", handlers.UpdateEmailConfig)
		email.DELETE("/configs/:id", handlers.DeleteEmailConfig)
		email.GET("/templates", handlers.GetEmailTemplates)
		email.GET("/templates/:id", handlers.GetEmailTemplate)
		email.POST("/templates", handlers.CreateEmailTemplate)
		email.PUT("/templates/:id", handlers.UpdateEmailTemplate)
		email.DELETE("/templates/:id", handlers.DeleteEmailTemplate)
		email.POST("/send-test", handlers.SendTestEmail)
	}

	support := api.Group("/support", AuthMiddleware())
	{
		support.POST("/send-email", handlers.SendSupportEmail)
	}
}
