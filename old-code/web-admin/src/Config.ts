// API配置
export const Config = {
    // 登录API地址
    loginUrl: 'http://43.254.167.52:11001/pp-login',

    // 管理API地址
    adminUrl: 'http://43.254.167.52:11001/pp-admin',

    // WebSocket地址
    wsUrl: 'ws://43.254.167.52:11001/pp-chat-1',

    // 其他配置
    timeout: 30000,
    retryTimes: 3
}

// 本地存储键名
export const StorageKeys = {
    TOKEN: 'admin_token',
    USER_INFO: 'admin_user_info',
    LOGIN_DATA: 'admin_login_data'
}

// API响应状态码
export const ResponseCode = {
    SUCCESS: 0,
    TOKEN_EXPIRED: 1001,
    PERMISSION_DENIED: 1002,
    INVALID_PARAMS: 1003
}
