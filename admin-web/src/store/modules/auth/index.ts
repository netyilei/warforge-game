import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchChangePassword, fetchGetUserInfo, fetchLogin, fetchLogout } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref('');

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    userName: '',
    roles: [],
    menus: [],
    buttons: []
  });

  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  const isLogin = computed(() => Boolean(token.value));

  async function resetStore() {
    recordUserId();

    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  function recordUserId() {
    if (!userInfo.userId) {
      return;
    }

    localStg.set('lastLoginUserId', userInfo.userId);
  }

  function checkTabClear(): boolean {
    if (!userInfo.userId) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    if (!lastLoginUserId || lastLoginUserId !== userInfo.userId) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    const { data: loginToken, error } = await fetchLogin(userName, password);

    if (!error) {
      const pass = await loginByToken(loginToken);

      if (pass) {
        const isClear = checkTabClear();
        let needRedirect = redirect;

        if (isClear) {
          needRedirect = false;
        }
        await redirectFromLogin(needRedirect);

        window.$notification?.success({
          title: '登录成功',
          content: `欢迎回来，${userInfo.userName}！`,
          duration: 4500
        });
      } else {
        // 获取用户信息失败
        window.$notification?.error({
          title: '登录失败',
          content: '获取用户信息失败，请稍后重试',
          duration: 4500
        });
        resetStore();
      }
    } else {
      // 登录失败，显示错误信息
      const errorMessage = error.message || '用户名或密码错误';
      window.$notification?.error({
        title: '登录失败',
        content: errorMessage,
        duration: 4500
      });
      resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken | null) {
    if (!loginToken) {
      return false;
    }

    localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);

    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken.token;

      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const maybeToken = getToken();

    if (maybeToken) {
      token.value = maybeToken;
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  async function logout() {
    await fetchLogout();

    await resetStore();

    window.$notification?.success({
      title: '退出成功',
      content: '您已安全退出系统',
      duration: 3000
    });
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    const { data, error } = await fetchChangePassword(oldPassword, newPassword);

    if (!error && data?.success) {
      window.$notification?.success({
        title: '修改成功',
        content: '密码修改成功，请重新登录',
        duration: 3000
      });

      return true;
    }

    return false;
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo,
    logout,
    changePassword
  };
});
