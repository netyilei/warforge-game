# 单机服务器部署指南

## 服务器信息

- **内网IP**: 10.0.0.10
- **HTTP API 域名**: api.wforge.net
- **WebSocket 域名**: s1.wforge.net
- **Docker网络**: app-network

## 一、环境准备

### 1.1 系统要求

- Rocky Linux 9 或兼容系统
- Docker 和 Docker Compose 已安装
- Node.js 20.x (通过 Docker 容器运行)

### 1.2 目录结构

```
/data/
├── cpp-servers/          # 服务端代码
├── ppupload/             # 上传文件存储
├── mongo/                # MongoDB 数据
└── redis/                # Redis 数据
```

## 二、Docker 网络创建

### 2.1 创建内部网络

```bash
docker network create app-network
```

**说明**: `app-network` 是 Docker 内部网络，所有容器通过此网络互相通信，无需暴露端口到外网。

**验证网络创建成功**:

```bash
docker network ls | grep app-network
```

## 三、数据库容器创建

**安全说明**: 数据库仅绑定内网 IP 和本地回环地址，不对外暴露端口。业务服务通过 Docker 内部网络通信，Navicat 通过 SSH 隧道连接。

### 3.1 MongoDB 容器

```bash
docker run -d \
  --name mongodb \
  --network app-network \
  --restart always \
  -p 10.0.0.10:27017:27017 \
  -p 127.0.0.1:27018:27017 \
  -v /data/mongo:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD='ygb2$6Q@cmSKNfE2' \
  mongo:4.2.24
```

**Navicat 连接方式**：

- SSH 隧道主机填写 `127.0.0.1`，端口 `27018`
- 或 SSH 隧道主机填写 `10.0.0.10`，端口 `27017`

### 3.2 Redis 容器

```bash
docker run -d \
  --name redis \
  --network app-network \
  --restart always \
  -p 10.0.0.10:6379:6379 \
  -p 127.0.0.1:6380:6379 \
  -v /data/redis:/data \
  redis:6.2.10 \
  redis-server --requirepass 'Ut3rcplFX*wLBSxy'
```

**Navicat 连接方式**：

- SSH 隧道主机填写 `127.0.0.1`，端口 `6380`
- 或 SSH 隧道主机填写 `10.0.0.10`，端口 `6379`

## 四、服务端部署

### 4.1 上传代码

将 `cpp-servers` 目录上传到 `/data/cpp-servers/`

### 4.2 复制配置文件

将 `deploy_single/configs` 目录下的所有文件覆盖到 `/data/cpp-servers/configs/`

```bash
cp -r configs/* /data/cpp-servers/configs/
```

### 4.3 创建 Node.js 服务容器

**安全说明**: 服务容器不映射任何端口到外网，所有外部访问通过 Nginx 反向代理。

```bash
docker run -d \
  --name cpp-server \
  --network app-network \
  --restart always \
  -v /data/cpp-servers:/app \
  -v /data/ppupload:/data/ppupload \
  -w /app \
  node:20 \
  tail -f /dev/null
```

### 4.4 进入容器执行所有操作

**说明**: 宿主机不安装 Python 和 PM2，所有操作在容器内完成。

```bash
docker exec -it cpp-server bash
```

进入容器后执行：

```bash
# 安装 Python
apt-get update && apt-get install -y python3
ln -s /usr/bin/python3 /usr/bin/python

# 安装 PM2
npm install -g pm2

# 进入配置目录
cd /app/configs

# 生成 PM2 配置
python gen_pm2.py single single/gen_pm2_config_single.json
```

### 4.5 启动服务（按顺序）

**重要**: 服务必须按顺序启动，否则数据库初始化可能失败。

```bash
# 第一步：启动 RPC 中心（必须先启动）
python start.py rpc

# 等待 RPC 中心完全启动（约 10 秒）
sleep 10

# 第二步：启动核心服务（pp-sys, pp-login 等）
pm2 restart pp-sys
sleep 5
pm2 restart pp-login
sleep 5

# 第三步：启动所有服务
python start.py all

# 第四步：等待所有服务启动完成（约 30 秒）
sleep 30

# 查看服务状态
pm2 list
```

