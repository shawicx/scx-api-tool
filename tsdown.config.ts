/**
 * @author: shawicx d35f3153@proton.me
 * @description: tsdown
 */
import { defineConfig } from 'tsdown';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig([
  {
    entry: ['src/**/*.ts', '!src/service/**/*', '!src/templates/'],
    format: 'esm',
    target: 'ESNext',
    outDir: 'dist',
    dts: true,
    copy: ['src/templates/', 'src/visualize/'],
    minify: isProd,
    sourcemap: !isProd,
    treeshake: true,
    // 所有 node_modules 中的包都标记为 external
    external: (id) => /node_modules/.test(id),
  },
]);
