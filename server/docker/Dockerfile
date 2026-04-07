# ============================================
# WarForge Development Environment
# 基于 nakama-pluginbuilder，预装依赖
# ============================================
FROM heroiclabs/nakama-pluginbuilder:latest

ENV GOPROXY=https://goproxy.cn,direct

RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 预下载 Go 模块依赖
COPY go.mod go.sum ./
RUN go mod download

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/bin/nakama /nakama/nakama
RUN chmod +x /entrypoint.sh /nakama/nakama

EXPOSE 7349 7350 7351 8200

ENTRYPOINT ["/entrypoint.sh"]
