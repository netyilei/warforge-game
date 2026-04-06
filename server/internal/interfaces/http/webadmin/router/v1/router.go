package v1

import (
	"warforge-server/internal/interfaces/http/webadmin/handlers/admin"
	"warforge-server/internal/interfaces/http/webadmin/handlers/auth"
	"warforge-server/internal/interfaces/http/webadmin/handlers/system"
	v1middleware "warforge-server/internal/interfaces/http/webadmin/middleware/v1"

	"github.com/gin-gonic/gin"
)

func SetupV1Routes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	v1.Use(v1middleware.CORSMiddleware())

	{
		v1.POST("/auth/login", auth.Login)
		v1.POST("/auth/refresh-token", auth.RefreshToken)
	}

	authGroup := v1.Group("/auth")
	authGroup.Use(v1middleware.Auth())
	{
		authGroup.POST("/logout", auth.Logout)
		authGroup.GET("/user-info", auth.GetUserInfo)
		authGroup.PUT("/change-password", auth.ChangePassword)
		authGroup.PUT("/profile", auth.UpdateProfile)
		authGroup.GET("/routes", admin.GetUserRoutes)
	}

	adminsGroup := v1.Group("/admins")
	adminsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		adminsGroup.GET("", admin.GetAdmins)
		adminsGroup.GET("/:id", admin.GetAdmin)
		adminsGroup.POST("", admin.CreateAdmin)
		adminsGroup.PUT("/:id", admin.UpdateAdmin)
		adminsGroup.DELETE("/:id", admin.DeleteAdmin)
		adminsGroup.GET("/:id/roles", admin.GetAdminRoles)
		adminsGroup.PUT("/:id/roles", admin.UpdateAdminRoles)
	}

	rolesGroup := v1.Group("/roles")
	rolesGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		rolesGroup.GET("", admin.GetRoles)
		rolesGroup.GET("/:id", admin.GetRole)
		rolesGroup.POST("", admin.CreateRole)
		rolesGroup.PUT("/:id", admin.UpdateRole)
		rolesGroup.DELETE("/:id", admin.DeleteRole)
		rolesGroup.GET("/:id/permissions", admin.GetRolePermissions)
		rolesGroup.PUT("/:id/permissions", admin.UpdateRolePermissions)
	}

	permissionsGroup := v1.Group("/permissions")
	permissionsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		permissionsGroup.GET("", admin.GetPermissions)
		permissionsGroup.GET("/tree", admin.GetPermissionTree)
		permissionsGroup.GET("/:id", admin.GetPermission)
		permissionsGroup.POST("", admin.CreatePermission)
		permissionsGroup.PUT("/:id", admin.UpdatePermission)
		permissionsGroup.DELETE("/:id", admin.DeletePermission)
		permissionsGroup.PUT("/:id/move", admin.MovePermission)
		permissionsGroup.PUT("/sort", admin.BatchUpdateSortOrder)
	}

	menusGroup := v1.Group("/menus")
	menusGroup.Use(v1middleware.Auth())
	{
		menusGroup.GET("", admin.GetMenus)
	}

	operationLogsGroup := v1.Group("/operation-logs")
	operationLogsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		operationLogsGroup.GET("", admin.GetOperationLogs)
	}

	storageConfigsGroup := v1.Group("/storage-configs")
	storageConfigsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		storageConfigsGroup.GET("", system.GetStorageConfigs)
		storageConfigsGroup.GET("/:id", system.GetStorageConfig)
		storageConfigsGroup.POST("", system.CreateStorageConfig)
		storageConfigsGroup.PUT("/:id", system.UpdateStorageConfig)
		storageConfigsGroup.DELETE("/:id", system.DeleteStorageConfig)
		storageConfigsGroup.PUT("/:id/default", system.SetDefaultStorage)
		storageConfigsGroup.GET("/drivers", system.GetStorageDrivers)
	}

	uploadRecordsGroup := v1.Group("/upload-records")
	uploadRecordsGroup.Use(v1middleware.Auth())
	{
		uploadRecordsGroup.POST("/presigned", system.GetPresignedUpload)
		uploadRecordsGroup.POST("/confirm", system.ConfirmUpload)
	}

	uploadRecordsAdminGroup := v1.Group("/upload-records")
	uploadRecordsAdminGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		uploadRecordsAdminGroup.GET("", system.GetUploadRecords)
		uploadRecordsAdminGroup.DELETE("/:id", system.DeleteUploadRecord)
	}

	emailConfigsGroup := v1.Group("/email-configs")
	emailConfigsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		emailConfigsGroup.GET("", system.GetEmailConfigs)
		emailConfigsGroup.GET("/:id", system.GetEmailConfig)
		emailConfigsGroup.POST("", system.CreateEmailConfig)
		emailConfigsGroup.PUT("/:id", system.UpdateEmailConfig)
		emailConfigsGroup.DELETE("/:id", system.DeleteEmailConfig)
		emailConfigsGroup.POST("/test", system.SendTestEmail)
	}

	emailTemplatesGroup := v1.Group("/email-templates")
	emailTemplatesGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		emailTemplatesGroup.GET("", system.GetEmailTemplates)
		emailTemplatesGroup.GET("/:id", system.GetEmailTemplate)
		emailTemplatesGroup.POST("", system.CreateEmailTemplate)
		emailTemplatesGroup.PUT("/:id", system.UpdateEmailTemplate)
		emailTemplatesGroup.DELETE("/:id", system.DeleteEmailTemplate)
	}

	systemConfigsGroup := v1.Group("/system-configs")
	systemConfigsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		systemConfigsGroup.GET("", system.GetSystemConfigs)
		systemConfigsGroup.GET("/:key", system.GetSystemConfig)
		systemConfigsGroup.POST("", system.CreateSystemConfig)
		systemConfigsGroup.PUT("/:key", system.UpdateSystemConfig)
		systemConfigsGroup.DELETE("/:key", system.DeleteSystemConfig)
	}

	settingsGroup := v1.Group("/settings")
	settingsGroup.Use(v1middleware.Auth(), v1middleware.RBAC())
	{
		settingsGroup.GET("", system.GetSettings)
		settingsGroup.PUT("", system.UpdateSettings)
	}
}
