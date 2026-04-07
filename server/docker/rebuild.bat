@echo off
echo ========================================
echo   Rebuild and Restart Services
echo ========================================
echo.

echo [1/4] Compiling Gin...
docker exec warforge-server go build -trimpath -o /app/webadmin ./cmd/webadmin/main.go
if errorlevel 1 (
    echo [ERROR] Gin compilation failed!
    pause
    exit /b 1
)
echo      Gin compiled

echo.
echo [2/4] Compiling Nakama plugin...
docker exec warforge-server go build -buildmode=plugin -trimpath -o /nakama/data/modules/warforge.so ./cmd/nakama/main.go
if errorlevel 1 (
    echo [ERROR] Nakama plugin compilation failed!
    pause
    exit /b 1
)
echo      Nakama plugin compiled

echo.
echo [3/4] Restarting Gin...
docker exec warforge-server supervisorctl restart gin
echo      Gin restarted

echo.
echo [4/4] Restarting Nakama...
docker exec warforge-server supervisorctl restart nakama
echo      Nakama restarted

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
pause
