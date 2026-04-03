# ============================================
# Stage 1: Build plugin with official pluginbuilder
# ============================================
FROM heroiclabs/nakama-pluginbuilder:latest AS builder

ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app

COPY go.mod ./
RUN go mod download github.com/heroiclabs/nakama-common

COPY . .

RUN go mod tidy && go build -buildmode=plugin -trimpath -o /nakama/data/modules/warforge.so ./cmd/main.go

# ============================================
# Stage 2: Run Nakama with plugin
# ============================================
FROM heroiclabs/nakama:latest

COPY --from=builder /nakama/data/modules/warforge.so /nakama/data/modules/

EXPOSE 7349 7350 7351

ENTRYPOINT ["/nakama/nakama"]
CMD ["--database.address", "root@dev_cockroach:26257/nakama", "--runtime.path", "/nakama/data/modules/", "--socket.server_key", "dev_server_key_2026", "--session.encryption_key", "dev_session_key_2026", "--runtime.http_key", "dev_http_key_2026", "--console.username", "admin", "--console.password", "admin123"]
