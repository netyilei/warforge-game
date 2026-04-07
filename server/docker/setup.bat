@echo off
echo ========================================
echo   WarForge Game Server - Dev Setup
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/4] Creating Docker network...
docker network create warforge-network 2>nul
echo      Network ready

echo.
echo [2/4] Connecting existing containers to network...
docker network connect warforge-network dev_cockroach 2>nul
docker network connect warforge-network dev_redis 2>nul
echo      Containers connected

echo.
echo [3/4] Building WarForge dev image...
docker rm -f warforge-server 2>nul
docker build -t warforge-server -f docker/Dockerfile .
echo      Image built

echo.
echo [4/4] Starting WarForge server...
docker run -d ^
  --name warforge-server ^
  --network warforge-network ^
  -p 7349:7349 ^
  -p 7350:7350 ^
  -p 7351:7351 ^
  -p 8200:8200 ^
  -v %cd%:/app ^
  -e TZ=Asia/Shanghai ^
  warforge-server

echo.
echo Waiting for services to start...
timeout /t 20 /nobreak >nul

echo.
echo Running Nakama database migration...
docker exec warforge-server /nakama/nakama migrate up --database.address "root@dev_cockroach:26257/nakama"
echo      Migration done

echo.
echo Restarting Nakama service...
docker exec warforge-server pkill nakama 2>nul
timeout /t 2 /nobreak >nul
docker exec warforge-server bash -c "/nakama/nakama --database.address=root@dev_cockroach:26257/nakama --runtime.path=/nakama/data/modules/ --socket.server_key=dev_server_key_2026 --session.encryption_key=dev_session_key_2026 --runtime.http_key=dev_http_key_2026 --console.username=admin --console.password=admin123 &" 2>nul

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo   Services:
echo     Gin WebAdmin: http://localhost:8200
echo     Nakama HTTP:  http://localhost:7350
echo     Nakama gRPC:  localhost:7349
echo     Nakama Console: http://localhost:7351
echo.
echo   Console Login:
echo     Username: admin
echo     Password: admin123
echo.
echo   Development Commands:
echo     Recompile: docker\rebuild.bat
echo     View logs: docker logs -f warforge-server
echo.
pause
