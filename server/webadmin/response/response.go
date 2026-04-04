// Package response 提供统一的 HTTP 响应辅助函数
//
// 本包定义统一的 HTTP 响应辅助函数，确保：
// - 响应格式统一
// - 减少重复代码
// - 便于维护
//
// 设计原则：
// - Handler 不应关心数据库连接状态
// - 数据库连接在服务启动时确保可用
// - 使用 database.MustGetDB() 获取数据库实例
package response

import (
	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// Success 成功响应
//
// 返回成功结果
func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code: 0,
		Msg:  "success",
		Data: data,
	})
}

// SuccessMsg 成功响应（带自定义消息）
//
// 返回成功结果和自定义消息
func SuccessMsg(c *gin.Context, msg string, data interface{}) {
	c.JSON(200, Response{
		Code: 0,
		Msg:  msg,
		Data: data,
	})
}

// Error 错误响应
//
// 返回错误结果
func Error(c *gin.Context, code int, msg string) {
	c.JSON(200, Response{
		Code: code,
		Msg:  msg,
		Data: nil,
	})
}

// ErrorWithData 错误响应（带数据）
//
// 返回错误结果和数据
func ErrorWithData(c *gin.Context, code int, msg string, data interface{}) {
	c.JSON(200, Response{
		Code: code,
		Msg:  msg,
		Data: data,
	})
}

// BadRequest 参数错误响应
//
// 返回 400 参数错误
func BadRequest(c *gin.Context) {
	Error(c, 400, "参数错误")
}

// NotFound 未找到响应
//
// 返回 404 未找到
func NotFound(c *gin.Context, msg string) {
	if msg == "" {
		msg = "资源不存在"
	}
	Error(c, 404, msg)
}

// ServerError 服务器错误响应
//
// 返回 500 服务器错误
func ServerError(c *gin.Context, msg string) {
	if msg == "" {
		msg = "服务器内部错误"
	}
	Error(c, 500, msg)
}

// DBError 数据库错误响应
//
// 返回数据库操作失败错误
func DBError(c *gin.Context, msg string) {
	if msg == "" {
		msg = "数据库操作失败"
	}
	Error(c, 500, msg)
}

// Unauthorized 未授权响应
//
// 返回 401 未授权
func Unauthorized(c *gin.Context, msg string) {
	if msg == "" {
		msg = "未授权访问"
	}
	Error(c, 401, msg)
}

// Forbidden 禁止访问响应
//
// 返回 403 禁止访问
func Forbidden(c *gin.Context, msg string) {
	if msg == "" {
		msg = "禁止访问"
	}
	Error(c, 403, msg)
}
