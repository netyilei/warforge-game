import { request } from '../../request';

export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'POST',
    data: {
      username: userName,
      password
    }
  });
}

export function fetchLogout() {
  return request<{ success: boolean }>({
    url: '/auth/logout',
    method: 'POST'
  });
}

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return request<{ success: boolean }>({
    url: '/auth/change-password',
    method: 'PUT',
    data: {
      oldPassword,
      newPassword
    }
  });
}

export function fetchUpdateProfile(data: { nickname?: string; email?: string; phone?: string }) {
  return request<{ success: boolean; nickname: string }>({
    url: '/auth/profile',
    method: 'PUT',
    data
  });
}

export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({
    url: '/auth/user-info',
    method: 'GET'
  });
}

export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refresh-token',
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
