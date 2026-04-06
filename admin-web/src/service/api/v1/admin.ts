import { request } from '../../request';

export const adminApi = {
  getAdminUsers: (page: number = 1, pageSize: number = 20) =>
    request<{ list: any[]; total: number; page: number; pageSize: number }>({
      url: '/admins',
      method: 'GET',
      params: { page, pageSize }
    }),

  getAdminUser: (id: string) =>
    request<any>({
      url: `/admins/${id}`,
      method: 'GET'
    }),

  createAdminUser: (data: { username: string; password: string; nickname?: string; email?: string; phone?: string; status?: number }) =>
    request<any>({
      url: '/admins',
      method: 'POST',
      data
    }),

  updateAdminUser: (id: string, data: { nickname?: string; email?: string; phone?: string; password?: string; status?: number }) =>
    request<any>({
      url: `/admins/${id}`,
      method: 'PUT',
      data
    }),

  deleteAdminUser: (id: string) =>
    request<{ success: boolean }>({
      url: `/admins/${id}`,
      method: 'DELETE'
    }),

  getAdminUserRoles: (userId: string) =>
    request<{ roles: any[] }>({
      url: `/admins/${userId}/roles`,
      method: 'GET'
    }),

  updateAdminUserRoles: (userId: string, roleIds: string[]) =>
    request<{ success: boolean }>({
      url: `/admins/${userId}/roles`,
      method: 'PUT',
      data: { roleIds }
    }),

  getRoles: () =>
    request<{ list: any[] }>({
      url: '/roles',
      method: 'GET'
    }),

  getRole: (id: string) =>
    request<any>({
      url: `/roles/${id}`,
      method: 'GET'
    }),

  createRole: (data: { name: string; code: string; description?: string; status?: number }) =>
    request<any>({
      url: '/roles',
      method: 'POST',
      data
    }),

  updateRole: (id: string, data: { name?: string; description?: string; status?: number }) =>
    request<any>({
      url: `/roles/${id}`,
      method: 'PUT',
      data
    }),

  deleteRole: (id: string) =>
    request<{ success: boolean }>({
      url: `/roles/${id}`,
      method: 'DELETE'
    }),

  getRolePermissions: (roleId: string) =>
    request<{ permissions: string[] }>({
      url: `/roles/${roleId}/permissions`,
      method: 'GET'
    }),

  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    request<{ success: boolean }>({
      url: `/roles/${roleId}/permissions`,
      method: 'PUT',
      data: { permissionIds }
    }),

  getPermissions: () =>
    request<{ list: any[] }>({
      url: '/permissions',
      method: 'GET'
    }),

  getPermissionTree: () =>
    request<{ tree: any[] }>({
      url: '/permissions/tree',
      method: 'GET'
    }),

  getPermission: (id: string) =>
    request<any>({
      url: `/permissions/${id}`,
      method: 'GET'
    }),

  createPermission: (data: { name: string; code: string; type?: string; parentId?: string }) =>
    request<any>({
      url: '/permissions',
      method: 'POST',
      data
    }),

  updatePermission: (id: string, data: { name?: string }) =>
    request<any>({
      url: `/permissions/${id}`,
      method: 'PUT',
      data
    }),

  deletePermission: (id: string) =>
    request<{ success: boolean }>({
      url: `/permissions/${id}`,
      method: 'DELETE'
    }),

  movePermission: (id: string, targetParentId: string | null) =>
    request<{ success: boolean }>({
      url: `/permissions/${id}/move`,
      method: 'PUT',
      data: { targetParentId }
    }),

  batchUpdateSortOrder: (items: { id: string; sortOrder: number }[]) =>
    request<{ success: boolean }>({
      url: '/permissions/sort',
      method: 'PUT',
      data: { items }
    }),

  getMenus: () =>
    request<{ menus: any[] }>({
      url: '/menus',
      method: 'GET'
    })
};
