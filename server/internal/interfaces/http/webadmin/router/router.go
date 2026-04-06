package router

import (
	v1 "warforge-server/internal/interfaces/http/webadmin/router/v1"
	v2 "warforge-server/internal/interfaces/http/webadmin/router/v2"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	v1.SetupV1Routes(r)
	v2.SetupV2Routes(r)

	return r
}
