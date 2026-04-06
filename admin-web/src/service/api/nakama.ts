import axios from 'axios';
import { localStg } from '@/utils/storage';

const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST || 'http://localhost:8202';
const NAKAMA_PROXY_PATH = '/nakama-api';

interface NakamaRpcResponse {
  payload?: string;
  error?: string;
}

interface RpcErrorResponse {
  error?: string;
}

export const nakamaRpc = async <T>(rpcId: string, payload?: Record<string, unknown>): Promise<T> => {
  const baseURL = import.meta.env.DEV ? NAKAMA_PROXY_PATH : NAKAMA_HOST;

  // 双重编码：payload 必须是 JSON 字符串
  const jsonPayload = JSON.stringify(JSON.stringify(payload || {}));

  // 获取 token（如果已登录）
  const token = localStg.get('token');

  // eslint-disable-next-line no-console
  console.log(`[nakamaRpc] rpcId: ${rpcId}, token: ${token ? `${token.substring(0, 20)}...` : 'null'}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios<NakamaRpcResponse>({
    url: `/v2/rpc/${rpcId}`,
    method: 'POST',
    baseURL,
    data: jsonPayload,
    headers
  });

  // 解析 payload 字段
  if (response.data.error) {
    throw new Error(response.data.error);
  }

  if (response.data.payload) {
    const result = JSON.parse(response.data.payload) as T & RpcErrorResponse;

    // 检查业务错误（如 {"error":"Invalid password"}）
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  }

  return {} as T;
};
