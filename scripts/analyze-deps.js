#!/usr/bin/env node
/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 01:44:14
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:22:38
 * @Description: 依赖体积分析脚本（ESM 版本）
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM 环境下的 __filename 和 __dirname 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeDependencies() {
  console.log('🔍 开始分析依赖体积...');

  try {
    const nodeModulesPath = path.join(__dirname, '../node_modules');

    if (!(await fs.pathExists(nodeModulesPath))) {
      console.log('❌ node_modules 目录不存在，请先安装依赖');
      return;
    }

    // 分析大型依赖
    console.log('📊 最大的依赖包 (前15个):');
    try {
      const sizeOutput = execSync(
        `find "${nodeModulesPath}" -maxdepth 2 -name "package.json" -exec dirname {} \\; | xargs du -sh | sort -hr | head -15`,
        { encoding: 'utf8' },
      );
      console.log(sizeOutput);
    } catch (error) {
      console.log('无法分析依赖大小');
    }

    // 分析关键依赖
    const keyDependencies = [
      'swagger-client',
      'lodash',
      'axios',
      'json-schema-to-typescript',
      'fs-extra',
      'yargs',
      'consola',
      'dayjs',
      'change-case',
      'prettier',
      'typescript',
    ];

    console.log('\n🎯 关键依赖体积分析:');
    for (const dep of keyDependencies) {
      const depPath = path.join(nodeModulesPath, dep);
      if (await fs.pathExists(depPath)) {
        try {
          const size = execSync(`du -sh "${depPath}"`, { encoding: 'utf8' }).trim().split('\t')[0];
          console.log(`   ${dep.padEnd(30)} ${size}`);
        } catch (error) {
          console.log(`   ${dep.padEnd(30)} 无法获取大小`);
        }
      } else {
        console.log(`   ${dep.padEnd(30)} 未安装`);
      }
    }

    // 检查构建产物
    const libDir = path.join(__dirname, '../lib');
    const distDir = path.join(__dirname, '../dist');

    console.log('\n📦 构建产物分析:');
    if (await fs.pathExists(libDir)) {
      try {
        const libFiles = execSync(
          `find "${libDir}" -name "*.js" -exec wc -c {} + | sort -nr | head -10`,
          { encoding: 'utf8' },
        );
        console.log('lib 目录最大文件:');
        console.log(libFiles);
      } catch (error) {
        console.log('无法分析 lib 目录');
      }
    }

    if (await fs.pathExists(distDir)) {
      try {
        const distFiles = execSync(
          `find "${distDir}" -name "*.js" -exec wc -c {} + | sort -nr | head -10`,
          { encoding: 'utf8' },
        );
        console.log('dist 目录最大文件:');
        console.log(distFiles);
      } catch (error) {
        console.log('无法分析 dist 目录');
      }
    }

    console.log('\n💡 优化建议:');
    console.log('   1. 考虑将大型依赖（如 swagger-client）标记为 external');
    console.log('   2. 使用 lodash-es 替代 lodash 以支持 tree-shaking');
    console.log('   3. 考虑按需导入或动态导入大型依赖');
    console.log('   4. 检查是否有不必要的依赖可以移除');
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
  }
}

// 检查是否为直接运行（ESM 模式）
function isMainModule() {
  const modulePath = fileURLToPath(import.meta.url);
  const mainPath = process.argv[1];
  return modulePath === mainPath;
}

if (isMainModule()) {
  analyzeDependencies();
}

export { analyzeDependencies };
