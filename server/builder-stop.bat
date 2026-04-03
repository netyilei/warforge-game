@echo off
echo ========================================
echo 停止编译容器
echo ========================================

docker stop warforge-builder 2>nul
echo 编译容器已停止
