#!/usr/bin/env node

/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 主要入口文件 - 导出核心功能和 CLI
 */

import { fileURLToPath } from 'url';

// 导出所有工具函数和类型
export * from './utils/index';

// 导出所有类型
export * from './types';

// 导出核心类
export { ApifoxToYApiServer } from './ApifoxToYApiServer';
export { Generator } from './Generator';
export { SwaggerToYApiServer } from './SwaggerToYApiServer';

// 导出 CLI 相关功能
export * from './cli/index';
export { runCLI } from './cli/program';

// CLI 主执行函数
import { runCLI } from './cli/program';

async function main(): Promise<void> {
  try {
    await runCLI();
  } catch (error: any) {
    console.error('CLI 执行失败:', error.message);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

// 检查是否为直接运行（ESM 模式）
function isMainModule(): boolean {
  // 在 ESM 中，我们需要比较 import.meta.url
  const modulePath = fileURLToPath(import.meta.url);
  const mainPath = process.argv[1];
  return modulePath === mainPath;
}

// 只在直接运行时执行
if (isMainModule()) {
  main();
}
