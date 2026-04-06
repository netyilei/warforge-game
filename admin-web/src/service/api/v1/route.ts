import { request } from '../../request';

export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({
    url: '/auth/routes',
    method: 'GET'
  });
}

export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({
    url: '/auth/routes/check',
    method: 'GET',
    params: { routeName }
  });
}
