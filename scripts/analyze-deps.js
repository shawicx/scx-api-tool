#!/usr/bin/env node
/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 01:44:14
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:22:38
 * @Description: 依赖体积分析脚本（ESM 版本）
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.join(__dirname, '..');

/**
 * 获取目录大小（字节），递归计算
 */
function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else if (entry.isFile()) {
        try {
          totalSize += statSync(fullPath).size;
        } catch {}
      }
    }
  } catch {}
  return totalSize;
}

/**
 * 格式化字节大小为人类可读格式
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 从 package.json 读取实际依赖列表
 */
function getDependencies() {
  const pkg = JSON.parse(
    // eslint-disable-next-line no-sync
    execSync(`cat "${path.join(ROOT, 'package.json')}"`, { encoding: 'utf8' }),
  );
  return [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
}

function analyzeDependencies() {
  console.log('🔍 开始分析依赖体积...\n');

  const nodeModulesPath = path.join(ROOT, 'node_modules');

  if (!existsSync(nodeModulesPath)) {
    console.log('❌ node_modules 目录不存在，请先安装依赖');
    return;
  }

  // 分析所有依赖体积并排序
  const deps = getDependencies();
  const depSizes = [];

  for (const dep of deps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (existsSync(depPath)) {
      depSizes.push({ name: dep, size: getDirSize(depPath) });
    }
  }

  depSizes.sort((a, b) => b.size - a.size);

  console.log('📊 依赖体积排名:');
  for (const { name, size } of depSizes) {
    console.log(`   ${name.padEnd(30)} ${formatSize(size)}`);
  }

  // 分析构建产物
  const distDir = path.join(ROOT, 'dist');
  console.log('\n📦 构建产物分析:');
  if (existsSync(distDir)) {
    try {
      const distFiles = execSync(
        `find "${distDir}" -name "*.js" -exec wc -c {} + | sort -nr | head -10`,
        { encoding: 'utf8' },
      );
      console.log('dist 目录最大文件:');
      console.log(distFiles);
    } catch {
      console.log('   dist 目录为空或无法分析');
    }
  } else {
    console.log('   dist 目录不存在，请先执行 build');
  }

  // 给出针对性建议
  const totalSize = depSizes.reduce((sum, d) => sum + d.size, 0);
  const topDeps = depSizes.slice(0, 3).map((d) => d.name);

  console.log('\n💡 优化建议:');
  console.log(`   依赖总体积: ${formatSize(totalSize)}`);
  console.log(`   体积最大的依赖: ${topDeps.join(', ')}`);

  const hasAxios = depSizes.find((d) => d.name === 'axios');
  if (hasAxios && hasAxios.size > 1024 * 1024) {
    console.log('   - axios 体积较大，考虑使用更轻量的 HTTP 客户端（如 ofetch、ky）');
  }
  console.log('   - 使用 tsdown 的 external 配置将运行时依赖外部化');
  console.log('   - 检查 devDependencies 中的包是否被误打包进产物');
}

const entryPath = process.argv[1];
if (entryPath && path.resolve(entryPath) === __filename) {
  analyzeDependencies();
}

export { analyzeDependencies };
