@echo off
echo ========================================
echo 编译 Nakama Go 插件
echo ========================================

echo 检查编译容器状态...
docker ps --filter "name=warforge-builder" --filter "status=running" | findstr warforge-builder >nul
if %errorlevel% neq 0 (
    echo 编译容器未运行，正在启动...
    call builder-start.bat
)

echo.
echo [1/3] 更新依赖...
docker exec warforge-builder go mod tidy

if %errorlevel% neq 0 (
    echo 依赖更新失败!
    exit /b 1
)

echo.
echo [2/3] 编译插件...
docker exec warforge-builder go build -buildmode=plugin -trimpath -o warforge.so ./cmd/main.go

if %errorlevel% neq 0 (
    echo 编译失败!
    exit /b 1
)

echo.
echo [3/3] 部署到 Nakama 容器...
docker cp warforge.so warforge-nakama:/nakama/data/modules/warforge.so

if %errorlevel% neq 0 (
    echo 复制失败! 请确保 Nakama 容器正在运行
    exit /b 1
)

echo.
echo [4/4] 重启 Nakama...
docker restart warforge-nakama

echo.
echo ========================================
echo 编译完成!
echo ========================================
