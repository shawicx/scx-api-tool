#!/usr/bin/env node
/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 01:44:14
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:59:25
 * @Description: 构建后优化脚本 - 清理和优化构建产物（纯 ESM 版本）
 */

import { execSync } from 'child_process';
import { pathExists, writeJson } from 'fs-extra';
import { readFile, writeFile, chmod } from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM 环境下的 __filename 和 __dirname 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function postBuild() {
  const distDir = path.join(__dirname, '../dist');

  console.log('📦 开始构建后优化... (纯 ESM 模式)');

  try {
    // 1. 为 ESM 目录创建 package.json 标识文件
    console.log('🔧 创建 ESM 模块类型标识文件...');
    if (await pathExists(distDir)) {
      await writeJson(
        path.join(distDir, 'package.json'),
        {
          type: 'module',
        },
        { spaces: 2 },
      );
      console.log('✅ 已创建 dist/package.json (module)');
    }

    // 2. 设置 CLI 文件权限和 shebang
    console.log('🔧 设置 CLI 文件权限和 shebang...');
    const cliFile = path.join(distDir, 'index.js');
    if (await pathExists(cliFile)) {
      // 读取 CLI 文件内容
      let cliContent = await readFile(cliFile, 'utf8');

      // 检查是否已经有 shebang
      if (!cliContent.startsWith('#!/usr/bin/env node')) {
        // 在文件开头添加 shebang
        cliContent = '#!/usr/bin/env node\n' + cliContent;
        await writeFile(cliFile, cliContent);
        console.log('✅ 已添加 shebang 到 dist/index.js');
      }

      // 设置文件为可执行
      await chmod(cliFile, 0o755);
      console.log('✅ 已设置 dist/index.js 为可执行');
    }

    // 3. 清理不必要的文件（可选）
    // console.log('🧹 清理不必要的模板文件...');
    // const templatesInDist = path.join(distDir, 'templates');
    // if (await fs.pathExists(templatesInDist)) {
    //   await fs.remove(templatesInDist);
    //   console.log('✅ 已移除 dist/templates');
    // }

    // 4. 统计构建产物大小
    console.log('📊 构建产物体积统计:');
    if (await pathExists(distDir)) {
      const distSize = execSync(`du -sh ${distDir}`, { encoding: 'utf8' }).trim();
      console.log(`   dist (纯 ESM): ${distSize.split('\t')[0]}`);
    }

    console.log('✨ 构建后优化完成! (纯 ESM 模式)');
  } catch (error) {
    console.error('❌ 构建后优化失败:', error.message);
    process.exit(1);
  }
}

postBuild();
