package v2

import (
	"warforge-server/internal/interfaces/http/webadmin/handlers/content"
	"warforge-server/internal/interfaces/http/webadmin/handlers/system"
	v2middleware "warforge-server/internal/interfaces/http/webadmin/middleware/v2"

	"github.com/gin-gonic/gin"
)

func SetupV2Routes(r *gin.Engine) {
	v2 := r.Group("/api/v2")
	v2.Use(v2middleware.CORSMiddleware())

	bannerGroupsGroup := v2.Group("/banner-groups")
	bannerGroupsGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		bannerGroupsGroup.GET("", content.GetBannerGroups)
		bannerGroupsGroup.POST("", content.CreateBannerGroup)
		bannerGroupsGroup.PUT("/:id", content.UpdateBannerGroup)
		bannerGroupsGroup.DELETE("/:id", content.DeleteBannerGroup)
	}

	bannersGroup := v2.Group("/banners")
	bannersGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		bannersGroup.GET("", content.GetBanners)
		bannersGroup.POST("", content.CreateBanner)
		bannersGroup.PUT("/:id", content.UpdateBanner)
		bannersGroup.DELETE("/:id", content.DeleteBanner)
	}

	categoriesGroup := v2.Group("/categories")
	categoriesGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		categoriesGroup.GET("", content.GetCategories)
		categoriesGroup.POST("", content.CreateCategory)
		categoriesGroup.PUT("/:id", content.UpdateCategory)
		categoriesGroup.DELETE("/:id", content.DeleteCategory)
	}

	contentsGroup := v2.Group("/contents")
	contentsGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		contentsGroup.GET("", content.GetContents)
		contentsGroup.GET("/:id", content.GetContent)
		contentsGroup.POST("", content.CreateContent)
		contentsGroup.PUT("/:id", content.UpdateContent)
		contentsGroup.DELETE("/:id", content.DeleteContent)
	}

	languagesGroup := v2.Group("/languages")
	languagesGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		languagesGroup.GET("", system.GetLanguages)
		languagesGroup.GET("/supported", system.GetSupportedLanguages)
		languagesGroup.POST("", system.CreateLanguage)
		languagesGroup.PUT("/:id", system.UpdateLanguage)
		languagesGroup.DELETE("/:id", system.DeleteLanguage)
		languagesGroup.PUT("/:id/default", system.SetDefaultLanguage)
		languagesGroup.PUT("/supported", system.SetSupportedLanguages)
	}

	supportGroup := v2.Group("/support")
	supportGroup.Use(v2middleware.Auth(), v2middleware.RBAC())
	{
		supportGroup.POST("/email", content.SendSupportEmail)
	}
}
