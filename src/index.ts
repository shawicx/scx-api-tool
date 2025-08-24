#!/usr/bin/env node

/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 09:15:00
 * @Description: 主要入口文件 - 导出核心功能和 CLI
 */

// 导出所有工具函数和类型
export * from './utils';

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

// 只在直接运行时执行
if (require.main === module) {
  main();
}
