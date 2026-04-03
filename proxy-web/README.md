# Proxy Web - 代理管理后台

WarForge 代理管理控制台，用于管理代理服务器和配置。

## 功能特性

- 代理服务器管理
- 流量监控
- 配置管理
- 用户权限控制

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 配置

编辑 `.env` 文件来配置应用：

```env
VITE_APP_TITLE=WarForge Proxy
VITE_BASE_URL=/
VITE_HTTP_PROXY=Y
```

## 端口

- 开发服务器: `http://localhost:9528`
