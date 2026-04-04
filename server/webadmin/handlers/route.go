// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义路由相关的 API 处理函数
package handlers

import (
	"sort"

	"warforge-server/database"
	"warforge-server/models"

	"github.com/gin-gonic/gin"
)

// GetConstantRoutes 获取常量路由
//
// 返回不需要权限验证的路由列表
func GetConstantRoutes(c *gin.Context) {
	routes := []map[string]interface{}{
		{
			"name":      "login",
			"path":      "/login/:module(pwd-login)?",
			"component": "layout.blank$view.login",
			"props":     true,
			"meta": map[string]interface{}{
				"title":      "登录",
				"i18nKey":    "route.login",
				"constant":   true,
				"hideInMenu": true,
			},
		},
		{
			"name":      "403",
			"path":      "/403",
			"component": "layout.blank$view.403",
			"meta": map[string]interface{}{
				"title":      "无权限",
				"i18nKey":    "route.403",
				"constant":   true,
				"hideInMenu": true,
			},
		},
		{
			"name":      "404",
			"path":      "/404",
			"component": "layout.blank$view.404",
			"meta": map[string]interface{}{
				"title":      "页面不存在",
				"i18nKey":    "route.404",
				"constant":   true,
				"hideInMenu": true,
			},
		},
		{
			"name":      "500",
			"path":      "/500",
			"component": "layout.blank$view.500",
			"meta": map[string]interface{}{
				"title":      "服务器错误",
				"i18nKey":    "route.500",
				"constant":   true,
				"hideInMenu": true,
			},
		},
	}

	c.JSON(200, gin.H{
		"code": 0,
		"data": routes,
		"msg":  "success",
	})
}

// GetUserRoutes 获取用户路由
//
// 返回当前用户有权限访问的路由列表
func GetUserRoutes(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(200, gin.H{
			"code": 401,
			"msg":  "未登录",
		})
		return
	}

	db := database.GetDB()
	if db == nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "数据库错误",
		})
		return
	}

	// 获取用户的菜单权限
	permissions, err := models.AdminPermission{}.GetMenusByUserID(db, userID.(string))
	if err != nil {
		c.JSON(200, gin.H{
			"code": 500,
			"msg":  "获取权限失败",
		})
		return
	}

	// 构建路由树
	routes := buildRouteTree(permissions, nil)

	c.JSON(200, gin.H{
		"code": 0,
		"data": gin.H{
			"routes": routes,
			"home":   "home",
		},
		"msg": "success",
	})
}

// buildRouteTree 构建路由树
func buildRouteTree(permissions []models.MenuPermission, parentID *string) []map[string]interface{} {
	var routes []map[string]interface{}

	// 筛选出当前层级的权限
	var currentLevel []models.MenuPermission
	for _, p := range permissions {
		if p.ParentID == nil && parentID == nil {
			currentLevel = append(currentLevel, p)
		} else if p.ParentID != nil && parentID != nil && *p.ParentID == *parentID {
			currentLevel = append(currentLevel, p)
		}
	}

	// 按 sortOrder 排序
	sort.Slice(currentLevel, func(i, j int) bool {
		return currentLevel[i].SortOrder < currentLevel[j].SortOrder
	})

	for _, p := range currentLevel {
		route := map[string]interface{}{
			"name": p.Code,
			"meta": map[string]interface{}{
				"title":   p.Name,
				"i18nKey": "route." + p.Code,
			},
		}

		// 设置路径
		if p.Path != nil {
			route["path"] = *p.Path
		}

		// 设置图标
		if p.Icon != nil && *p.Icon != "" {
			route["meta"].(map[string]interface{})["icon"] = *p.Icon
		}

		// 设置组件
		if p.Component != nil && *p.Component != "" {
			// 使用数据库中的组件配置
			route["component"] = *p.Component
		} else if parentID == nil {
			// 顶级菜单默认使用 layout.base
			route["component"] = "layout.base"
		}

		// 递归构建子路由
		children := buildRouteTree(permissions, &p.ID)
		if len(children) > 0 {
			route["children"] = children
		}

		routes = append(routes, route)
	}

	return routes
}

// CheckRouteExist 检查路由是否存在
//
// 检查指定路由名称是否存在
func CheckRouteExist(c *gin.Context) {
	routeName := c.Query("routeName")

	exists := routeName != ""

	c.JSON(200, gin.H{
		"code": 0,
		"data": exists,
		"msg":  "success",
	})
}
