/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: YApi服务器基类，抽象共同的逻辑 - 类型已移至 types/server.ts
 */
import { Server } from 'http';
import { isEmpty } from 'lodash-es';
import type { AsyncReturnType } from 'type-fest';
import { swaggerJsonToYApiData } from '../swaggerJsonToYApiData.js';
import type { BaseYApiServerOptions, YApiData } from '../types';
import {
  defaultResponseHandler,
  getAvailableServerPort,
  startServer,
  stopServerSync as stopServer,
} from './server.js';

// 接口定义已移至 types/server.ts

export abstract class BaseYApiServer {
  /**
   * 启动服务器
   */
  async start(): Promise<string> {
    const yapiData = await this.getYApiData();
    this.httpServer = await startServer(
      await this.getPort(),
      yapiData as YApiData,
      defaultResponseHandler,
    );
    return this.getUrl();
  }

  protected port = 0;
  protected httpServer: Server | null = null;
  protected yapiData: AsyncReturnType<typeof swaggerJsonToYApiData> = {} as any;
  constructor(protected readonly options: BaseYApiServerOptions) {}

  /**
   * 获取可用端口
   */
  protected async getPort(): Promise<number> {
    if (this.port === 0) {
      this.port = await getAvailableServerPort({ defaultPort: this.options.defaultPort });
    }
    return this.port;
  }

  /**
   * 获取服务器URL
   */
  async getUrl(): Promise<string> {
    return `http://127.0.0.1:${await this.getPort()}`;
  }

  /**
   * 获取YApi数据，子类需要实现数据获取逻辑
   */
  protected abstract getSourceData(): Promise<any>;

  /**
   * 获取YApi数据，带缓存
   */
  async getYApiData(): Promise<AsyncReturnType<typeof swaggerJsonToYApiData>> {
    if (isEmpty(this.yapiData)) {
      const sourceData = await this.getSourceData();
      this.yapiData = await swaggerJsonToYApiData(sourceData);
    }
    return this.yapiData;
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    stopServer(this.httpServer);
    this.httpServer = null;
  }
}
