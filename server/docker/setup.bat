@echo off
echo ========================================
echo   WarForge Game Server - Setup
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/8] Creating Docker network...
docker network create warforge-network 2>nul
echo      Network ready

echo.
echo [2/8] Starting CockroachDB...
docker ps -a --format "{{.Names}}" | findstr /x "dev_cockroach" >nul
if errorlevel 1 (
    echo      Creating new CockroachDB container...
    docker run -d ^
      --name dev_cockroach ^
      --network warforge-network ^
      -p 26257:26257 ^
      -p 8765:8080 ^
      -v cockroach-data:/cockroach/cockroach-data ^
      cockroachdb/cockroach:v23.2.5 start-single-node --insecure
) else (
    echo      CockroachDB already exists, starting...
    docker start dev_cockroach 2>nul
)

echo.
echo [3/8] Connecting Redis to network...
docker network connect warforge-network dev_redis 2>nul
echo      Redis connected

echo.
echo [4/8] Waiting for CockroachDB to be ready...
timeout /t 5 /nobreak >nul
echo      Database ready

echo.
echo [5/8] Creating database and running migration...
docker exec dev_cockroach cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS nakama;" 2>nul
docker run --rm --network warforge-network heroiclabs/nakama:latest migrate up --database.address "root@dev_cockroach:26257/nakama"
echo      Migration done

echo.
echo [6/8] Building Nakama with Go module...
docker stop warforge-nakama 2>nul
docker rm warforge-nakama 2>nul
docker build -t warforge-nakama -f docker/Dockerfile .
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [7/8] Starting Nakama server...
docker run -d ^
  --name warforge-nakama ^
  --network warforge-network ^
  -p 8204:7349 ^
  -p 8202:7350 ^
  -p 8205:7351 ^
  -e TZ=Asia/Shanghai ^
  warforge-nakama

echo.
echo [8/8] Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo   Services:
echo     HTTP API:    http://localhost:8202
echo     WebSocket:   ws://localhost:8205
echo     gRPC:        localhost:8204
echo     Console:     http://localhost:8205
echo     CockroachDB: http://localhost:8765
echo.
echo   Console Login:
echo     Username: admin
echo     Password: admin123
echo.
echo   Commands:
echo     View logs: docker logs -f warforge-nakama
echo     Stop:      docker stop warforge-nakama
echo     Restart:   docker restart warforge-nakama
echo.
pause