### 4.6 初始化数据库数据

**重要**: 服务启动后，需要初始化机器人相关数据。

```bash
# 进入配置目录
cd /app/configs/single

# 第一步：导入机器人名字池（从 names.json 导入到 t_robot_name_info 表）
node ../../build/src/exec_importRobotNameInfo.js

# 第二步：创建机器人用户（创建 100 个机器人用户到 t_login_data 表）
node ../../build/src/exec_addSimpleRobots.js
```

**机器人相关脚本说明：**

| 脚本 | 作用 | 数据表 |
|------|------|--------|
| `exec_importRobotNameInfo.js` | 导入机器人名字池 | `t_robot_name_info` |
| `exec_addSimpleRobots.js` | 创建机器人用户 | `t_login_data`, `t_robot_runtime` |

**注意**: `names.json` 文件需要放在执行目录下（`/app/configs/single`）。

### 4.7 机器人分组配置

**重要**: 机器人需要与分组计划匹配才能正常工作。

```javascript
// 在 MongoDB 中检查机器人分组
use cpp-root
db["pp:t_robot_runtime"].aggregate([{$group: {_id: "$targetGroupID", count: {$sum: 1}}}])

// 检查分组计划
db["pp:t_robot_ext_group_plan"].find({enabled: true})
```

**常见问题：机器人无法加入房间**

如果日志显示 `pick robot to room = xxx valid = []`，说明机器人分组与房间分组不匹配。

**解决方案：**

```javascript
// 更新机器人分组（假设分组计划 groupID 为 1001）
db["pp:t_robot_runtime"].updateMany({}, {$set: {targetGroupID: 1001}})

// 重置机器人状态为 Ready
db["pp:t_robot_runtime"].updateMany({}, {$set: {status: 0, restTimestamp: null, restDate: null}})
```

### 4.8 验证数据库初始化

**验证数据库表和索引是否创建成功：**

```bash
# 进入 MongoDB 容器
docker exec -it mongodb mongo -u admin -p 'ygb2$6Q@cmSKNfE2'

# 切换到业务数据库
use cpp-root

# 查看所有集合（表）
show collections

# 预期输出应包含以下表：
# t_login_data
# t_login_channel
# t_login_role
# t_relation
# t_user_bag
# t_user_search
# t_robot_name_info
# ... 等等

# 查看管理员账号是否创建
db.t_login_channel.find({type: "account"})

# 预期输出应包含 admin, admin1, admin2, admin3 账号

# 退出 MongoDB
exit
```

**验证 Redis 连接：**

```bash
# 进入 Redis 容器
docker exec -it redis redis-cli -a 'Ut3rcplFX*wLBSxy'

# 测试连接
PING

# 预期输出：PONG

# 退出 Redis
exit
```

### 4.9 验证服务运行状态

```bash
# 查看所有服务状态
pm2 list

# 预期输出：所有服务状态为 "online"

# 查看特定服务日志
pm2 logs pp-login --lines 50

# 检查是否有错误日志
pm2 logs --err --lines 20
```

## 五、默认管理员账号

服务启动后会自动创建以下管理员账号（配置在 `local-config.login.js`）：

| 账号 | 密码 (MD5) | 原始密码 |
|------|------------|----------|
| admin | e10adc3949ba59abbe56e057f20f883e | 123456 |
| admin1 | e10adc3949ba59abbe56e057f20f883e | 123456 |
| admin2 | e10adc3949ba59abbe56e057f20f883e | 123456 |
| admin3 | e10adc3949ba59abbe56e057f20f883e | 123456 |

**安全建议**: 部署后立即修改默认密码！

## 六、Nginx 配置

**安全说明**: Nginx 是唯一对外暴露端口(80/443)的容器，所有服务通过反向代理访问。

### 6.1 创建 Nginx 容器

```bash
docker run -d \
  --name nginx \
  --network app-network \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  -v /data/nginx/conf.d:/etc/nginx/conf.d \
  -v /data/nginx/ssl:/etc/nginx/ssl \
  -v /data/nginx/logs:/var/log/nginx \
  -v /data/ppupload:/data/ppupload \
  nginx:latest
```

