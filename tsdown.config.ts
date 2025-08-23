/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 03:21:42
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
    external: ['swagger-client', 'lodash', 'typescript', 'prettier', 'babel'],
  },
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/', '!api-power.config.ts'],
    format: 'cjs',
    target: 'node20',
    outDir: 'lib',
    dts: true,
    copy: ['src/templates/'],
    minify: true,
    sourcemap: false,
    treeshake: true,
    external: ['swagger-client', 'lodash', 'typescript', 'prettier', 'babel'],
  },
]);
