// Package shared 提供 Nakama 模块共享的工具函数
//
// 本文件提供 JSON 序列化/反序列化工具函数
package shared

import (
	"bytes"
	"encoding/json"
)

// JSONMarshal 将对象序列化为 JSON 字符串
//
// 不转义 HTML 特殊字符，适用于游戏数据传输
func JSONMarshal(v interface{}) (string, error) {
	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "")
	err := encoder.Encode(v)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// JSONUnmarshal 将 JSON 字符串反序列化为对象
func JSONUnmarshal(data string, v interface{}) error {
	return json.Unmarshal([]byte(data), v)
}
