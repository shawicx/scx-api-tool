#!/usr/bin/env node
/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 01:44:14
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:59:25
 * @Description: 构建后优化脚本 - 清理和优化构建产物
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function postBuild() {
  const libDir = path.join(__dirname, '../lib');
  const distDir = path.join(__dirname, '../dist');

  console.log('📦 开始构建后优化...');

  try {
    // 1. 为不同模块格式创建 package.json
    console.log('🔧 创建模块类型标识文件...');

    // CJS 目录
    if (await fs.pathExists(libDir)) {
      await fs.writeJson(
        path.join(libDir, 'package.json'),
        {
          type: 'commonjs',
        },
        { spaces: 2 },
      );
      console.log('✅ 已创建 lib/package.json (commonjs)');
    }

    // ESM 目录
    if (await fs.pathExists(distDir)) {
      await fs.writeJson(
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
    const cliFile = path.join(libDir, 'cli.js');
    if (await fs.pathExists(cliFile)) {
      // 读取 CLI 文件内容
      let cliContent = await fs.readFile(cliFile, 'utf8');

      // 检查是否已经有 shebang
      if (!cliContent.startsWith('#!/usr/bin/env node')) {
        // 在文件开头添加 shebang
        cliContent = '#!/usr/bin/env node\n' + cliContent;
        await fs.writeFile(cliFile, cliContent);
        console.log('✅ 已添加 shebang 到 lib/cli.js');
      }

      // 设置文件为可执行
      await fs.chmod(cliFile, 0o755);
      console.log('✅ 已设置 lib/cli.js 为可执行');
    }

    // 3. 清理模板文件（如果使用了构建时注入）
    // console.log('🧹 清理不必要的模板文件...');
    // const templatesInLib = path.join(libDir, 'templates');
    // const templatesInDist = path.join(distDir, 'templates');

    // if (await fs.pathExists(templatesInLib)) {
    //   await fs.remove(templatesInLib);
    //   console.log('✅ 已移除 lib/templates');
    // }

    // if (await fs.pathExists(templatesInDist)) {
    //   await fs.remove(templatesInDist);
    //   console.log('✅ 已移除 dist/templates');
    // }

    // 4. 统计构建产物大小
    console.log('📊 构建产物体积统计:');
    if (await fs.pathExists(libDir)) {
      const libSize = execSync(`du -sh ${libDir}`, { encoding: 'utf8' }).trim();
      console.log(`   lib: ${libSize.split('\t')[0]}`);
    }
    if (await fs.pathExists(distDir)) {
      const distSize = execSync(`du -sh ${distDir}`, { encoding: 'utf8' }).trim();
      console.log(`   dist: ${distSize.split('\t')[0]}`);
    }

    console.log('✨ 构建后优化完成!');
  } catch (error) {
    console.error('❌ 构建后优化失败:', error.message);
    process.exit(1);
  }
}

postBuild();
