/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 09:26:49
 * @Description: tsdown 配置 - 优化构建体积和外部化依赖
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
    minify: true,
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
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/', '!api-power.config.ts'],
    format: 'cjs',
    target: 'node20',
    outDir: 'lib',
    dts: true,
    copy: ['src/templates/'],
    minify: false, // CLI 文件不压缩，方便调试
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
