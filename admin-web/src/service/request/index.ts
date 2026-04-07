import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { getServiceBaseURL } from '@/utils/service';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

const createRequestConfig = (version: string) => ({
  baseURL: `${baseURL}/${version}`,
  headers: {
    apifoxToken: 'XL299LiMEDZ0H5h3A29PxwQXdMJqWyY2'
  }
});

const createRequestOptions = (state: { errMsgStack: string[]; refreshTokenPromise: Promise<boolean> | null }) => ({
  defaultState: state as RequestInstanceState,
  transform(response: AxiosResponse<App.Service.Response<any>>) {
    return response.data.data;
  },
  async onRequest(config: any) {
    const Authorization = getAuthorization();
    Object.assign(config.headers, { Authorization });
    return config;
  },
  isBackendSuccess(response: AxiosResponse<App.Service.Response<any>>) {
    return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
  },
  async onBackendFail(response: AxiosResponse<App.Service.Response<any>>, instance: any) {
    const authStore = useAuthStore();
    const responseCode = String(response.data.code);

    const handleLogout = () => authStore.resetStore();

    const logoutAndCleanup = () => {
      handleLogout();
      window.removeEventListener('beforeunload', handleLogout);
      state.errMsgStack = state.errMsgStack.filter(msg => msg !== response.data.msg);
    };

    const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
    if (logoutCodes.includes(responseCode)) {
      handleLogout();
      return null;
    }

    const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
    if (modalLogoutCodes.includes(responseCode) && !state.errMsgStack?.includes(response.data.msg)) {
      state.errMsgStack = [...(state.errMsgStack || []), response.data.msg];
      window.addEventListener('beforeunload', handleLogout);
      window.$dialog?.error({
        title: '错误',
        content: response.data.msg,
        positiveText: '确认',
        maskClosable: false,
        closeOnEsc: false,
        onPositiveClick: logoutAndCleanup,
        onClose: logoutAndCleanup
      });
      return null;
    }

    const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
    if (expiredTokenCodes.includes(responseCode)) {
      const success = await handleExpiredRequest(state);
      if (success) {
        const Authorization = getAuthorization();
        Object.assign(response.config.headers, { Authorization });
        return instance.request(response.config) as Promise<AxiosResponse>;
      }
    }

    return null;
  },
  onError(error: any) {
    let message = error.message;
    let backendErrorCode = '';

    if (error.code === BACKEND_ERROR_CODE) {
      message = error.response?.data?.msg || message;
      backendErrorCode = String(error.response?.data?.code || '');
    }

    const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
    if (modalLogoutCodes.includes(backendErrorCode)) return;

    const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
    if (expiredTokenCodes.includes(backendErrorCode)) return;

    showErrorMsg(state, message);
  }
});

const v1State = { errMsgStack: [] as string[], refreshTokenPromise: null as Promise<boolean> | null };
const v2State = { errMsgStack: [] as string[], refreshTokenPromise: null as Promise<boolean> | null };

export const request = createFlatRequest(
  createRequestConfig('v1'),
  createRequestOptions(v1State)
);

export const requestV2 = createFlatRequest(
  createRequestConfig('v2'),
  createRequestOptions(v2State)
);
