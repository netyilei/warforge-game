import { request } from '../request';

export const adminApi = {
  getAdminUsers: (page: number = 1, pageSize: number = 20) =>
    request<{ list: any[]; total: number; page: number; pageSize: number }>({
      url: '/admin',
      method: 'GET',
      params: { page, pageSize }
    }),

  getAdminUser: (id: string) =>
    request<any>({
      url: `/admin/${id}`,
      method: 'GET'
    }),

  createAdminUser: (data: { username: string; password: string; nickname?: string; email?: string; phone?: string; status?: number }) =>
    request<any>({
      url: '/admin',
      method: 'POST',
      data
    }),

  updateAdminUser: (id: string, data: { nickname?: string; email?: string; phone?: string; password?: string; status?: number }) =>
    request<any>({
      url: `/admin/${id}`,
      method: 'PUT',
      data
    }),

  deleteAdminUser: (id: string) =>
    request<{ success: boolean }>({
      url: `/admin/${id}`,
      method: 'DELETE'
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

  getPermissions: () =>
    request<{ list: any[] }>({
      url: '/permissions',
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

  getAdminUserRoles: (userId: string) =>
    request<{ roles: any[] }>({
      url: `/admin/${userId}/roles`,
      method: 'GET'
    }),

  updateAdminUserRoles: (userId: string, roleIds: string[]) =>
    request<{ success: boolean }>({
      url: `/admin/${userId}/roles`,
      method: 'PUT',
      data: { roleIds }
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
    })
};
