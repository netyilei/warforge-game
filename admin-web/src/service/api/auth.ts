import { request } from '../request';

export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/login',
    method: 'POST',
    data: {
      username: userName,
      password
    }
  });
}

export function fetchLogout() {
  return request<{ success: boolean }>({
    url: '/logout',
    method: 'POST'
  });
}

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request<{ success: boolean }>({
    url: '/change-password',
    method: 'POST',
    data: {
      oldPassword,
      newPassword
    }
  });
}

export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({
    url: '/userinfo',
    method: 'GET'
  });
}

export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/refresh-token',
    method: 'POST',
    data: {
      refreshToken
    }
  });
}

export function fetchCustomBackendError(code: string, msg: string) {
  return Promise.resolve({
    data: null,
    error: { code, msg }
  });
}
