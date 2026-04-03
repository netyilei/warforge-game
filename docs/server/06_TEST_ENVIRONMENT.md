# 测试环境配置

> WarForge Server 开发/测试环境配置
> 
> 创建日期：2026-04-03

## 环境概览

| 组件 | 容器名 | 版本 | 端口 |
|------|--------|------|------|
| Nakama | warforge-nakama | 3.33.0 | 7349, 7350, 7351 |
| CockroachDB | dev_cockroach | v23.2.5 | 26257, 8765 |
| Redis | dev_redis | latest | 6379 |
| **编译容器** | warforge-builder | nakama-pluginbuilder | - |

---

## 持久化编译容器

为避免每次编译都创建/删除容器，使用持久化编译容器：

### 容器信息

| 配置项 | 值 |
|--------|-----|
| 容器名 | warforge-builder |
| 镜像 | heroiclabs/nakama-pluginbuilder:latest |
| 挂载 | d:\geme\server → /app |
| 状态 | 持久运行 |

### 管理脚本

| 脚本 | 用途 |
|------|------|
| `builder-start.bat` | 启动编译容器 |
| `builder-stop.bat` | 停止编译容器 |
| `builder-shell.bat` | 进入容器 Shell |
| `build.bat` | 编译并部署插件 |

### 使用方法

```bash
# 首次启动（或容器不存在时）
cd d:\geme\server
builder-start.bat

# 编译并部署
build.bat

# 进入容器执行其他命令
builder-shell.bat
# 例如: go get -u gorm.io/gorm

# 停止容器（节省资源）
builder-stop.bat
```

### 手动命令

```bash
# 创建容器
docker run -d --name warforge-builder --entrypoint sh \
  -v "d:\geme\server":/app -w /app \
  heroiclabs/nakama-pluginbuilder:latest -c "sleep infinity"

# 编译
docker exec warforge-builder go build -buildmode=plugin -trimpath -o warforge.so ./cmd/main.go

# 部署
docker cp warforge.so warforge-nakama:/nakama/data/modules/warforge.so
docker restart warforge-nakama
```

---

## Docker 网络

```
Network: warforge-network
```

所有容器连接到同一网络，通过容器名互相访问。

---

## 容器详情

### Nakama (游戏服务器)

| 配置项 | 值 |
|--------|-----|
| 容器名 | warforge-nakama |
| 镜像 | warforge-nakama (本地构建) |
| Go 版本 | 1.26.1 |
| nakama-common | v1.45.0 |

**端口映射:**

| 宿主机端口 | 容器端口 | 用途 |
|------------|----------|------|
| 7349 | 7349 | gRPC API |
| 7350 | 7350 | HTTP API / WebSocket |
| 7351 | 7351 | 管理控制台 |

**启动参数:**

```bash
--database.address root@dev_cockroach:26257/nakama
--runtime.path /nakama/data/modules/
--socket.server_key dev_server_key_2026
--session.encryption_key dev_session_key_2026
--runtime.http_key dev_http_key_2026
--console.username admin
--console.password admin123
```

**常用命令:**

```bash
# 查看日志
docker logs -f warforge-nakama

# 重启服务
docker restart warforge-nakama

# 进入容器
docker exec -it warforge-nakama sh
```

---

### CockroachDB (数据库)

| 配置项 | 值 |
|--------|-----|
| 容器名 | dev_cockroach |
| 镜像 | cockroachdb/cockroach:v23.2.5 |
| 模式 | 单节点 (开发模式) |
| 安全 | --insecure (无认证) |

**端口映射:**

| 宿主机端口 | 容器端口 | 用途 |
|------------|----------|------|
| 26257 | 26257 | SQL 连接 |
| 8765 | 8080 | Admin UI |

**连接字符串:**

```
# 从 Nakama 容器内连接
root@dev_cockroach:26257/nakama

# 从宿主机连接
cockroach sql --insecure --host=localhost:26257
```

**常用命令:**

```bash
# 进入 SQL shell
docker exec -it dev_cockroach cockroach sql --insecure

# 查看数据库
docker exec -it dev_cockroach cockroach sql --insecure -e "SHOW DATABASES;"

# Admin UI
# 浏览器访问: http://localhost:8765
```

---

### Redis (缓存)

| 配置项 | 值 |
|--------|-----|
| 容器名 | dev_redis |
| 镜像 | redis:latest |
| 端口 | 6379 |

