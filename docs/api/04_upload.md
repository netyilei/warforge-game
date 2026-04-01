# 上传模块 API

## 22. upload/start - 开始上传

**请求**

```
POST /upload/start
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 否 | 强制使用中间路径 |
| filename | string | 否 | 强制使用文件名（不带扩展名） |
| ext | string | 是 | 扩展名，带点如 .png |
| totalSize | number | 是 | 文件总大小（字节） |

**处理逻辑**

1. 验证文件大小（1-15MB）
2. 生成文件名：user-media/u{userID}_{timestamp}{ext}
3. 调用OSS服务开始上传

**响应**

```json
{
  "code": 0,
  "filename": "user-media/u10001_1234567890.png"
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 无效的文件大小 / 启动失败 |

---

## 23. upload/upload - 上传数据块

**请求**

```
POST /upload/upload
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名（由 upload/start 返回） |
| base64Data | string | 是 | Base64编码的数据块 |

**处理逻辑**

1. 验证数据是否为空
2. 检查数据大小是否匹配
3. 调用OSS服务上传数据块

**响应**

```json
{
  "code": 0
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 无效的上传数据 / 上传数据不正确 / 上传失败 |

---

## 24. upload/end - 结束上传

**请求**

```
POST /upload/end
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 文件名（由 upload/start 返回） |

**处理逻辑**

1. 调用OSS服务完成上传
2. 返回文件URL

**响应**

```json
{
  "code": 0,
  "url": "http://xxx/user-media/u10001_1234567890.png"
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 上传失败 |
