import { CustomerDefine, CustomerMsgDefine } from 'pp-base-define/CustomerDefine'

export type ChatWebSocketEvent = 
    | { type: 'connected' }
    | { type: 'disconnected' }
    | { type: 'error'; error: Error }
    | { type: 'login'; success: boolean; errCode?: number; errMsg?: string }
    | { type: 'chat'; chat: CustomerDefine.tChat }
    | { type: 'roomChanged'; data: CustomerMsgDefine.tRoomChangedNT }
    | { type: 'error'; code: number; msg: string }

export class ChatWebSocket {
    private ws: WebSocket | null = null
    private reconnectTimer: number | null = null
    private heartbeatTimer: number | null = null
    private heartbeatTimeoutTimer: number | null = null
    private lastHeartbeatTime: number = 0
    private isManualClose = false
    private listeners: Map<string, Set<(data: any) => void>> = new Map()
    private wsUrl: string = ''
    private readonly HEARTBEAT_INTERVAL = 10000 // 10秒发送一次心跳
    private readonly HEARTBEAT_TIMEOUT = 30000 // 30秒无响应则认为超时

    constructor(wsUrl?: string) {
        if (wsUrl) {
            this.wsUrl = wsUrl
        }
    }

    // 设置 WebSocket URL
    setWsUrl(url: string) {
        this.wsUrl = url
    }

    // 连接 WebSocket
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve()
                return
            }

            if (!this.wsUrl) {
                reject(new Error('WebSocket URL is not set'))
                return
            }

            try {
                this.ws = new WebSocket(this.wsUrl)
                this.isManualClose = false

                this.ws.onopen = () => {
                    console.log('WebSocket connected')
                    this.emit('connected', {})
                    this.startHeartbeat()
                    resolve()
                }

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        // 收到任何消息都更新最后消息时间并重置心跳超时计时器
                        this.lastHeartbeatTime = Date.now()
                        this.resetHeartbeatTimeout()
                        this.handleMessage(data)
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error)
                    }
                }

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    this.emit('error', { error: new Error('WebSocket connection error') })
                    reject(error)
                }

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected')
                    this.stopHeartbeat()
                    this.emit('disconnected', {})
                    // 不进行自动重连，只连接一次
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    // 断开连接
    disconnect() {
        this.isManualClose = true
        this.stopHeartbeat()
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    // 发送消息
    private send(msgName: string, data: any): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected')
            return false
        }

        try {
            const message = {
                m: msgName,
                d: JSON.stringify(data),
            }
            this.ws.send(JSON.stringify(message))
            return true
        } catch (error) {
            console.error('Failed to send WebSocket message:', error)
            return false
        }
    }

    // 处理接收到的消息
    private handleMessage(data: any) {
        // 兼容两种格式：
        // 1. { m: string, d: any } - 新格式
        // 2. { msgName: string, data: any } - 旧格式
        let msgName: string | undefined
        let rawData: any = null

        if (data.m) {
            // 新格式
            msgName = data.m
            rawData = data.d
        } else if (data.msgName) {
            // 旧格式
            msgName = data.msgName
            rawData = data.data
        }

        if (!msgName) {
            console.warn('Unknown message format:', data)
            return
        }

        // 解析数据（可能是 JSON 字符串或对象）
        let msgData: any = null
        try {
            if (typeof rawData === 'string') {
                // 如果是字符串，尝试解析为 JSON
                if (rawData.trim() === '' || rawData === '{}') {
                    msgData = {}
                } else {
                    msgData = JSON.parse(rawData)
                }
            } else {
                msgData = rawData || {}
            }
        } catch (error) {
            console.error('Failed to parse message data:', error, 'rawData:', rawData)
            return
        }

        switch (msgName) {
            case CustomerMsgDefine.Login:
            case CustomerMsgDefine.LoginConsole:
                this.emit('login', {
                    success: msgData.success,
                    errCode: msgData.errCode,
                    errMsg: msgData.errMsg,
                })
                break

            case CustomerMsgDefine.Chat:
                if (msgData.chat) {
                    this.emit('chat', { chat: msgData.chat })
                }
                break

            case CustomerMsgDefine.RoomChanged:
                this.emit('roomChanged', {
                    roomID: msgData.roomID,
                    roomIDs: msgData.roomIDs,
                    fromUserID: msgData.fromUserID,
                })
                break

            case CustomerMsgDefine.SimpleHeart:
            case CustomerMsgDefine.Heart:
                // 心跳响应，更新最后心跳时间
                this.lastHeartbeatTime = Date.now()
                console.log('Heartbeat response received')
                break

            default:
                console.warn('Unknown message type:', msgName)
        }
    }

    // 登录
    login(ak: string): boolean {
        return this.send(CustomerMsgDefine.LoginConsole, { ak })
    }

    // 发送聊天消息
    sendChat(roomID: number, content: string, type: CustomerDefine.ChatType, data?: any): boolean {
        return this.send(CustomerMsgDefine.SendChat, {
            roomID,
            content,
            type,
            data,
        })
    }

    // 发送心跳
    sendHeartbeat(): boolean {
        if (!this.isConnected()) {
            return false
        }
        const success = this.send(CustomerMsgDefine.SimpleHeart, {})
        if (success) {
            this.lastHeartbeatTime = Date.now()
            console.log('Heartbeat sent')
        }
        return success
    }

    // 开始心跳
    private startHeartbeat() {
        this.stopHeartbeat()
        this.lastHeartbeatTime = Date.now()
        
        // 定时发送心跳
        this.heartbeatTimer = window.setInterval(() => {
            if (this.isConnected()) {
                this.sendHeartbeat()
            } else {
                this.stopHeartbeat()
            }
        }, this.HEARTBEAT_INTERVAL)
        
        // 启动心跳超时检测
        this.resetHeartbeatTimeout()
    }

    // 重置心跳超时计时器
    private resetHeartbeatTimeout() {
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer)
            this.heartbeatTimeoutTimer = null
        }
        
        // 如果连接已断开，不启动超时检测
        if (!this.isConnected()) {
            return
        }
        
        // 设置超时检测：如果超过指定时间没有收到任何消息，认为连接可能已断开
        this.heartbeatTimeoutTimer = window.setTimeout(() => {
            const now = Date.now()
            const timeSinceLastMessage = now - this.lastHeartbeatTime
            
            // 如果超过超时时间没有收到任何消息，记录警告
            if (timeSinceLastMessage > this.HEARTBEAT_TIMEOUT) {
                console.warn('Heartbeat timeout, no message received for', timeSinceLastMessage, 'ms')
                // 不自动重连，只记录警告（根据需求可以改为自动重连）
                // this.reconnect()
            }
        }, this.HEARTBEAT_TIMEOUT)
    }

    // 停止心跳
    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer)
            this.heartbeatTimeoutTimer = null
        }
        this.lastHeartbeatTime = 0
    }

    // 事件监听
    on(event: 'connected' | 'disconnected' | 'error' | 'login' | 'chat' | 'roomChanged', callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)
    }

    // 移除事件监听
    off(event: 'connected' | 'disconnected' | 'error' | 'login' | 'chat' | 'roomChanged', callback: (data: any) => void) {
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            callbacks.delete(callback)
        }
    }

    // 触发事件
    private emit(event: 'connected' | 'disconnected' | 'error' | 'login' | 'chat' | 'roomChanged', data: any) {
        const callbacks = this.listeners.get(event)
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error('Error in event callback:', error)
                }
            })
        }
    }

    // 检查连接状态
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }
}