**注意:** Redis 容器需要手动连接到 warforge-network:

```bash
docker network connect warforge-network dev_redis
```

---

## 快速启动

### 方式一: 使用脚本

```bash
cd d:\geme\server\docker
setup.bat
```

### 方式二: 手动启动

```bash
# 1. 创建网络
docker network create warforge-network

# 2. 启动 CockroachDB
docker run -d --name dev_cockroach --network warforge-network \
  -p 26257:26257 -p 8765:8080 \
  -v cockroach-data:/cockroach/cockroach-data \
  cockroachdb/cockroach:v23.2.5 start-single-node --insecure

# 3. 连接 Redis
docker network connect warforge-network dev_redis

# 4. 创建数据库
docker exec dev_cockroach cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS nakama;"

# 5. 运行迁移
docker run --rm --network warforge-network heroiclabs/nakama:latest \
  migrate up --database.address "root@dev_cockroach:26257/nakama"

# 6. 构建并启动 Nakama
cd d:\geme\server
docker build -t warforge-nakama -f docker/Dockerfile .
docker run -d --name warforge-nakama --network warforge-network \
  -p 7349:7349 -p 7350:7350 -p 7351:7351 \
  -e TZ=Asia/Shanghai warforge-nakama
```

---

## 验证环境

### 1. 检查容器状态

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 2. 检查 Nakama 日志

```bash
docker logs warforge-nakama 2>&1 | grep -E "Startup done|error|fatal"
```

### 3. 访问控制台

浏览器打开: <http://localhost:7351>

- 用户名: `admin`
- 密码: `admin123`

### 4. 测试 API

```bash
# 健康检查
curl http://localhost:7350/

# 创建用户
curl -X POST "http://localhost:7350/v2/account/authenticate/device?create=true" \
  --user "dev_server_key_2026:" \
  -H "Content-Type: application/json" \
  -d '{"id": "test-device-id"}'
```

---

## 常见问题

### Q: 插件加载失败 "plugin was built with a different version"

**原因:** Go 插件必须与 Nakama 二进制使用完全相同的 Go 版本编译。

**解决:** 使用官方 `nakama-pluginbuilder` 镜像构建插件。

### Q: 数据库连接失败 "lookup dev_cockroach: no such host"

**原因:** 容器不在同一 Docker 网络。

**解决:**

```bash
docker network connect warforge-network dev_cockroach
docker restart warforge-nakama
```

### Q: 如何重置数据库

```bash
docker stop dev_cockroach warforge-nakama
docker rm dev_cockroach warforge-nakama
docker volume rm cockroach-data

# 重新运行 setup.bat
```

---

## 版本兼容性

| Nakama | Go | nakama-common |
|--------|-----|---------------|
| 3.33.0 | 1.26.1 | v1.45.0 |

**重要:** 版本必须严格匹配，否则插件无法加载。

---

## 安全警告

测试环境使用以下不安全配置，**生产环境必须修改**:

- CockroachDB: `--insecure` (无认证)
- Console: 默认密码 `admin/admin123`
- Server Key: `dev_server_key_2026`
- Session Key: `dev_session_key_2026`
- HTTP Key: `dev_http_key_2026`

---

## 生产环境安全配置

### 安全检查清单

| 检查项 | 状态 |
|--------|------|
| ☐ CockroachDB Admin UI (8765) 已关闭或仅内网访问 | |
| ☐ CockroachDB 已启用证书认证（非 --insecure） | |
| ☐ Redis 端口 (6379) 不对外暴露 | |
| ☐ Nakama Console (7351) 已关闭或使用强密码 | |
| ☐ Nakama 所有默认密钥已修改 | |
| ☐ Console 密码强度 >= 16 位 | |
| ☐ 数据库管理后台已关闭外部访问 | |
| ☐ 防火墙仅开放必要端口 (7350, 7349) | |

### 禁止事项

| 禁止项 | 原因 |
|--------|------|
| ❌ 使用 `--insecure` 启动 CockroachDB | 无认证，任何人可访问数据 |
| ❌ 暴露数据库端口到公网 | 数据泄露风险 |
| ❌ 使用默认密码 `admin/admin123` | 极易被破解 |
| ❌ 使用默认密钥 `dev_server_key_2026` | 可伪造请求 |
