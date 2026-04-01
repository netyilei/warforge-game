# 工程解析文档：cpp-servers (a-servers)

## 1. 项目概览

**项目名称**: `a-servers` (尽管目录名为 `cpp-servers`，实际为 Node.js/TypeScript 项目)
**核心功能**: 提供基于微服务架构的游戏服务器后端支持，涵盖账户管理、登录、支付、聊天、俱乐部、以及具体的游戏逻辑（如德州扑克）。
**技术栈**:
*   **语言**: TypeScript (主要源码), JavaScript (构建产物)
*   **运行时**: Node.js
*   **进程管理**: PM2
*   **核心框架**: `kdweb-core` (私有依赖，提供底层服务、日志、工具库)
*   **通信协议**: HTTP (REST/RPC), WebSocket (实时通信)
*   **存储**: MongoDB (推测，基于 `DBDefine`), Redis (推测，用于缓存/锁)

## 2. 目录结构

*   `build/`: TypeScript 编译后的 JavaScript 产物，生产环境运行使用。
*   `configs/`: 环境配置和启动脚本。
    *   `test/`: 测试环境配置，包含 `server_list.json` (服务注册表) 和各服务的 PM2 配置文件。
*   `pp-*`: 各个微服务模块的源码。
    *   `pp-account`: 账户与物品配置。
    *   `pp-login`: 用户登录、注册、快速登录。
    *   `pp-game-texas`: 德州扑克游戏逻辑服务器。
    *   `pp-room`: 房间管理服务。
    *   `pp-rpc-center`: RPC 中心服务，可能用于服务发现或路由。
    *   `pp-sys`: 系统级服务（邮件、KV存储、ID生成等）。
    *   `pp-base-define`: **关键目录**，包含所有服务共享的数据结构定义、错误码、RPC 接口定义。
*   `src/`: 通用工具库和辅助代码，被各服务引用。
*   `package.json`: 项目依赖和脚本定义。
*   `_build.bat`: Windows 下的构建脚本。

## 3. 服务架构与通信

### 3.1 服务注册与发现
在 `configs/test/server_list.json` 中定义了所有服务的网络拓扑，包括：
*   `wsHost`/`wsPort`: WebSocket 地址，用于长连接。
*   `serviceHost`/`servicePort`: HTTP 服务地址，用于 RPC 或 REST API。

### 3.2 典型服务结构 (以 `pp-login` 为例)
*   `start.ts`: 服务入口，负责初始化日志、加载配置、启动服务实例。
*   `config.ts`: 负责加载本地配置 (LocalConfig)。
*   `rpc/`: 定义该服务对外提供的 RPC 接口实现。
*   `service/` 或 `logic/`: 具体的业务逻辑实现。
*   `log.ts`: 日志配置。

### 3.3 游戏服务结构 (以 `pp-game-texas` 为例)
*   基于 `pp-game-base` 框架构建。
*   继承 `knYieldRoomBase` 实现具体的房间逻辑 (`TexasRoom`)。
*   使用 `TexasRealtime` 管理游戏内的实时状态流转。
*   通过 `handleInit`, `changePhase` 等钩子函数控制游戏生命周期。

## 4. 开发与构建

### 4.1 构建
运行 `_build.bat` 或使用 `tsc` (TypeScript Compiler) 将 `pp-*` 和 `src` 目录下的 `.ts` 文件编译到 `build/` 目录。

### 4.2 启动
使用 PM2 管理进程。例如启动登录服务：
```bash
pm2 start configs/test/pm2.login.config.js
```
`package.json` 中定义的 `npm start` 脚本指向 `build/a-servers/src/start.js`，但这可能是一个聚合启动脚本或特定服务的启动脚本。

## 5. 关键依赖
*   `kdweb-core`: 核心框架，封装了 `baseService`, `kdlog`, `kdutils` 等基础功能。
*   `ali-oss`: 阿里云 OSS SDK。
*   `web3` / `ethers`: 区块链交互库，说明项目包含链上功能（如 `pp-chain`）。

## 6. 后续开发指引
*   **新增服务**: 参照 `pp-login` 结构创建新的 `pp-[service-name]` 目录，并在 `configs/test/server_list.json` 中注册。
*   **修改协议**: 在 `pp-base-define` 中修改或添加数据定义，并确保相关服务重新编译。
*   **调试**: 可以在 `configs/test/local-config.*.js` 中调整本地配置，日志文件通常输出在 `logs-[service-name]/` 目录下。

## 7. RPC 架构解析

本项目的 RPC 机制基于私有库 `kdweb-core` 的 `knRpc` 模块实现，支持跨服务的远程调用和消息分发。

### 7.1 核心组件
*   **RPC Center (`pp-rpc-center`)**: 服务注册与发现中心。所有服务启动时会连接到此中心注册自身信息。
*   **RPC Manager**: 服务端和客户端的 RPC 管理器，负责连接维护、请求路由。
*   **RPC Tools (`src/knRpcTools.ts`)**: 封装了常用的 RPC 初始化、配置获取等操作。

