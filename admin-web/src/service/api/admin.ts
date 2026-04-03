import { nakamaRpc } from './nakama';

export const adminApi = {
  getAdminUsers: () => nakamaRpc<any>('admin_get_users', {}),
  getRoles: () => nakamaRpc<any>('admin_get_roles', {}),
  getPermissions: () => nakamaRpc<any>('admin_get_permissions', {}),
  getAdminUserRoles: (userId: string) => nakamaRpc<string[]>('admin_get_user_roles', { userId }),
  updateAdminUserRoles: (userId: string, roleIds: string[]) => nakamaRpc<any>('admin_update_user_roles', { userId, roleIds }),
  createAdminUser: (data: any) => nakamaRpc<any>('admin_create_user', data),
  updateAdminUser: (data: any) => nakamaRpc<any>('admin_update_user', data),
  deleteAdminUser: (id: string) => nakamaRpc<any>('admin_delete_user', { id }),
};
