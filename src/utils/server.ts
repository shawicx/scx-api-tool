/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:03:35
 * @Description: 服务器相关的工具函数
 */
import getAvailablePort from 'get-port';
import http from 'http';
import onExit from 'signal-exit';
import url from 'url';

// 通用服务器配置接口
export interface HttpServerConfig {
  port: number;
  host: string;
}

export interface CreateServerOptions {
  port?: number;
  host?: string;
  onRequest: (req: http.IncomingMessage, res: http.ServerResponse) => void;
  onExit?: (cleanup: () => void) => void;
}

// YApi相关接口
export interface ServerPortOptions {
  defaultPort: number;
  portRange?: [number, number];
}

export interface YApiData {
  cats: any[];
  interfaces: any[];
  project: any;
}

export interface ServerResponseHandler {
  handleExportRequest: (yapiData: YApiData) => string;
  handleMenuRequest: (yapiData: YApiData) => string;
  handleProjectRequest: (yapiData: YApiData) => string;
}

/**
 * @description 获取可用端口 - 通用版本
 * @param preferredPort 首选端口
 * @returns 可用端口号
 */
export async function getAvailablePortAsync(preferredPort = 50505): Promise<number> {
  return await getAvailablePort({ port: preferredPort });
}

/**
 * @description 获取可用端口 - YApi专用版本
 * @param options 端口选项
 * @returns 可用端口号
 */
export async function getAvailableServerPort(options: ServerPortOptions): Promise<number> {
  return getAvailablePort({
    port: options.defaultPort,
    ...(options.portRange && { port: options.portRange }),
  });
}

/**
 * @description 创建HTTP服务器 - 通用版本
 * @param options 服务器配置选项
 * @returns 服务器实例和启动Promise
 */
export function createHttpServer(options: CreateServerOptions): {
  server: http.Server;
  startPromise: Promise<void>;
} {
  const { port = 50505, host = '127.0.0.1', onRequest, onExit: exitHandler } = options;

  let resolveStart: () => void;
  const startPromise = new Promise<void>((resolve) => {
    resolveStart = resolve;
  });

  const server = http.createServer(onRequest);

  server.listen(port, host, () => {
    if (exitHandler) {
      exitHandler(() => {
        server.close();
      });
    }
    resolveStart();
  });

  return { server, startPromise };
}

/**
 * @description 创建HTTP服务器 - YApi专用版本
 * @param port 端口号
 * @param yapiData YApi数据
 * @param responseHandler 响应处理器
 * @returns HTTP服务器实例
 */
export function createYApiServer(
  port: number,
  yapiData: YApiData,
  responseHandler: ServerResponseHandler,
): http.Server {
  return http.createServer(async (req, res) => {
    const { pathname } = url.parse(req.url || '');
    res.setHeader('Content-Type', 'application/json');

    if (pathname!.includes('/api/plugin/export')) {
      res.end(responseHandler.handleExportRequest(yapiData));
    } else if (pathname!.includes('/api/interface/getCatMenu')) {
      res.end(responseHandler.handleMenuRequest(yapiData));
    } else if (pathname!.includes('/api/project/get')) {
      res.end(responseHandler.handleProjectRequest(yapiData));
    } else {
      res.end('404');
    }
  });
}

/**
 * @description 停止HTTP服务器 - 通用版本（返回Promise）
 * @param server HTTP服务器实例
 * @returns Promise
 */
export function stopServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * @description 停止HTTP服务器 - 同步版本
 * @param server HTTP服务器实例
 */
export function stopServerSync(server: http.Server | null): void {
  if (server) {
    server.close();
  }
}

/**
 * @description 启动YApi服务器
 * @param port 端口号
 * @param yapiData YApi数据
 * @param responseHandler 响应处理器
 * @returns HTTP服务器实例
 */
export async function startYApiServer(
  port: number,
  yapiData: YApiData,
  responseHandler: ServerResponseHandler,
): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = createYApiServer(port, yapiData, responseHandler);

    server.listen(port, '127.0.0.1', () => {
      onExit(() => server.close());
      resolve(server);
    });
  });
}

/**
 * @description 生成服务器URL
 * @param port 端口号
 * @param host 主机地址
 * @returns 服务器URL
 */
export function generateServerUrl(port: number, host = '127.0.0.1'): string {
  return `http://${host}:${port}`;
}

/**
 * @description 设置CORS响应头
 * @param res HTTP响应对象
 */
export function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * @description 设置JSON响应头
 * @param res HTTP响应对象
 */
export function setJsonHeaders(res: http.ServerResponse): void {
  res.setHeader('Content-Type', 'application/json');
  setCorsHeaders(res);
}

/**
 * @description 发送JSON响应
 * @param res HTTP响应对象
 * @param data 响应数据
 * @param statusCode 状态码
 */
export function sendJsonResponse(res: http.ServerResponse, data: any, statusCode = 200): void {
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

/**
 * @description 发送成功响应
 * @param res HTTP响应对象
 * @param data 响应数据
 * @param message 成功消息
 */
export function sendSuccessResponse(res: http.ServerResponse, data: any, message = '成功！'): void {
  sendJsonResponse(res, {
    errcode: 0,
    errmsg: message,
    data,
  });
}

/**
 * 发送错误响应
 * @param res HTTP响应对象
 * @param message 错误消息
 * @param statusCode 状态码
 */
export function sendErrorResponse(
  res: http.ServerResponse,
  message = '请求失败',
  statusCode = 400,
): void {
  sendJsonResponse(
    res,
    {
      errcode: statusCode,
      errmsg: message,
    },
    statusCode,
  );
}

/**
 * 默认的YApi响应处理器
 */
export const defaultResponseHandler: ServerResponseHandler = {
  handleExportRequest: (yapiData: YApiData) => {
    return JSON.stringify(
      yapiData.cats.map((cat) => ({
        ...cat,
        list: yapiData.interfaces.filter((item) => item.catid === cat._id),
      })),
    );
  },

  handleMenuRequest: (yapiData: YApiData) => {
    return JSON.stringify({
      errcode: 0,
      errmsg: '成功！',
      data: yapiData.cats,
    });
  },

  handleProjectRequest: (yapiData: YApiData) => {
    return JSON.stringify({
      errcode: 0,
      errmsg: '成功！',
      data: yapiData.project,
    });
  },
};

// 向后兼容的别名
export const startServer = startYApiServer;
export const createHttpServerForYApi = createYApiServer;
