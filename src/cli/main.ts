#!/usr/bin/env node

/**
 * @description CLI 可执行入口（bin 专用）
 * 仅负责启动命令行程序；库入口见 src/index.ts（不含任何 CLI 副作用，
 * 确保外部 `import { defineConfig } from '@scxfe/api-tool'` 不会触发命令解析）
 */

import { program } from './program';

program.parse(process.argv);
