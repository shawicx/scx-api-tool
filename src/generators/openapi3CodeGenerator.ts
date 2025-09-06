/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: OpenAPI 3.0 代码生成器
 */
import { castArray, groupBy, last, uniq, values } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';
import { processOpenAPI3Data } from '../processors/openapi3Processor';
import {
  CommentConfig,
  ExtendedInterface,
  OutputFileList,
  ProjectConfig,
  RequestFunctionConfig,
  ServerConfig,
  SyntheticalConfig,
} from '../types';
import { httpGet } from '../utils/http';
import { sortByWeights } from '../utils/index';
import { InterfaceCodeGenerator } from '../utils/interfaceCodeGenerator';
import { dedent } from '../utils/string';

/**
 * 处理路径参数，将 {paramName} 格式替换为模板字符串格式
 * @param pathParam 路径参数
 * @returns 处理后的路径和是否使用模板字符串
 */
export function processPathParams(pathParam: string): {
  processedPath: string;
  useTemplate: boolean;
  pathParamNames: string[];
} {
  // 检查是否包含路径参数
  const hasPathParams = /\{[^}]+\}/.test(pathParam);
  if (!hasPathParams) {
    return { processedPath: pathParam, useTemplate: false, pathParamNames: [] };
  }
  // 匹配 {paramName} 格式的路径参数
  const pathParamNames: string[] = [];
  const processedPath = pathParam.replace(/\{([^}]+)\}/g, (match, paramName) => {
    pathParamNames.push(paramName);
    return `\${params.${paramName}}`;
  });
  return { processedPath, useTemplate: true, pathParamNames };
}

/**
 * 生成接口注释
 * @param extendedInterfaceInfo 扩展的接口信息
 * @param syntheticalConfig 综合配置
 * @param genTitle 标题生成函数
 * @returns 生成的注释字符串
 */
