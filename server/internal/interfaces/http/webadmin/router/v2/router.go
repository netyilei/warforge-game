package v2

import (
	"github.com/gin-gonic/gin"
)

func SetupV2Routes(r *gin.Engine) {
	v2 := r.Group("/api/v2")

	SetupContentRoutes(v2)
	SetupSystemRoutes(v2)
}