### 6.2 配置文件

将 `nginx_single.conf` 复制到 `/data/nginx/conf.d/default.conf`

### 6.3 自动化脚本配置

#### 6.3.1 SSL 证书自动续期脚本

Let's Encrypt 证书有效期为 90 天，需配置自动续期。

```bash
sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/ssl-renew.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$DATE] $1" >> "$LOG_FILE"
}

log "========== SSL 证书续期检查开始 =========="

# 检查证书是否即将过期（30天内）
EXPIRY_DAYS=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 | grep -oP '\d+(?= days)')
if [ -n "$EXPIRY_DAYS" ] && [ "$EXPIRY_DAYS" -gt 30 ]; then
    log "证书还有 $EXPIRY_DAYS 天过期，无需续期"
    exit 0
fi

# 停止 Nginx 以便 standalone 模式验证
log "停止 Nginx 容器..."
docker stop nginx >> "$LOG_FILE" 2>&1

# 执行续期
log "执行证书续期..."
certbot renew --quiet >> "$LOG_FILE" 2>&1
RENEW_RESULT=$?

# 启动 Nginx
log "启动 Nginx 容器..."
docker start nginx >> "$LOG_FILE" 2>&1

if [ $RENEW_RESULT -eq 0 ]; then
    log "证书续期成功，复制证书到 Nginx 目录..."
    
    # 复制 api.wforge.net 证书
    cp /etc/letsencrypt/live/api.wforge.net/fullchain.pem /data/nginx/ssl/api.wforge.net.crt
    cp /etc/letsencrypt/live/api.wforge.net/privkey.pem /data/nginx/ssl/api.wforge.net.key
    chmod 644 /data/nginx/ssl/api.wforge.net.crt
    chmod 600 /data/nginx/ssl/api.wforge.net.key
    log "api.wforge.net 证书已更新"
    
    # 复制 s1.wforge.net 证书
    cp /etc/letsencrypt/live/s1.wforge.net/fullchain.pem /data/nginx/ssl/s1.wforge.net.crt
    cp /etc/letsencrypt/live/s1.wforge.net/privkey.pem /data/nginx/ssl/s1.wforge.net.key
    chmod 644 /data/nginx/ssl/s1.wforge.net.crt
    chmod 600 /data/nginx/ssl/s1.wforge.net.key
    log "s1.wforge.net 证书已更新"
    
    # 复制 up.wforge.net 证书
    cp /etc/letsencrypt/live/up.wforge.net/fullchain.pem /data/nginx/ssl/up.wforge.net.crt
    cp /etc/letsencrypt/live/up.wforge.net/privkey.pem /data/nginx/ssl/up.wforge.net.key
    chmod 644 /data/nginx/ssl/up.wforge.net.crt
    chmod 600 /data/nginx/ssl/up.wforge.net.key
    log "up.wforge.net 证书已更新"
    
    # 重载 Nginx 配置
    sleep 2
    docker exec nginx nginx -s reload >> "$LOG_FILE" 2>&1
    log "证书已更新，Nginx 已重载"
else
    log "错误：证书续期失败，请检查日志"
fi

log "========== SSL 证书续期检查结束 =========="
EOF

sudo chmod +x /usr/local/bin/renew-ssl.sh
```

#### 6.3.2 Cloudflare IP 白名单自动更新脚本

如果使用 Cloudflare 代理，需要配置 IP 白名单以获取真实客户端 IP。

```bash
sudo tee /usr/local/bin/update-cloudflare-ips.sh > /dev/null << 'EOF'
#!/bin/bash

CF_DIR="/data/nginx/conf.d"
CF_CONF="$CF_DIR/nginx_cloudflare_ips.inc"

mkdir -p "$CF_DIR"

echo "# Cloudflare IP 白名单 - 更新于 $(date)" > $CF_CONF
curl -s https://www.cloudflare.com/ips-v4 | while read ip; do
    echo "set_real_ip_from $ip;" >> $CF_CONF
done
curl -s https://www.cloudflare.com/ips-v6 | while read ip; do
    echo "set_real_ip_from $ip;" >> $CF_CONF
done
echo "real_ip_header CF-Connecting-IP;" >> $CF_CONF

docker exec nginx nginx -s reload

echo "Cloudflare IP 白名单已更新"
EOF

sudo chmod +x /usr/local/bin/update-cloudflare-ips.sh
```

