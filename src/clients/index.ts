/**
 * 客户端工厂
 * 根据配置选择合适的 API 客户端
 */

import type { ApiConfig, ServerType } from '@/types';
import { fetchApifoxData } from './apifox';
import { fetchSwaggerData } from './swagger';

export async function fetchData(config: ApiConfig): Promise<any> {
  switch (config.serverType) {
    case ServerType.Apifox:
      return fetchApifoxData(config);
    case ServerType.Swagger:
      return fetchSwaggerData(config);
    default:
      throw new Error(`不支持的服务器类型: ${config.serverType}`);
  }
}
