import fs from 'fs-extra';
import path from 'path';
import { SyntheticalConfig } from './config';
import { getAllDirectoriesWithIndex } from './fileGenerator';
import { DEFAULT_CONFIG, getNormalizedRelativePath, transformPaths } from './index';

export interface OutputFileList {
  [outputFilePath: string]: {
    syntheticalConfig: SyntheticalConfig;
    content: string[];
    requestFunctionFilePath: string;
    requestHookMakerFilePath: string;
  };
}

export class FileManager {
  constructor(private options: { cwd: string } = { cwd: process.cwd() }) {}

  /**
   * 生成index.ts文件，将目录中的所有方法和interface类型导出
   * @param directoryPaths 目录路径
   * @param outputDir 输出目录
   */
  async generateIndexFile(directoryPaths: string[], outputDir: string = DEFAULT_CONFIG.OUTPUT_DIR) {
    // 确保目录存在
    const serviceDir = path.resolve(this.options.cwd, outputDir);
    await fs.ensureDir(serviceDir);

    // 递归获取所有包含 index.ts 的目录
    const allDirectories = await getAllDirectoriesWithIndex(serviceDir);

    // 检查目录是否存在
    if (!(await fs.pathExists(path.resolve(this.options.cwd, `${outputDir}/index.ts`)))) {
      // 创建index.ts文件
      await fs.writeFile(path.resolve(this.options.cwd, `${outputDir}/index.ts`), '');
    }
    const indexContent = transformPaths(allDirectories, outputDir).join('\n');
    await fs.writeFile(path.resolve(this.options.cwd, `${outputDir}/index.ts`), indexContent);
  }

  async write(outputFileList: OutputFileList) {
    const result = await Promise.all(
      Object.keys(outputFileList).map(async (outputFilePath) => {
        const { syntheticalConfig } = outputFileList[outputFilePath];
        const { requestFunctionFilePath, requestHookMakerFilePath } =
          outputFileList[outputFilePath];
        const rawRequestFunctionFilePath = requestFunctionFilePath;
        const rawRequestHookMakerFilePath = requestHookMakerFilePath;
        // 支持 .jsx? 后缀
        const updatedOutputFilePath = outputFilePath.replace(/\.jsx?$/, '.ts$1');
        const updatedRequestFunctionFilePath = requestFunctionFilePath.replace(/\.jsx?$/, '.ts$1');
        const updatedRequestHookMakerFilePath = requestHookMakerFilePath.replace(
          /\.jsx?$/,
          '.ts$1',
        );

        if (!syntheticalConfig.typesOnly) {
          // 检查request文件是否存在，如果不存在则生成默认的request.ts文件
          if (!requestFunctionFilePath || !(await fs.pathExists(rawRequestFunctionFilePath))) {
            // 读取默认的request.ts文件内容
            const defaultRequestContent = await fs.readFile(
              path.resolve(this.options.cwd, DEFAULT_CONFIG.REQUEST_FUNCTION_FILE_PATH),
              'utf-8',
            );
            // 在requestFunctionFilePath指定的路径下生成request.ts文件
            await fs.outputFile(rawRequestFunctionFilePath, defaultRequestContent);
          }
          if (
            syntheticalConfig.reactHooks &&
            syntheticalConfig.reactHooks.enabled &&
            !(await fs.pathExists(rawRequestHookMakerFilePath))
          ) {
            await fs.outputFile(
              updatedRequestHookMakerFilePath,
              `import { useState, useEffect } from 'react'
import type { RequestConfig } from '@scxfe/api-tool'
import type { Request } from ${JSON.stringify(
                getNormalizedRelativePath(updatedRequestHookMakerFilePath, updatedOutputFilePath),
              )}
import baseRequest from ${JSON.stringify(
                getNormalizedRelativePath(
                  updatedRequestHookMakerFilePath,
                  updatedRequestFunctionFilePath,
                ),
              )}

export default function makeRequestHook<TRequestData, TRequestConfig extends RequestConfig, TRequestResult extends ReturnType<typeof baseRequest>>(request: Request<TRequestData, TRequestConfig, TRequestResult>) {
    type Data = TRequestResult extends Promise<infer R> ? R : TRequestResult
    return function useRequest(requestData: TRequestData) {
        // 一个简单的 Hook 实现，实际项目可结合其他库使用，比如：
        // @umijs/hooks 的 useRequest (https://github.com/umijs/hooks)
        // swr (https://github.com/zeit/swr)
        const [data, setData] = useState<Data | null>(null)
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState<Error | null>(null)

        useEffect(() => {
            setLoading(true)
            request(requestData)
                .then(setData)
                .catch(setError)
                .finally(() => setLoading(false))
        }, [requestData])

        return { data, loading, error }
    }
}`,
            );
          }
        }

        // 写入接口代码
        const interfaceCode = outputFileList[outputFilePath].content.join('\n\n');

        // 计算request导入路径
        let importStatement = '';
        if (!syntheticalConfig.typesOnly) {
          // 获取request文件路径，如果没有配置则使用outputDir下的request.ts
          const requestFilePath = syntheticalConfig.requestFunctionFilePath
            ? syntheticalConfig.requestFunctionFilePath
            : path.join(syntheticalConfig.outputDir || DEFAULT_CONFIG.OUTPUT_DIR, 'request.ts');

          // 如果requestFunctionFilePath配置了，尝试使用alias导入
          if (requestFilePath && requestFilePath.includes('src/')) {
            // 使用alias导入，假设配置了 @/ 指向 src/
            const aliasPath = requestFilePath.replace('src/', '@/');
            importStatement = `import request from '${aliasPath.replace(path.extname(requestFilePath), '')}';\n\n`;
          } else {
            // 回退到相对路径导入
            const relativePath = path.relative(
              path.dirname(updatedOutputFilePath),
              path.dirname(requestFilePath),
            );
            importStatement = `import request from '${relativePath}/request';\n\n`;
          }
        }

        const finalContent = importStatement + interfaceCode;
        await fs.outputFile(updatedOutputFilePath, finalContent);

        return {
          outputFilePath: updatedOutputFilePath,
          requestFunctionFilePath: updatedRequestFunctionFilePath,
          requestHookMakerFilePath: updatedRequestHookMakerFilePath,
        };
      }),
    );

    // 生成 index.ts 文件
    const rootDirs = Array.from(
      new Set(
        result
          .map((item) => path.dirname(item.outputFilePath))
          .filter((dir) => {
            return !result.some((otherItem) => {
              const otherDir = path.dirname(otherItem.outputFilePath);
              return dir !== otherDir && dir.startsWith(otherDir + path.sep);
            });
          }),
      ),
    );

    // 获取outputDir配置，从第一个配置中获取
    const firstConfig = Object.values(outputFileList)[0]?.syntheticalConfig;
    const outputDir = firstConfig?.outputDir || DEFAULT_CONFIG.OUTPUT_DIR;

    await this.generateIndexFile(rootDirs, outputDir);
    return outputFileList;
  }

  async tsc(file: string) {
    return new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exec } = require('child_process');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const command = require('typescript/bin/tsc');

      exec(
        `${command} --target ES2019 --module ESNext --jsx preserve --declaration --esModuleInterop ${JSON.stringify(
          file,
        )}`,
        {
          cwd: this.options.cwd,
          env: process.env,
        },
        () => resolve(),
      );
    });
  }
}