#### 6.3.3 执行脚本并配置定时任务

```bash
# 执行一次 IP 白名单更新（立即生效）
sudo /usr/local/bin/update-cloudflare-ips.sh

# 配置定时任务
sudo tee /etc/cron.d/server-maintenance > /dev/null << 'EOF'
# 每周一凌晨 3 点检查并续期 SSL 证书
0 3 * * 1 root /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1

# 每月 1 号凌晨 4 点更新 Cloudflare IP 白名单
0 4 1 * * root /usr/local/bin/update-cloudflare-ips.sh >> /var/log/cloudflare-ips.log 2>&1
EOF
```

#### 6.3.4 验证配置

```bash
# 验证 IP 白名单配置
cat /data/nginx/conf.d/nginx_cloudflare_ips.inc

# 手动测试 SSL 续期（不实际执行）
sudo certbot renew --dry-run

# 查看日志
sudo tail -f /var/log/ssl-renew.log
sudo tail -f /var/log/cloudflare-ips.log
```

### 6.4 SSL 证书首次申请

使用 **Certbot + Let's Encrypt** 自动申请免费 SSL 证书并配置自动续期。

#### 6.4.1 安装 Certbot

```bash
# 启用 EPEL 仓库
sudo dnf install -y epel-release

# 安装 Certbot
sudo dnf install -y certbot python3-certbot-nginx
```

**如果 EPEL 不可用，使用 pip 安装：**

```bash
sudo dnf install -y python3-pip
sudo pip3 install certbot certbot-nginx
sudo ln -s /usr/local/bin/certbot /usr/bin/certbot
```

#### 6.4.2 申请证书

**方式一：临时停止 Nginx 申请（推荐首次申请）**

```bash
# 停止 Nginx 容器
docker stop nginx

# 申请 api.wforge.net 证书（HTTP API 服务）
sudo certbot certonly --standalone \
  -d api.wforge.net \
  --email vumaithuy40@gmail.com \
  --agree-tos \
  --no-eff-email

# 申请 s1.wforge.net 证书（WebSocket 服务）
sudo certbot certonly --standalone \
  -d s1.wforge.net \
  --email vumaithuy40@gmail.com \
  --agree-tos \
  --no-eff-email

# 申请 up.wforge.net 证书（上传文件服务）
sudo certbot certonly --standalone \
  -d up.wforge.net \
  --email vumaithuy40@gmail.com \
  --agree-tos \
  --no-eff-email

# 启动 Nginx 容器
docker start nginx
```

**方式二：通过 Nginx 申请（需 Nginx 已运行）**

```bash
sudo certbot certonly --nginx \
  -d s1.wforge.net \
  --email vumaithuy40@gmail.com \
  --agree-tos \
  --no-eff-email

sudo certbot certonly --nginx \
  -d api.wforge.net \
  --email vumaithuy40@gmail.com \
  --agree-tos \
  --no-eff-email
```

#### 6.4.3 复制证书到 Nginx 目录

```bash
# 创建 SSL 目录
sudo mkdir -p /data/nginx/ssl

# 复制证书（替换域名）
sudo cp /etc/letsencrypt/live/api.wforge.net/fullchain.pem /data/nginx/ssl/api.wforge.net.crt
sudo cp /etc/letsencrypt/live/api.wforge.net/privkey.pem /data/nginx/ssl/api.wforge.net.key
sudo cp /etc/letsencrypt/live/s1.wforge.net/fullchain.pem /data/nginx/ssl/s1.wforge.net.crt
sudo cp /etc/letsencrypt/live/s1.wforge.net/privkey.pem /data/nginx/ssl/s1.wforge.net.key
sudo cp /etc/letsencrypt/live/up.wforge.net/fullchain.pem /data/nginx/ssl/up.wforge.net.crt
sudo cp /etc/letsencrypt/live/up.wforge.net/privkey.pem /data/nginx/ssl/up.wforge.net.key
# 设置权限
sudo chmod 644 /data/nginx/ssl/api.wforge.net.crt
sudo chmod 600 /data/nginx/ssl/api.wforge.net.key
sudo chmod 644 /data/nginx/ssl/s1.wforge.net.crt
sudo chmod 600 /data/nginx/ssl/s1.wforge.net.key
sudo chmod 644 /data/nginx/ssl/up.wforge.net.crt
sudo chmod 600 /data/nginx/ssl/up.wforge.net.key
```

