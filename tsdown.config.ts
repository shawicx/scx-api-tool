/**
 * @author: shawicx d35f3153@proton.me
 * @description: tsdown
 */
import { defineConfig } from 'tsdown';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig([
  // 主构建：生成所有 JS 文件（不生成类型声明）
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/'],
    format: 'esm',
    target: 'ESNext',
    outDir: 'dist',
    dts: false,
    copy: ['src/templates/', 'src/visualize/'],
    minify: isProd,
    sourcemap: !isProd,
    treeshake: true,
    hash: false,
    // 所有 node_modules 中的包都标记为 external
    external: (id) => /node_modules/.test(id),
  },
  // 类型声明构建：只为 index.ts 生成类型声明
  {
    entry: 'src/index.ts',
    format: 'esm',
    target: 'ESNext',
    outDir: 'dist',
    dts: true,
    minify: false,
    sourcemap: false,
    treeshake: true,
    hash: false,
    // 所有 node_modules 中的包都标记为 external
    external: (id) => /node_modules/.test(id),
  },
]);
