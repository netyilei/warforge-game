import { nakamaRpc } from './nakama';

export function fetchLogin(userName: string, password: string) {
  return nakamaRpc<Api.Auth.LoginToken>('admin_login', {
    username: userName,
    password
  }).then(data => ({
    data,
    error: null
  })).catch(error => ({
    data: null,
    error
  }));
}

export function fetchLogout() {
  return nakamaRpc<{ success: boolean }>('admin_logout')
    .then(data => ({
      data,
      error: null
    }))
    .catch(error => ({
      data: null,
      error
    }));
}

export function fetchChangePassword(oldPassword: string, newPassword: string) {
  return nakamaRpc<{ success: boolean }>('admin_change_password', {
    oldPassword,
    newPassword
  }).then(data => ({
    data,
    error: null
  })).catch(error => ({
    data: null,
    error
  }));
}

export function fetchGetUserInfo() {
  return nakamaRpc<Api.Auth.UserInfo>('admin_get_user_info')
    .then(data => ({
      data,
      error: null
    }))
    .catch(error => ({
      data: null,
      error
    }));
}

export function fetchRefreshToken(refreshToken: string) {
  return nakamaRpc<Api.Auth.LoginToken>('admin_refresh_token', {
    refreshToken
  }).then(data => ({
    data,
    error: null
  })).catch(error => ({
    data: null,
    error
  }));
}

export function fetchCustomBackendError(code: string, msg: string) {
  return Promise.resolve({
    data: null,
    error: { code, msg }
  });
}
