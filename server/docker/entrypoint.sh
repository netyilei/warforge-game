#!/bin/bash
set -e

mkdir -p /var/log/supervisor
mkdir -p /nakama/data/modules

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compiling Gin..."
cd /app
go build -trimpath -o /app/webadmin ./cmd/webadmin/main.go
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gin compiled"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compiling Nakama plugin..."
go build -buildmode=plugin -trimpath -o /nakama/data/modules/warforge.so ./cmd/nakama/main.go
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Nakama plugin compiled"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
