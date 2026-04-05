// Package handlers 提供 Web Admin API 的请求处理函数
//
// 本文件定义路由相关的 API 处理函数
package handlers

import (
	"sort"
	"strings"

	"warforge-server/database"
	"warforge-server/models"
	"warforge-server/webadmin/response"

	"github.com/gin-gonic/gin"
)

// RouteMeta 路由元数据
type RouteMeta struct {
	Title      string `json:"title"`
	I18nKey    string `json:"i18nKey"`
	Icon       string `json:"icon,omitempty"`
	Href       string `json:"href,omitempty"`
	Order      int    `json:"order,omitempty"`
	HideInMenu bool   `json:"hideInMenu,omitempty"`
	Constant   bool   `json:"constant,omitempty"`
}

// ElegantRoute 符合 elegant-router 格式的路由
type ElegantRoute struct {
	Name      string         `json:"name"`
	Path      string         `json:"path"`
	Component string         `json:"component,omitempty"`
	Props     bool           `json:"props,omitempty"`
	Meta      RouteMeta      `json:"meta"`
	Children  []ElegantRoute `json:"children,omitempty"`
}

// UserRoutesResponse 用户路由响应
type UserRoutesResponse struct {
	Routes []ElegantRoute `json:"routes"`
	Home   string         `json:"home"`
}

// GetUserRoutes 获取用户路由
//
// 返回当前用户有权限访问的业务路由列表
func GetUserRoutes(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	db := database.MustGetDB()

	permissions, err := models.AdminPermission{}.GetAllMenusByUserID(db, userID.(string))
	if err != nil {
		response.DBError(c, "获取权限失败")
		return
	}

	routes := buildElegantRouteTree(permissions)

	resp := UserRoutesResponse{
		Routes: routes,
		Home:   "home",
	}

	response.Success(c, resp)
}

// buildElegantRouteTree 构建 elegant-router 格式的路由树
//
// 前端路由格式规则：
// 1. 一级路由（目录型）：有 children，component 为 layout.base
// 2. 二级路由（页面型）：无 children，component 为 view.xxx
// 3. 单层一级路由（如 home）：无 children，component 为 layout.base$view.xxx
func buildElegantRouteTree(permissions []models.MenuPermission) []ElegantRoute {
	permissionMap := make(map[string]models.MenuPermission)
	for _, p := range permissions {
		permissionMap[p.ID] = p
	}

	childrenMap := make(map[string][]models.MenuPermission)
	for _, p := range permissions {
		if p.ParentID != nil {
			parentID := *p.ParentID
			childrenMap[parentID] = append(childrenMap[parentID], p)
		}
	}

	var rootPermissions []models.MenuPermission
	for _, p := range permissions {
		if p.ParentID == nil {
			rootPermissions = append(rootPermissions, p)
		}
	}

	sort.Slice(rootPermissions, func(i, j int) bool {
		return rootPermissions[i].SortOrder < rootPermissions[j].SortOrder
	})

	var routes []ElegantRoute
	for _, p := range rootPermissions {
		route := buildRoute(p, childrenMap, true)
		if route != nil {
			routes = append(routes, *route)
		}
	}

	return routes
}

// buildRoute 构建单个路由
func buildRoute(p models.MenuPermission, childrenMap map[string][]models.MenuPermission, isRoot bool) *ElegantRoute {
	route := &ElegantRoute{
		Name: p.Code,
		Meta: RouteMeta{
			Title:      p.Name,
			I18nKey:    "route." + p.Code,
			HideInMenu: !p.ShowInMenu,
			Order:      p.SortOrder,
		},
	}

	if p.Path != nil {
		route.Path = *p.Path
	}

	if p.Icon != nil && *p.Icon != "" {
		route.Meta.Icon = *p.Icon
	}

	if p.Href != nil && *p.Href != "" {
		route.Meta.Href = *p.Href
	}

	children := childrenMap[p.ID]
	hasChildren := len(children) > 0

	if p.Component != nil && *p.Component != "" {
		route.Component = *p.Component
	} else if isRoot {
		if hasChildren {
			route.Component = "layout.base"
		} else {
			route.Component = "layout.base$view." + p.Code
		}
	} else {
		route.Component = "view." + p.Code
	}

	if hasChildren {
		sort.Slice(children, func(i, j int) bool {
			return children[i].SortOrder < children[j].SortOrder
		})

		route.Children = []ElegantRoute{}
		for _, child := range children {
			childRoute := buildRoute(child, childrenMap, false)
			if childRoute != nil {
				route.Children = append(route.Children, *childRoute)
			}
		}
	}

	if strings.HasPrefix(route.Component, "layout.") && strings.Contains(route.Component, "$") {
		route.Children = nil
	}

	return route
}

// CheckRouteExist 检查路由是否存在
func CheckRouteExist(c *gin.Context) {
	routeName := c.Query("routeName")

	exists := routeName != ""

	response.Success(c, exists)
}
