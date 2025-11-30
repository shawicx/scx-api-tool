/*
 * @Author: shawicx d35f3153@proton.me
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
    // 所有 node_modules 中的包都标记为 external
    external: (id) => /node_modules/.test(id),
  },
]);
