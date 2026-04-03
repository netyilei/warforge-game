@echo off
echo ========================================
echo 编译并部署 Nakama Go 插件
echo ========================================

echo [1/4] 更新依赖...
docker run --rm -v "%cd%":/app -w /app heroiclabs/nakama-pluginbuilder:latest mod tidy

if %errorlevel% neq 0 (
    echo 依赖更新失败!
    exit /b 1
)

echo [2/4] 编译 Go 插件...
docker run --rm -v "%cd%":/app -w /app heroiclabs/nakama-pluginbuilder:latest build -buildmode=plugin -trimpath -o warforge.so ./cmd/main.go

if %errorlevel% neq 0 (
    echo 编译失败!
    exit /b 1
)

echo [3/4] 复制插件到容器...
docker cp warforge.so warforge-nakama:/nakama/data/modules/warforge.so

if %errorlevel% neq 0 (
    echo 复制失败!
    exit /b 1
)

echo [4/4] 重启 Nakama...
docker restart warforge-nakama

echo ========================================
echo 完成!
echo ========================================
