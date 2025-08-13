/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:14:33
 * @Description: tsdown 配置
 */

import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // ESM配置
    entry: ['src/**/*.ts', '!src/service/**/*'],
    format: 'esm',
    target: 'ESNext',
    outDir: 'lib/esm',
    dts: true,
  },
  {
    // CJS配置
    entry: ['src/**/*.ts', '!src/service/**/*'],
    format: 'cjs',
    target: 'node18',
    outDir: 'lib/cjs',
    dts: false,
  },
]);
