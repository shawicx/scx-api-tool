/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 11:00:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 11:00:00
 * @Description: 服务器相关的类型定义
 */

/** HTTP服务器配置 */
export interface HttpServerConfig {
  port: number;
  host?: string;
}

/** 创建服务器选项 */
export interface CreateServerOptions {
  port?: number;
  host?: string;
  onRequest: (req: any, res: any) => void;
  onExit?: (cleanup: () => void) => void;
}

/** 服务器端口选项 */
export interface ServerPortOptions {
  defaultPort: number;
  portRange?: [number, number];
}

/** YApi数据 */
export interface YApiData {
  cats: any[];
  interfaces: any[];
  project: any;
}

/** 服务器响应处理器 */
export interface ServerResponseHandler {
  handleExportRequest: (yapiData: YApiData) => string;
  handleMenuRequest: (yapiData: YApiData) => string;
  handleProjectRequest: (yapiData: YApiData) => string;
}

/** BaseYApiServer选项 */
export interface BaseYApiServerOptions {
  defaultPort: number;
}

/** SwaggerToYApiServer选项 */
export interface SwaggerToYApiServerOptions {
  swaggerJsonUrl: string;
}

/** ApifoxToYApiServer选项 */
export interface ApifoxToYApiServerOptions extends BaseYApiServerOptions {
  serverUrl: string;
  token: string;
  projectId: string;
}

/** 文件生成器选项 */
export interface FileGeneratorOptions {
  cwd: string;
  outputDir: string;
}

/** 输出文件列表 */
export interface OutputFileList {
  [outputFilePath: string]: {
    syntheticalConfig: any;
    content: string[];
    requestFunctionFilePath: string;
    requestHookMakerFilePath: string;
  };
}
