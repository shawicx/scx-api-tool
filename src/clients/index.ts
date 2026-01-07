/**
 * @description 客户端主模块 负责与不同类型的 API 服务器通信
 */
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
import { fetchApifoxData } from './apifox';
import { fetchSwaggerData } from './swagger';
import consola from 'consola';
import { ErrorFactory } from '@/errors';

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
      throw ErrorFactory.configInvalid(`不支持的服务器类型: ${config.serverType}`, [
        {
          title: '检查服务器类型配置',
          steps: [
            '确认 serverType 为 "apifox" 或 "swagger"',
            'source URL 应该自动识别服务器类型',
            '尝试使用 `npx api-power init` 重新生成配置',
          ],
        },
      ]);
  }
}
