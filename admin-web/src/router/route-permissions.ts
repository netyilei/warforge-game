import type { RouteKey } from '@elegant-router/types';

const routePermissions: Record<RouteKey, string[]> = {
  root: [],
  'not-found': [],
  home: ['home'],
  '403': [],
  '404': [],
  '500': [],
  'iframe-page': [],
  login: [],
  admin: ['admin'],
  admin_list: ['admin', 'admin_list'],
  admin_permission: ['admin', 'admin_permission'],
  admin_role: ['admin', 'admin_role'],
  content: ['content'],
  content_banner: ['content', 'content_banner'],
  content_category: ['content', 'content_category'],
  content_list: ['content', 'content_list'],
  operations: ['operations'],
  operations_log: ['operations', 'operations_log'],
  settings: ['settings'],
  settings_email: ['settings', 'settings_email'],
  settings_language: ['settings', 'settings_language'],
  settings_user: ['settings', 'settings_user'],
  storage: ['storage'],
  storage_config: ['storage', 'storage_config'],
  storage_records: ['storage', 'storage_records'],
  support: ['support'],
  'support_send-email': ['support', 'support_send_email'],
  user: ['user'],
  user_approval: ['user', 'user_approval'],
  user_manage: ['user', 'user_manage']
};

export function getRoutePermissions(routeName: RouteKey): string[] {
  return routePermissions[routeName] || [];
}

export function hasRoutePermission(routeName: RouteKey, userMenus: string[]): boolean {
  const required = routePermissions[routeName];
  if (!required || required.length === 0) {
    return true;
  }
  return required.every(p => userMenus.includes(p));
}

export default routePermissions;
