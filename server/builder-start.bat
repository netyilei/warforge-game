@echo off
echo ========================================
echo 启动 Go 编译容器
echo ========================================

docker inspect warforge-builder >nul 2>&1
if %errorlevel% equ 0 (
    echo 容器已存在，检查运行状态...
    docker ps --filter "name=warforge-builder" --filter "status=running" | findstr warforge-builder >nul
    if %errorlevel% equ 0 (
        echo 容器已在运行中
    ) else (
        echo 启动已存在的容器...
        docker start warforge-builder
    )
) else (
    echo 创建新的编译容器...
    docker run -d --name warforge-builder --entrypoint sh -v "%cd%":/app -w /app heroiclabs/nakama-pluginbuilder:latest -c "sleep infinity"
)

echo.
echo ========================================
echo 编译容器已就绪
echo 使用 build.bat 进行编译
echo 使用 builder-shell.bat 进入容器
echo ========================================
