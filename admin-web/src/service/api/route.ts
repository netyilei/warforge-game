import { request } from '../request';

export function fetchGetConstantRoutes() {
  return request<Api.Route.MenuRoute[]>({
    url: '/constant-routes',
    method: 'GET'
  });
}

export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({
    url: '/routes',
    method: 'GET'
  });
}

export function fetchIsRouteExist(routeName: string) {
  return request<boolean>({
    url: '/routes/check',
    method: 'GET',
    params: { routeName }
  });
}
