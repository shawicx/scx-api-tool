/**
 * @description 客户端主模块 负责与不同类型的 API 服务器通信
 */
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
import { fetchApifoxData } from './apifox';
import { fetchSwaggerData } from './swagger';
import consola from 'consola';

export async function fetchData(config: ApiConfig): Promise<any> {
  if (process.env.DEBUG) {
    consola.debug('Fetching data with config:', config);
  }

  switch (config.serverType) {
    case ServerType.Apifox:
      return fetchApifoxData(config);
    case ServerType.Swagger:
      return fetchSwaggerData(config);
    default:
      throw new Error(`不支持的服务器类型: ${config.serverType}`);
  }
}