## 七、网络架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                      外网访问                                │
│    api.wforge.net:80/443    s1.wforge.net:80/443           │
│       (HTTP API + SSL)        (WebSocket + SSL)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx 容器                                │
│              (唯一对外暴露端口)                              │
│                   反向代理                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ Docker app-network
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  cpp-server 容器                             │
│    pp-login, pp-user-service, pp-srs-node, etc.            │
│              (不对外暴露端口)                                │
└─────────────────────────┬───────────────────────────────────┘
                          │ Docker app-network
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           mongodb 容器    │    redis 容器                    │
│          (不对外暴露端口)  │   (不对外暴露端口)               │
└─────────────────────────────────────────────────────────────┘
```

## 八、服务端口清单

### 8.1 对外服务（通过 Nginx 代理）

**HTTP API 服务（api.wforge.net:80/443）**

| 服务 | 容器端口 | Nginx路径 |
|------|----------|-----------|
| pp-login | 31012 | /pp-login/ |
| pp-admin | 33112 | /pp-admin/ |
| pp-admin-leader-proxy | 33112 | /pp-admin-leader-proxy/ |
| pp-user-service-1~4 | 32112~32142 | /pp-service-1~4/ |
| pp-chat-service-1~2 | 38112~38122 | /pp-chat-1~2/ |
| pp-chain | 37202 | /pp-chain-callback/ |

**WebSocket 服务（s1.wforge.net:80/443）**

| 服务 | 容器端口 | Nginx路径 |
|------|----------|-----------|
| pp-srs-node-user-1~4 | 36113~36143 | /pp-srs-user-1~4 |
| pp-chat-service-1~2 | 38113~38123 | /pp-ws-chat-1~2 |

### 8.2 内部服务（仅 Docker 网络内部访问）

| 服务 | WS端口 | HTTP端口 |
|------|--------|----------|
| pp-rpc-center | 30001 | 30002 |
| pp-sys | 30901 | 30902 |
| pp-rpc-gm | 31003 | 31004 |
| pp-rpc-gm-leader-proxy | 31005 | 31006 |
| pp-account | 31021 | 31022 |
| pp-oss-control | 31023 | 31024 |
| pp-group | 31031 | 31032 |
| pp-user-looper | 31051 | 31052 |
| pp-match-logic-1 | 33011 | 33012 |
| pp-srs-dispatcher | 35201 | 35202 |
| pp-srs-layer-1 | 36011 | 36012 |
| pp-room | 37001 | 37002 |
| pp-mail | 37101 | 37102 |
| pp-game-texas-1~2 | 30011~30021 | 30012~30022 |
| pp-robotenv-center | 31001 | 31002 |
| pp-robot-env-1 | 32011 | 32012 |
| pp-robot-logic-1 | 32211 | 32212 |

## 九、常用命令

### 9.1 服务管理

```bash
# 查看服务状态
pm2 list

# 重启单个服务
pm2 restart pp-login

# 重启所有服务
pm2 restart all

# 查看日志
pm2 logs pp-login

