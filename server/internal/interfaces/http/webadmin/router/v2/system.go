package v2

import (
	"warforge-server/internal/interfaces/http/webadmin/handlers/system"
	"warforge-server/internal/interfaces/http/webadmin/middleware"

	"github.com/gin-gonic/gin"
)

func SetupSystemRoutes(v2 *gin.RouterGroup) {
	languagesGroup := v2.Group("/languages")
	languagesGroup.Use(middleware.Auth(), middleware.RBAC())
	{
		languagesGroup.GET("", system.GetLanguages)
		languagesGroup.GET("/supported", system.GetSupportedLanguages)
		languagesGroup.POST("", system.CreateLanguage)
		languagesGroup.PUT("/:id", system.UpdateLanguage)
		languagesGroup.DELETE("/:id", system.DeleteLanguage)
		languagesGroup.PUT("/:id/default", system.SetDefaultLanguage)
		languagesGroup.PUT("/supported", system.SetSupportedLanguages)
	}
}
