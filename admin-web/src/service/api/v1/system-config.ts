import { request } from '../../request';

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigListResponse {
  configs: SystemConfig[];
}

export const systemConfigApi = {
  getConfigs: () =>
    request<SystemConfigListResponse>({
      url: '/system-configs',
      method: 'GET'
    }),

  getConfig: (key: string) =>
    request<SystemConfig>({
      url: `/system-configs/${key}`,
      method: 'GET'
    }),

  createConfig: (data: Partial<SystemConfig>) =>
    request<SystemConfig>({
      url: '/system-configs',
      method: 'POST',
      data
    }),

  updateConfig: (key: string, data: Partial<SystemConfig>) =>
    request<void>({
      url: `/system-configs/${key}`,
      method: 'PUT',
      data
    }),

  deleteConfig: (key: string) =>
    request<{ success: boolean }>({
      url: `/system-configs/${key}`,
      method: 'DELETE'
    })
};
