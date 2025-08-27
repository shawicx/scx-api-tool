/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:37:57
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 10:46:47
 * @Description: Swagger转YApi服务器
 */
import { OpenAPIV2 as SwaggerType } from 'openapi-types';
import { BaseYApiServer } from './utils/BaseYApiServer';
import { httpGet } from './utils/index';
import type { SwaggerToYApiServerOptions } from './types';

// 接口定义已移至 types/server.ts

export class SwaggerToYApiServer extends BaseYApiServer {
  private swaggerJson: SwaggerType.Document = {} as any;
  private swaggerJsonUrl: string;

  constructor(options: SwaggerToYApiServerOptions) {
    super({ defaultPort: 50505 });
    this.swaggerJsonUrl = options.swaggerJsonUrl;
  }

  /**
   * 获取Swagger数据，带缓存
   */
  protected async getSourceData(): Promise<SwaggerType.Document> {
    if (this.swaggerJson && Object.keys(this.swaggerJson).length > 0) {
      return this.swaggerJson;
    }

    const res = await httpGet<SwaggerType.Document>(this.swaggerJsonUrl);
    this.swaggerJson = res;
    return this.swaggerJson;
  }
}
