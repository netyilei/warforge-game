import { request } from '../request';

export function fetchGetSettings() {
  return request<{ settings: any[] }>({
    url: '/settings',
    method: 'GET'
  });
}

export function fetchUpdateSettings(settings: any[]) {
  return request<{ success: boolean }>({
    url: '/settings',
    method: 'PUT',
    data: { settings }
  });
}
