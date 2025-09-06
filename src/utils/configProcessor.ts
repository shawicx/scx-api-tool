/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 配置处理器
 */
import { ServerConfig } from '../types';

export class ConfigProcessor {
  private disposes: Array<() => any> = [];

  async prepare(config: ServerConfig[]): Promise<ServerConfig[]> {
    // 现在直接使用 OpenAPI 3.0 数据
    const processedConfig = await Promise.all(
      config.map(async (item) => {
        const configItem = { ...item };
        // 不再需要启动本地服务器来转换数据格式
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
    // 清理资源
    return Promise.resolve();
  }
}
