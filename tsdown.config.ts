/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 01:32:08
 * @Description: tsdown 配置
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
  },
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/', '!apiPower.config.ts'],
    format: 'cjs',
    target: 'node20',
    outDir: 'lib',
    dts: true,
    copy: ['src/templates/'],
  },
]);
