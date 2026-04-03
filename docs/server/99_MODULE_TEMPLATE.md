# 模块文档模板

> 此文件为模块文档模板，新增模块时复制此文件并修改
> 
> 创建日期：YYYY-MM-DD

## 模块概述

简要描述模块的功能和作用。

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `modules/xxx/xxx.go` | 模块主文件 |

---

## 功能列表

| 功能 | 说明 |
|------|------|
| 功能1 | 说明 |
| 功能2 | 说明 |

---

## RPC 函数

### rpc_name

功能说明。

**请求**：
```json
{
  "param1": "value1"
}
```

**响应**：
```json
{
  "data": "result"
}
```

---

## 核心类型

```go
type SomeType struct {
    Field1 string `json:"field1"`
    Field2 int    `json:"field2"`
}
```

---

## 工具函数

### functionName

功能说明。

```go
func functionName(param Type) ReturnType {
    // 实现
}
```

---

## 与其他模块交互

说明与其他模块的交互方式。

---

## 配置项

```yaml
module:
  option1: value1
  option2: value2
```

---

## 注意事项

- 注意事项1
- 注意事项2

---

## 后续计划

- [ ] 待实现功能1
- [ ] 待实现功能2
