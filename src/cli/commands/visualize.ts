/**
 * @description 配置可视化命令 - 启动 Web 服务器进行可视化配置编辑
 */

import { Command } from 'commander';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '@/config/loader';
import { fetchData } from '@/clients';
import { logger } from '@/utils/logger';
import { handleError } from '@/errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const visualizeCommand = new Command('visualize')
  .alias('viz')
  .description('启动可视化配置服务器')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-p, --port <number>', '服务器端口', '3000')
  .option('--host <address>', '服务器地址', 'localhost')
  .option('-v, --verbose', '显示详细的错误信息和堆栈跟踪', false)
  .action(async (options) => {
    const { verbose = false, port, host, config: configPath } = options;
    const serverPort = parseInt(port, 10);

    try {
      // 加载配置（多服务，返回 ApiConfig[]）
      logger.info('加载配置文件...');
      const configs = await loadConfig(configPath);
      // visualize 命令针对首个服务展示（多服务场景下可分别启动多个实例）
      const config = configs[0];

      // 获取 OpenAPI Schema
      logger.info(`获取 OpenAPI Schema (服务: ${config.source})...`);
      const schema = await fetchData(config);

      // 创建 HTTP 服务器
      const server = createServer(async (req, res) => {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        const url = new URL(req.url || '', `http://${req.headers.host}`);

        try {
          // / 路由 - 返回 HTML 页面
          if (url.pathname === '/') {
            // 尝试多个可能的路径
            const possiblePaths = [
              join(__dirname, '../../visualize/index.html'), // 开发环境
              join(__dirname, '../visualize/index.html'), // 打包后的相对路径
              join(process.cwd(), 'dist/visualize/index.html'), // 从项目根目录
              join(__dirname, 'visualize/index.html'), // 打包后的同级目录
            ];

            let html: string | null = null;
            let htmlPath = '';

            for (const path of possiblePaths) {
              try {
                const content = await fs.readFile(path, 'utf-8');
                html = content as string;
                htmlPath = path;
                logger.success(`找到 HTML 文件: ${htmlPath}`);
                break;
              } catch {
                // consola.error(`未找到 HTML 文件`);
              }
            }

            if (!html) {
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('无法找到 HTML 文件');
              logger.error('无法找到 index.html，尝试的路径:', possiblePaths);
              logger.error('当前 __dirname:', __dirname);
              logger.error('当前 cwd:', process.cwd());
              return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
          }

          // /api/config 路由 - 返回当前配置
          if (url.pathname === '/api/config') {
            // 移除敏感信息
            const safeConfig = {
              ...config,
              // 保留配置结构，移除敏感 token
              token: config.token ? '[HIDDEN]' : undefined,
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(safeConfig, null, 2));
            return;
          }

          // /api/schema 路由 - 返回 OpenAPI 数据
          if (url.pathname === '/api/schema') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(schema, null, 2));
            return;
          }

          // 404
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } catch (error) {
          logger.error('请求处理错误:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });

      // 启动服务器
      server.listen(serverPort, host, () => {
        logger.success(`可视化服务器已启动!`);
        logger.info(`  访问地址: http://${host}:${serverPort}`);
        logger.info(`  按 Ctrl+C 停止服务器`);
      });

      // 处理进程退出
      process.on('SIGINT', () => {
        logger.info('\n正在关闭服务器...');
        server.close(() => {
          logger.success('服务器已关闭');
          process.exit(0);
        });
      });
    } catch (error: any) {
      handleError(error, verbose);
    }
  });
