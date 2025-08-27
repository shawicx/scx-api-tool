/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:37:57
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-08-27 20:22:57
 * @Description: Apifox转YApi服务器
 */
import { OpenAPIV3 } from 'openapi-types';
import type { ApifoxConfig, ApifoxToYApiServerOptions } from './types';
import { BaseYApiServer } from './utils/BaseYApiServer';
import { fetchApifoxOpenAPI } from './utils/index';

// 接口定义已移至 types/server.ts

export class ApifoxToYApiServer extends BaseYApiServer {
  private openApiData: OpenAPIV3.Document = {} as any;

  constructor(protected readonly options: ApifoxToYApiServerOptions) {
    super({ defaultPort: 50506 });
  }

  /**
   * 获取OpenAPI数据，带缓存
   */
  protected async getSourceData(): Promise<OpenAPIV3.Document> {
    if (this.openApiData && Object.keys(this.openApiData).length > 0) {
      return this.openApiData;
    }

    const config: ApifoxConfig = {
      serverUrl: this.options.serverUrl,
      token: this.options.token,
      projectId: this.options.projectId,
    };
    this.openApiData = await fetchApifoxOpenAPI(config);
    return this.openApiData;
  }
}
