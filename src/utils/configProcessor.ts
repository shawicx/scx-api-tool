/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-10 10:42:43
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:25:55
 * @Description:
 */
import { castArray } from 'lodash-es';
import { ApifoxToYApiServer } from '../ApifoxToYApiServer';
import { SwaggerToYApiServer } from '../SwaggerToYApiServer';
import { ServerConfig } from './config';

export class ConfigProcessor {
  private disposes: Array<() => any> = [];

  async prepare(config: ServerConfig[]): Promise<ServerConfig[]> {
    const processedConfig = await Promise.all(
      config.map(async (item) => {
        const configItem = { ...item };
        if (configItem.serverType === 'swagger') {
          const swaggerToYApiServer = new SwaggerToYApiServer({
            swaggerJsonUrl: configItem.serverUrl,
          });
          configItem.serverUrl = await swaggerToYApiServer.start();
          this.disposes.push(() => swaggerToYApiServer.stop());
        }
        if (configItem.serverType === 'apifox') {
          // 获取第一个项目的第一个token
          const firstProject = configItem.projects[0];
          const firstToken = firstProject ? castArray(firstProject.token)[0] : '';

          const apifoxToYApiServer = new ApifoxToYApiServer({
            serverUrl: configItem.serverUrl,
            token: firstToken,
            projectId: configItem.apifoxProjectId || '6720131', // 使用配置中的项目ID，如果没有则使用默认值
          });
          configItem.serverUrl = await apifoxToYApiServer.start();
          this.disposes.push(() => apifoxToYApiServer.stop());
        }
        if (configItem.serverUrl) {
          // 去除地址后面的 /
          configItem.serverUrl = configItem.serverUrl.replace(/\/+$/, '');
        }
        return configItem;
      }),
    );

    return processedConfig;
  }

  async destroy() {
    return Promise.all(this.disposes.map(async (dispose) => dispose()));
  }
}
