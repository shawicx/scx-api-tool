/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:37:57
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:25:00
 * @Description:
 */
import { Server } from 'http';
import { isEmpty } from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import { swaggerJsonToYApiData } from './swaggerJsonToYApiData';
import type { ApifoxConfig, AsyncReturnType, YApiData } from './utils';
import {
  defaultResponseHandler,
  fetchApifoxOpenAPI,
  getAvailableServerPort,
  startServer,
  stopServerSync as stopServer,
} from './utils';

export interface ApifoxToYApiServerOptions {
  serverUrl: string;
  token: string;
  projectId: string; // 改为必需参数
}

export class ApifoxToYApiServer {
  private port = 0;
  private openApiData: OpenAPIV3.Document = {} as any;
  private httpServer: Server | null = null;
  private yapiData: AsyncReturnType<typeof swaggerJsonToYApiData> = {} as any;

  constructor(private readonly options: ApifoxToYApiServerOptions) {}

  async getPort(): Promise<number> {
    if (this.port === 0) {
      this.port = await getAvailableServerPort({ defaultPort: 50506 }); // 使用不同的端口避免冲突
    }
    return this.port;
  }

  async getUrl(): Promise<string> {
    return `http://127.0.0.1:${await this.getPort()}`;
  }

  async getOpenApiData(): Promise<OpenAPIV3.Document> {
    if (isEmpty(this.openApiData)) {
      const config: ApifoxConfig = {
        serverUrl: this.options.serverUrl,
        token: this.options.token,
        projectId: this.options.projectId,
      };
      this.openApiData = await fetchApifoxOpenAPI(config);
    }
    return this.openApiData;
  }

  async getYApiData(): Promise<AsyncReturnType<typeof swaggerJsonToYApiData>> {
    if (isEmpty(this.yapiData)) {
      this.yapiData = await swaggerJsonToYApiData(await this.getOpenApiData());
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