### 7.2 服务注册与发现流程
1.  **物理配置**: `configs/test/server_list.json` 定义了所有服务的物理地址（HTTP 和 WebSocket 端口）。
2.  **服务注册**: 服务启动时（见 `start.ts`），调用 `knRpcTools.initRpc()`，连接到 `s-rpc-center` 并注册自己的服务名和地址。
3.  **服务发现**:
    *   客户端（或其他微服务）通过 `knRpcTools.getConfig(serviceName)` 向 Center 查询目标服务的实时地址。
    *   支持模糊查询 (`getConfigBlur`)，用于发现一组服务（如所有的 `game-server`）。

### 7.3 RPC 方法定义与调用
RPC 接口采用“定义-实现-注册”的模式：

1.  **定义**: 在 `pp-base-define/*RpcMethods.ts` 中定义方法名常量（通常是带层级的前缀字符串）。
    *   例如 `pp-base-define/SrsRpcMethods.ts`:
        ```typescript
        export namespace Layer {
            export const prefix = "kds.srs-node.layer"
            export const login = prefix + ".login" // "kds.srs-node.layer.login"
        }
        ```

2.  **服务端实现**:
    *   编写具体的业务函数（如 `RpcSrsLayer` 对象）。
    *   在 `rpc.ts` 中通过 `methodGroup.addGroup` 注册实现：
        ```typescript
        // 请求方法名前缀匹配 "kds.srs-node.layer" 时，分发给 RpcSrsLayer 处理
        layer.methodGroup.addGroup(SrsRpcMethods.Layer.prefix, RpcSrsLayer)
        ```
    *   **Delegate 模式**: 也可以设置 `rpc.delegate`，如 `pp-login` 使用 `LoginRpcEntity` 处理请求。

3.  **客户端调用**:
    *   通过 `rpc.center.call(methodName, ...args)` 发起远程调用。
    *   支持 `callException` (抛出异常) 等变体。
    *   `src/MutexTools.ts` 展示了如何封装 RPC 调用来实现分布式锁。

### 7.4 消息路由机制 (SrsMessageLink)
项目实现了一套基于 Redis 的动态消息路由机制，用于处理复杂的消息分发（如将特定的用户消息路由到正确的游戏服务器）：
*   **注册**: 服务通过 `regLink` 将消息名映射到 RPC 方法名，存储在 Redis 中。
*   **投递**: 发送方调用 `ifCall`，先从 Redis 查询消息对应的 RPC 方法，然后动态发起调用。

### 7.5 机器人服务 RPC 与 IPC 架构 (`pp-robot-logic`)

机器人服务采用独特的“Master-Worker”双层架构，结合 RPC 和 IPC 实现高并发控制。

#### 7.5.1 双通道 RPC
`pp-robot-logic/rpc.ts` 初始化了两个 RPC 管理器：
1.  **Internal (`robotInternal`)**: 用于内部控制（如创建机器人），服务名前缀 `kds.robot-logic.in`。
2.  **GameServer (`robotGS`)**: 用于与游戏服务器通信，服务名前缀 `kds.robot-logic.gs`。

#### 7.5.2 Master-Worker 消息流转
由于机器人逻辑运行在子进程（Worker）中，而 RPC 端口监听在主进程（Master），因此需要通过 IPC 转发消息：

1.  **入站 (GS -> Robot)**:
    *   GameServer 调用 RPC 接口 `logic_gsSendMessage`。
    *   Master 进程收到 RPC 请求，由 `RpcRobotGS.sendMessage` 处理。
    *   Master 通过 `RobotLogicProcessControl_Master.sendMessageFromGameServer` 查找对应的 Worker。
    *   Master 发送 IPC 消息 `ToWorker_FromGameServer` 给 Worker。
    *   Worker 收到 IPC 消息，通过 `RobotStrategy.handleMessage` 分发给具体机器人逻辑。

2.  **出站 (Robot -> GS)**:
    *   Worker 中的机器人逻辑需要发送消息。
    *   Worker 发送 IPC 消息 `ToMaster_SendToGameServer` 给 Master。
    *   Master 收到 IPC 消息，通过 `Rpc.robotGS.callServer` 发起真正的 RPC 调用到 GameServer。

#### 7.5.3 关键文件
*   `pp-robot-logic/rpc.ts`: RPC 入口，初始化 Master/Worker 环境。
*   `pp-base-define/RobotRpcMethods.ts`: 定义 RPC 方法名常量。
*   `pp-robot-logic/entity/RobotLogicProcessControl_Master.ts`: Master 进程逻辑，负责 Worker 管理和 IPC 路由。
*   `pp-robot-logic/entity/RobotLogicProcessControl_Worker.ts`: Worker 进程逻辑，负责具体的机器人策略执行。
