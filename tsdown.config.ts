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
    // tsdown 0.23 起 node 平台默认 fixedExtension: true（.mjs/.d.mts），
    // 显式关闭以保持 package.json 的 bin/main/types 指向 .js/.d.ts
    fixedExtension: false,
    // 所有 node_modules 中的包都不打入产物（原 external 选项的替代写法）
    deps: { neverBundle: (id: string) => /node_modules/.test(id) },
  },
]);
