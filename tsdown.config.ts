/**
 * @author: shawicx d35f3153@proton.me
 * @description: tsdown
 */
import { defineConfig } from 'tsdown';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig([
  // 主构建：生成所有 JS 文件和类型声明
  {
    entry: 'src/index.ts',
    format: 'esm',
    target: 'ESNext',
    outDir: 'dist',
    dts: true,
    copy: ['src/visualize/'],
    minify: isProd,
    sourcemap: !isProd,
    treeshake: true,
    hash: false,
    // 所有 node_modules 中的包都标记为 external
    external: (id) => /node_modules/.test(id),
  },
]);
