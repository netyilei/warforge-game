package v2

import (
	"warforge-server/internal/interfaces/http/webadmin/handlers/content"
	"warforge-server/internal/interfaces/http/webadmin/middleware"

	"github.com/gin-gonic/gin"
)

func SetupContentRoutes(v2 *gin.RouterGroup) {
	bannerGroupsGroup := v2.Group("/banner-groups")
	bannerGroupsGroup.Use(middleware.Auth(), middleware.RBAC())
	{
		bannerGroupsGroup.GET("", content.GetBannerGroups)
		bannerGroupsGroup.POST("", content.CreateBannerGroup)
		bannerGroupsGroup.PUT("/:id", content.UpdateBannerGroup)
		bannerGroupsGroup.DELETE("/:id", content.DeleteBannerGroup)
	}

	bannersGroup := v2.Group("/banners")
	bannersGroup.Use(middleware.Auth(), middleware.RBAC())
	{
		bannersGroup.GET("", content.GetBanners)
		bannersGroup.POST("", content.CreateBanner)
		bannersGroup.PUT("/:id", content.UpdateBanner)
		bannersGroup.DELETE("/:id", content.DeleteBanner)
	}

	categoriesGroup := v2.Group("/categories")
	categoriesGroup.Use(middleware.Auth(), middleware.RBAC())
	{
		categoriesGroup.GET("", content.GetCategories)
		categoriesGroup.POST("", content.CreateCategory)
		categoriesGroup.PUT("/:id", content.UpdateCategory)
		categoriesGroup.DELETE("/:id", content.DeleteCategory)
	}

	contentsGroup := v2.Group("/contents")
	contentsGroup.Use(middleware.Auth(), middleware.RBAC())
	{
		contentsGroup.GET("", content.GetContents)
		contentsGroup.GET("/:id", content.GetContent)
		contentsGroup.POST("", content.CreateContent)
		contentsGroup.PUT("/:id", content.UpdateContent)
		contentsGroup.DELETE("/:id", content.DeleteContent)
	}
}
