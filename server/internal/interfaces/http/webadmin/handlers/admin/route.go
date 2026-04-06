package admin

import (
	"sort"
	"strings"

	admindomain "warforge-server/internal/domain/admin"
	"warforge-server/internal/interfaces/http/webadmin/response"

	"github.com/gin-gonic/gin"
)

type RouteMeta struct {
	Title      string `json:"title"`
	I18nKey    string `json:"i18nKey"`
	Icon       string `json:"icon,omitempty"`
	Href       string `json:"href,omitempty"`
	Order      int    `json:"order,omitempty"`
	HideInMenu bool   `json:"hideInMenu,omitempty"`
	Constant   bool   `json:"constant,omitempty"`
}

type ElegantRoute struct {
	Name      string         `json:"name"`
	Path      string         `json:"path"`
	Component string         `json:"component,omitempty"`
	Props     bool           `json:"props,omitempty"`
	Meta      RouteMeta      `json:"meta"`
	Children  []ElegantRoute `json:"children,omitempty"`
}

type UserRoutesResponse struct {
	Routes []ElegantRoute `json:"routes"`
	Home   string         `json:"home"`
}

func GetUserRoutes(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	svc := getAdminPermissionService()
	permissions, err := svc.GetMenusByUserID(c.Request.Context(), userID.(string))
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

func buildElegantRouteTree(permissions []*admindomain.MenuPermission) []ElegantRoute {
	permissionMap := make(map[string]*admindomain.MenuPermission)
	for _, p := range permissions {
		permissionMap[p.ID] = p
	}

	childrenMap := make(map[string][]*admindomain.MenuPermission)
	for _, p := range permissions {
		if p.ParentID != nil {
			parentID := *p.ParentID
			childrenMap[parentID] = append(childrenMap[parentID], p)
		}
	}

	var rootPermissions []*admindomain.MenuPermission
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

func buildRoute(p *admindomain.MenuPermission, childrenMap map[string][]*admindomain.MenuPermission, isRoot bool) *ElegantRoute {
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

func CheckRouteExist(c *gin.Context) {
	routeName := c.Query("routeName")

	exists := routeName != ""

	response.Success(c, exists)
}
