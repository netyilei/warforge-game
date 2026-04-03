import type { ElegantConstRoute } from '@elegant-router/types';
import { nakamaRpc } from './nakama';

export function fetchGetConstantRoutes() {
  const routes: ElegantConstRoute[] = [
    {
      name: 'login',
      path: '/login/:module(pwd-login)?',
      component: 'layout.blank$view.login',
      props: true,
      meta: {
        title: 'login',
        i18nKey: 'route.login',
        constant: true,
        hideInMenu: true
      }
    },
    {
      name: '403',
      path: '/403',
      component: 'layout.blank$view.403',
      meta: {
        title: '403',
        i18nKey: 'route.403',
        constant: true,
        hideInMenu: true
      }
    },
    {
      name: '404',
      path: '/404',
      component: 'layout.blank$view.404',
      meta: {
        title: '404',
        i18nKey: 'route.404',
        constant: true,
        hideInMenu: true
      }
    },
    {
      name: '500',
      path: '/500',
      component: 'layout.blank$view.500',
      meta: {
        title: '500',
        i18nKey: 'route.500',
        constant: true,
        hideInMenu: true
      }
    }
  ];

  return Promise.resolve({
    data: routes,
    error: null
  });
}

export function fetchGetUserRoutes() {
  return nakamaRpc<Api.Route.UserRoute>('admin_get_routes')
    .then(data => ({
      data,
      error: null
    }))
    .catch(error => ({
      data: null,
      error
    }));
}

export function fetchIsRouteExist(routeName: string) {
  return nakamaRpc<boolean>('admin_check_route', { routeName })
    .then(data => ({
      data,
      error: null
    }))
    .catch(() => ({
      data: false,
      error: null
    }));
}
