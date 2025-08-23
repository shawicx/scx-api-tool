/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-23 23:36:09
 * @Description: tsdown 配置
 */

import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // ESM配置
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/'],
    format: 'esm',
    target: 'ESNext',
    outDir: 'lib/esm',
    dts: true,
    copy: ['src/templates/'],
  },
  {
    // CJS配置
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/'],
    format: 'cjs',
    target: 'node18',
    outDir: 'lib/cjs',
    dts: false,
    copy: ['src/templates/'],
  },
]);
