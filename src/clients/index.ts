/**
 * @description 客户端主模块 负责与不同类型的 API 服务器通信
 */
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
import { fetchApifoxData } from './apifox';
import { fetchSwaggerData } from './swagger';
import consola from 'consola';
import { ErrorFactory } from '@/errors';

/**
 * @description 根据服务器类型获取 API 数据
 * 自动识别服务器类型并调用相应的数据获取函数
 * @param config API 配置
 * @returns OpenAPI 数据对象
 * @throws {Error} 如果服务器类型不支持或请求失败
 *
 * @example
 * ```typescript
 * const data = await fetchData(config);
 * // 根据配置自动选择：
 * // - fetchApifoxData() 如果 serverType === 'apifox'
 * // - fetchSwaggerData() 如果 serverType === 'swagger'
 * ```
 */
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
