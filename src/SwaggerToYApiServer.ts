/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:37:57
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 00:45:47
 * @Description:
 */
import { Server } from 'http';
import _ from 'lodash';
import { OpenAPIV2 as SwaggerType } from 'openapi-types';
import { swaggerJsonToYApiData } from './swaggerJsonToYApiData';
import type { AsyncReturnType, YApiData } from './utils';
import {
  defaultResponseHandler,
  getAvailableServerPort,
  httpGet,
  startServer,
  stopServerSync as stopServer,
} from './utils';

// 从lodash主包中提取需要的函数
const { isEmpty } = _;

export interface SwaggerToYApiServerOptions {
  swaggerJsonUrl: string;
}

export class SwaggerToYApiServer {
  private port = 0;
  private swaggerJson: SwaggerType.Document = {} as any;
  private httpServer: Server | null = null;
  private yapiData: AsyncReturnType<typeof swaggerJsonToYApiData> = {} as any;

  constructor(private readonly options: SwaggerToYApiServerOptions) {}

  async getPort(): Promise<number> {
    if (this.port === 0) {
      this.port = await getAvailableServerPort({ defaultPort: 50505 });
    }
    return this.port;
  }

  async getUrl(): Promise<string> {
    return `http://127.0.0.1:${await this.getPort()}`;
  }

  async getSwaggerJson(): Promise<SwaggerType.Document> {
    if (isEmpty(this.swaggerJson)) {
      const res = await httpGet<SwaggerType.Document>(this.options.swaggerJsonUrl);
      this.swaggerJson = res;
    }
    return this.swaggerJson;
  }

  async getYApiData(): Promise<AsyncReturnType<typeof swaggerJsonToYApiData>> {
    if (isEmpty(this.yapiData)) {
      this.yapiData = await swaggerJsonToYApiData(await this.getSwaggerJson());
    }
    return this.yapiData;
  }

  async start(): Promise<string> {
    const yapiData = await this.getYApiData();
    this.httpServer = await startServer(
      await this.getPort(),
      yapiData as YApiData,
      defaultResponseHandler,
    );
    return this.getUrl();
  }

  async stop(): Promise<void> {
    stopServer(this.httpServer);
    this.httpServer = null;
  }
}
