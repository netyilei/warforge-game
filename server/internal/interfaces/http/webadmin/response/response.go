package response

import (
	"github.com/gin-gonic/gin"
)

type Response struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code: 0,
		Msg:  "success",
		Data: data,
	})
}

func SuccessMsg(c *gin.Context, msg string, data interface{}) {
	c.JSON(200, Response{
		Code: 0,
		Msg:  msg,
		Data: data,
	})
}

func Error(c *gin.Context, code int, msg string) {
	c.JSON(200, Response{
		Code: code,
		Msg:  msg,
		Data: nil,
	})
}

func ErrorWithData(c *gin.Context, code int, msg string, data interface{}) {
	c.JSON(200, Response{
		Code: code,
		Msg:  msg,
		Data: data,
	})
}

func BadRequest(c *gin.Context) {
	Error(c, 400, "参数错误")
}

func NotFound(c *gin.Context, msg string) {
	if msg == "" {
		msg = "资源不存在"
	}
	Error(c, 404, msg)
}

func ServerError(c *gin.Context, msg string) {
	if msg == "" {
		msg = "服务器内部错误"
	}
	Error(c, 500, msg)
}

func DBError(c *gin.Context, msg string) {
	if msg == "" {
		msg = "数据库操作失败"
	}
	Error(c, 500, msg)
}

func Unauthorized(c *gin.Context, msg string) {
	if msg == "" {
		msg = "未授权访问"
	}
	Error(c, 401, msg)
}

func Forbidden(c *gin.Context, msg string) {
	if msg == "" {
		msg = "禁止访问"
	}
	Error(c, 403, msg)
}