# 停止所有服务
python stop.py all
```

### 9.2 日志清理

```bash
# 清理所有日志（服务停止后）
python clear_logs.py
```

## 十、前端部署（独立VPS）

前端 H5 游戏和管理后台部署在独立的 VPS 上，通过以下域名连接本服务器的 API 和 WebSocket 服务。

### 10.1 域名分工

| 域名 | 用途 | 说明 |
|-----|------|------|
| `api.wforge.net` | HTTP API | 登录、业务、管理接口 |
| `s1.wforge.net` | WebSocket | 游戏 WS、聊天 WS |
| `up.wforge.net` | 上传文件 | 图片、媒体文件 CDN |

### 10.2 前端配置要点

- H5 游戏 HTTP API 地址：`https://api.wforge.net`
- H5 游戏 WebSocket 地址：`wss://s1.wforge.net`
- Admin 后台 HTTP API 地址：`https://api.wforge.net`
- Admin 后台 WebSocket 地址：`wss://s1.wforge.net`
- Proxy 后台 HTTP API 地址：`https://api.wforge.net`
- Proxy 后台 WebSocket 地址：`wss://s1.wforge.net`

### 10.3 Nginx 配置（专用服务器）

专用服务器的 Nginx 配置见 `nginx_single.conf`，包含：

- `api.wforge.net`：HTTP API 反向代理（端口 80）
- `s1.wforge.net`：WebSocket 反向代理（端口 443，SSL）

## 十一、配置文件说明

| 文件 | 说明 |
|------|------|
| `env.json` | 环境标识，声明 tag 和 server |
| `single/a-config.js` | 主配置文件，包含数据库连接、RPC地址等 |
| `single/gen_pm2_config_single.json` | PM2 配置生成模板 |
| `single/local-config.*.js` | 各服务的本地配置 |

## 十二、协议配置规范

### 12.1 内部通信 vs 外部通信

| 通信类型 | HTTP协议 | WebSocket协议 | 示例 |
|---------|---------|--------------|------|
| 内部服务间通信 | `http://` | `ws://` | `http://127.0.0.1:36013`、`ws://127.0.0.1:31003` |
| 外部用户访问 | `https://` | `wss://` | `https://api.wforge.net/pp-login`、`wss://s1.wforge.net/pp-srs-user-1` |

### 12.2 配置项说明

| 配置项 | 用途 | 协议 |
|--------|------|------|
| `wsHost` / `serviceHost` | 内部RPC通信 | `ws://` / `http://` |
| `httpHost` / `nodeWSHost` | pp-srs-layer内部通信 | `http://` / `ws://` |
| `internalHost` | pp-chat-service内部通信 | `http://` |
| `robotHost` / `gsHost` | 机器人服务内部通信 | `ws://` |
| `userHost` / `userServiceHost` | 外部HTTP API访问 | `https://` |
| `userWSHost` | 外部WebSocket访问 | `wss://` |
| `callbackHost` | 外部支付回调 | `https://` |

### 12.3 域名分工

| 域名 | 用途 | 协议 |
|------|------|------|
| `api.wforge.net` | HTTP API 服务 | `https://` |
| `s1.wforge.net` | WebSocket 服务 | `wss://` |
| `up.wforge.net` | 上传文件服务 | `https://` |

### 12.4 常见错误

**错误示例：**

```json
{
    "httpHost": "https://127.0.0.1:36013",     // 错误：内部通信用了 https
    "nodeWSHost": "wss://127.0.0.1:36014",     // 错误：内部通信用了 wss
    "userHost": "https://s1.wforge.net/pp-xxx" // 错误：HTTP API 应该用 api.wforge.net
}
```

**正确示例：**

```json
{
    "httpHost": "http://127.0.0.1:36013",          // 正确：内部通信用 http
    "nodeWSHost": "ws://127.0.0.1:36014",          // 正确：内部通信用 ws
    "userHost": "https://api.wforge.net/pp-xxx",   // 正确：HTTP API 用 api.wforge.net
    "userWSHost": "wss://s1.wforge.net/pp-ws-xxx"  // 正确：WebSocket 用 s1.wforge.net
}
```

## 十三、安全检查清单

- [ ] Docker 内部网络 `app-network` 已创建
- [ ] MongoDB 仅绑定内网 IP (10.0.0.10:27017) 和本地 (127.0.0.1:27018)
- [ ] Redis 仅绑定内网 IP (10.0.0.10:6379) 和本地 (127.0.0.1:6380)
- [ ] cpp-server 容器未映射端口到外网
- [ ] 仅 Nginx 容器映射 80/443 端口
- [ ] SSL 证书已正确配置
- [ ] 数据库密码已修改（非默认密码）
