/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 10:38:54
 * @Description: tsdown 配置 - 纯 ESM 构建配置
 */
import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/'],
    format: 'esm',
    target: 'ESNext',
    outDir: 'dist',
    dts: true,
    copy: ['src/templates/'],
    minify: false, // 保持代码可读性，方便调试
    sourcemap: false,
    treeshake: true,
    external: (id) => {
      // 所有 node_modules 中的包都标记为 external
      return (
        /node_modules/.test(id) ||
        [
          'fs',
          'path',
          'url',
          'util',
          'os',
          'crypto',
          'stream',
          'events',
          'buffer',
          'querystring',
          'child_process',
          'cluster',
          'net',
          'http',
          'https',
          'zlib',
          'readline',
          'assert',
          'constants',
          'dgram',
          'dns',
          'domain',
          'punycode',
          'string_decoder',
          'tls',
          'tty',
          'v8',
          'vm',
          'worker_threads',
        ].includes(id)
      );
    },
  },
]);
