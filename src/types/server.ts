/*
 * @Author: shawicx d35f3153@proton.me
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
