/**
 * @author: shawicx d35f3153@proton.me
 * @description: tsdown
 */
import { defineConfig } from 'tsdown';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig([
  // 双入口构建：库入口（纯导出，无 CLI 副作用）+ CLI 可执行入口（bin）
  // 分离确保外部 import 包时不触发 program.parse
  {
    entry: { index: 'src/index.ts', cli: 'src/cli/main.ts' },
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