export function generateInterfaceComment(
  extendedInterfaceInfo: ExtendedInterface,
  syntheticalConfig: any,
  genTitle: (title: string) => string,
): string {
  const {
    enabled: isEnabled = true,
    title: hasTitle = true,
    category: hasCategory = true,
    tag: hasTag = true,
    requestHeader: hasRequestHeader = true,
    extraTags,
  } = {
    ...syntheticalConfig.comment,
    // OpenAPI 3.0 时总是禁用标签、更新时间、链接
    ...(syntheticalConfig.serverType === 'swagger' || syntheticalConfig.serverType === 'apifox'
      ? {
          tag: false,
          updateTime: false,
          link: false,
        }
      : {}),
  } satisfies CommentConfig;

  if (!isEnabled) {
    return '';
  }

  // 转义标题中的 /
  const description = String(extendedInterfaceInfo.title).replace(/\//g, '\\/');

  const summary: Array<
    | false
    | {
        label: string;
        value: string | string[];
      }
  > = [
    hasCategory && {
      label: 'category',
      value: extendedInterfaceInfo._category.name,
    },
    hasTag && {
      label: 'tags',
      value: extendedInterfaceInfo.tag.map((tag) => `${tag}`).join('/'),
    },
    hasRequestHeader && {
      label: 'method',
      value: `${extendedInterfaceInfo.method.toUpperCase()}`,
    },
    hasRequestHeader && {
      label: 'path',
      value: `${extendedInterfaceInfo.path}`,
    },
  ];

  if (typeof extraTags === 'function') {
    const tags = extraTags(extendedInterfaceInfo);
    for (const tag of tags) {
      (tag.position === 'start' ? summary.unshift : summary.push).call(summary, {
        label: tag.name,
        value: tag.value,
      });
    }
  }

  const titleComment = hasTitle
    ? dedent`
        * ${genTitle(description)}
      `
    : '';

  const extraComment: string = summary
    .filter((item) => typeof item !== 'boolean' && item.value)
    .map((item) => {
      const _item: Exclude<(typeof summary)[0], boolean> = item as any;
      return `* @${_item.label} ${Array.isArray(_item.value) ? _item.value.join(', ') : _item.value}`;
    })
    .join('\n');

  return dedent`
    /**
     ${[titleComment, extraComment].filter(Boolean).join('\n')}
     */
  `;
}

export function generateRequestFunction(config: RequestFunctionConfig): string {
  const { name, type, path: apiPath, method, useTemplate } = config;
  const isGetMethod = method.toUpperCase() === 'GET';
  const requestBodyKey = isGetMethod ? 'params' : 'data';
  const pathString = useTemplate ? `\`${apiPath}\`` : JSON.stringify(apiPath);

  return dedent`
    export const ${name} = (params: ${type}) => {
      return request(
        ${pathString},
        {
          method: '${method.toUpperCase()}',
          ${requestBodyKey}: params
        }
      );
    };`;
}

/**
 * 生成完整的接口代码
 * @param requestDataType 请求数据类型代码
 * @param responseDataType 响应数据类型代码
 * @param requestFunctionCode 请求函数代码
 * @param typesOnly 是否只生成类型
 * @returns 完整的接口代码
 */
export function generateCompleteInterfaceCode(
  requestDataType: string,
  responseDataType: string,
  requestFunctionCode: string,
  typesOnly = false,
): string {
  const parts = [requestDataType.trim(), responseDataType.trim()];

  if (!typesOnly) {
    parts.push(requestFunctionCode);
  }

  return parts.join('\n\n');
}

/**
 * 生成缩进字符串
 * @param size 缩进大小
 * @returns 缩进字符串
 */
export function generateIndent(size: number): string {
  return ' '.repeat(size);
}

export class OpenAPI3CodeGenerator {
  constructor(
    private interfaceCodeGenerator: InterfaceCodeGenerator,
    private options: { cwd: string } = { cwd: process.cwd() },
  ) {}

  async generate(config: ServerConfig[]): Promise<OutputFileList> {
    const outputFileList: OutputFileList = Object.create(null);

    await Promise.all(
      config.map(async (serverConfig, serverIndex) => {
        const projectConfigs = serverConfig.projects.reduce<ProjectConfig[]>((acc, project) => {
          // 确保 token 是字符串而不是数组
          const tokens = Array.isArray(project.token) ? project.token : [project.token];
          tokens.forEach((token) => {
            acc.push({
              ...project,
              token, // 现在 token 一定是字符串类型
            });
          });
          return acc;
        }, []);

        return Promise.all(
          projectConfigs.map(async (projectConfig, projectIndex) => {
            // 获取 OpenAPI 3.0 数据
            let openApiData: OpenAPIV3.Document;

            if (serverConfig.serverType === 'apifox') {
              // 从 Apifox 获取 OpenAPI 3.0 数据
              const { fetchApifoxOpenAPI } = await import('../clients/apifox');
              // 确保 token 是字符串类型
              const token = Array.isArray(projectConfig.token)
                ? projectConfig.token[0]
                : projectConfig.token;
              openApiData = await fetchApifoxOpenAPI({
                serverUrl: serverConfig.serverUrl,
                token,
                projectId: serverConfig.apifoxProjectId || '',
              });
            } else {
              // 从 URL 获取 OpenAPI 3.0 数据
              openApiData = await httpGet<OpenAPIV3.Document>(serverConfig.serverUrl);
            }

            // 处理 OpenAPI 3.0 数据
            const { cats: categoryList, interfaces: interfaceList } =
              await processOpenAPI3Data(openApiData);

            await Promise.all(
              projectConfig.categories.map(async (categoryConfig, categoryIndex) => {
                // 分类处理
                // 数组化
                let categoryIds = castArray(categoryConfig.id);
                // 全部分类
                if (categoryIds.includes(0)) {
                  const cats = Array.isArray(categoryList) ? categoryList : [];
                  categoryIds.push(...cats.map((cat) => cat._id));
                }
                // 唯一化
                categoryIds = uniq(categoryIds);
                // 去掉被排除的分类
                const excludedCategoryIds = categoryIds.filter((id) => id < 0).map(Math.abs);
                categoryIds = categoryIds.filter(
                  (id) => !excludedCategoryIds.includes(Math.abs(id)),
                );
                // 删除不存在的分类
                const cats = Array.isArray(categoryList) ? categoryList : [];
                categoryIds = categoryIds.filter((id) => !!cats.find((cat) => cat._id === id));
                // 顺序化
                categoryIds = categoryIds.sort();

                const codes = (
                  await Promise.all(
                    categoryIds.map<
                      Promise<
                        Array<{
                          outputFilePath: string;
                          code: string;
                          weights: number[];
                        }>
                      >
                    >(async (id, categoryIndex2) => {
                      const updatedCategoryConfig = {
                        ...categoryConfig,
                        id,
                      };

                      // 构建综合配置
                      const syntheticalConfig: SyntheticalConfig = {
                        ...serverConfig,
                        ...projectConfig,
                        ...updatedCategoryConfig,
                        mockUrl: '', // OpenAPI 3.0 不需要 mockUrl
                      };

                      syntheticalConfig.target = syntheticalConfig.target || 'typescript';
                      syntheticalConfig.devUrl = '';
                      syntheticalConfig.prodUrl = '';

                      // 过滤当前分类的接口
                      const categoryInterfaceList = interfaceList.filter(
                        (interfaceInfo) => interfaceInfo.catid === id,
                      );

                      const interfaceCodes = await Promise.all(
                        categoryInterfaceList.map(async (interfaceInfo) => {
                          const categoryUID = `${serverConfig.serverUrl}_${projectConfig.token}_${id}`;
                          const { outputFilePath, code } =
                            await this.interfaceCodeGenerator.generateInterfaceCode(
                              syntheticalConfig,
                              interfaceInfo,
                              categoryUID,
                            );
                          const _filePath = path.relative(this.options.cwd, outputFilePath);
                          const weights = [
                            serverIndex,
                            projectIndex,
                            categoryIndex,
                            categoryIndex2,
                          ];
                          return {
                            categoryUID,
                            outputFilePath,
                            weights,
                            code,
                            // 相对路径
                            relativeFilePath: _filePath,
                          };
                        }),
                      );

                      const groupedInterfaceCodes = groupBy(
                        interfaceCodes,
                        (item) => item.outputFilePath,
                      );
                      return Object.keys(groupedInterfaceCodes).map((outputFilePath) => {
                        const categoryCode = groupedInterfaceCodes[outputFilePath]
                          .map((item) => item.code)
                          .filter(Boolean)
                          .join('\n\n');
                        if (!outputFileList[outputFilePath]) {
                          outputFileList[outputFilePath] = {
                            syntheticalConfig,
                            content: [],
                            requestFunctionFilePath: syntheticalConfig.requestFunctionFilePath
                              ? path.resolve(
                                  this.options.cwd,
                                  syntheticalConfig.requestFunctionFilePath,
                                )
                              : path.resolve(
                                  this.options.cwd,
                                  syntheticalConfig.outputDir || 'service',
                                  'request.ts',
                                ),
                            requestHookMakerFilePath: (() => {
                              if (!syntheticalConfig.reactHooks?.enabled) {
                                return '';
                              }
                              if (syntheticalConfig.reactHooks.requestHookMakerFilePath) {
                                return path.resolve(
                                  this.options.cwd,
                                  syntheticalConfig.reactHooks.requestHookMakerFilePath,
                                );
                              }
                              return path.join(path.dirname(outputFilePath), 'makeRequestHook.ts');
                            })(),
                          };
                        }
                        return {
                          outputFilePath,
                          code: categoryCode,
                          weights: last(sortByWeights(groupedInterfaceCodes[outputFilePath]))!
                            .weights,
                        };
                      });
                    }),
                  )
                ).flat();

                for (const groupedCodes of values(
                  groupBy(codes, (item: any) => item.outputFilePath),
                )) {
                  sortByWeights(groupedCodes);
                  outputFileList[groupedCodes[0].outputFilePath].content.push(
                    ...groupedCodes.map((item: any) => item.code),
                  );
                }
              }),
            );
          }),
        );
      }),
    );

    return outputFileList;
  }
}
