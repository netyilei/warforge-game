import { request } from '../request';

export interface OperationLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface OperationLogListParams {
  page?: number;
  pageSize?: number;
  username?: string;
  action?: string;
  targetType?: string;
  startTime?: string;
  endTime?: string;
}

export const operationLogApi = {
  getLogs: (params: OperationLogListParams) =>
    request<{ total: number; list: OperationLog[] }>({
      url: '/operations/logs',
      method: 'GET',
      params
    })
};
