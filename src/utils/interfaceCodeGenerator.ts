/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-08-29 21:06:37
 * @Description: 接口代码生成相关的工具函数
 */
import * as changeCase from 'change-case';
import { isFunction } from 'lodash-es';
import path from 'path';
import { CommentConfig, ExtendedInterface, Interface, SyntheticalConfig } from '../types';
import {
  dedent,
  DEFAULT_CONFIG,
  getOutputFilePath,
  getRequestDataJsonSchema,
  getRequestDataTypeName,
  getRequestFunctionName,
  getResponseDataJsonSchema,
  getResponseDataTypeName,
  jsonSchemaToType,
} from './index';

export class InterfaceCodeGenerator {
  /** 生成接口代码 */
  async generateInterfaceCode(
    syntheticalConfig: SyntheticalConfig,
    interfaceInfo: Interface,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _categoryUID: string,
  ) {
    const extendedInterfaceInfo: ExtendedInterface = {
      ...interfaceInfo,
      parsedPath: path.parse(interfaceInfo.path),
    };
    const requestFunctionName = isFunction(syntheticalConfig.getRequestFunctionName)
      ? await syntheticalConfig.getRequestFunctionName?.(extendedInterfaceInfo, changeCase)
      : getRequestFunctionName(extendedInterfaceInfo as any, changeCase);
    const requestDataTypeName = isFunction(syntheticalConfig.getRequestDataTypeName)
      ? await syntheticalConfig.getRequestDataTypeName?.(extendedInterfaceInfo, changeCase)
      : getRequestDataTypeName(extendedInterfaceInfo as any, changeCase);
    const responseDataTypeName = isFunction(syntheticalConfig.getResponseDataTypeName)
      ? await syntheticalConfig.getResponseDataTypeName?.(extendedInterfaceInfo, changeCase)
      : getResponseDataTypeName(extendedInterfaceInfo as any, changeCase);

    const requestDataJsonSchema = getRequestDataJsonSchema(
      interfaceInfo as any,
      syntheticalConfig.customTypeMapping || {},
    );
    const responseDataJsonSchema = getResponseDataJsonSchema(
      interfaceInfo as any,
      syntheticalConfig.customTypeMapping || {},
      syntheticalConfig.dataKey,
    );

    // 获取缩进配置，默认为2
    const indentSize = syntheticalConfig.indentSize || DEFAULT_CONFIG.INDENT_SIZE;

    const requestDataType = await jsonSchemaToType(
      requestDataJsonSchema,
      requestDataTypeName!,
      indentSize,
    );
    const responseDataType = await jsonSchemaToType(
      responseDataJsonSchema,
      responseDataTypeName!,
      indentSize,
    );

    // 处理路径参数，将 {paramName} 格式替换为模板字符串格式
    const processPathParams = (
      pathParam: string,
    ): { processedPath: string; useTemplate: boolean; pathParamNames: string[] } => {
      // 检查是否包含路径参数
      const hasPathParams = /\{[^}]+\}/.test(pathParam);
      if (!hasPathParams) {
        return { processedPath: pathParam, useTemplate: false, pathParamNames: [] };
      }

      // 提取所有路径参数名
      const pathParamNames: string[] = [];
      const processedPath = pathParam.replace(/\{([^}]+)\}/g, (match, paramName) => {
        pathParamNames.push(paramName);
        return `\${params.${paramName}}`;
      });

      return { processedPath, useTemplate: true, pathParamNames };
    };

    // 接口注释
    const genComment = (genTitle: (title: string) => string) => {
      const {
        enabled: isEnabled = true,
        title: hasTitle = true,
        category: hasCategory = true,
        tag: hasTag = true,
        requestHeader: hasRequestHeader = true,
        extraTags,
      } = {
        ...syntheticalConfig.comment,
        // Swagger 时总是禁用标签、更新时间、链接
        ...(syntheticalConfig.serverType === 'swagger'
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
    };

    // 处理路径参数
    const { processedPath, useTemplate, pathParamNames } = processPathParams(
      extendedInterfaceInfo.path,
    );

    // 生成请求函数代码
    const generateRequestFunction = () => {
      if (syntheticalConfig.typesOnly) {
        return '';
      }

      const destructuringLine =
        pathParamNames.length > 0
          ? `const { ${pathParamNames.join(', ')}, ...requestParams } = params;`
          : '';

      const requestMethod = extendedInterfaceInfo.method.toUpperCase();
      const isGetMethod = requestMethod === 'GET';
      const requestDataKey = isGetMethod ? 'params' : 'data';
      const requestDataValue = pathParamNames.length > 0 ? 'requestParams' : 'params';

      return dedent`
        ${genComment((title) => `@description 接口 ${title} 的 **请求函数**`)}
        export const ${requestFunctionName || 'ErrorRequestFunctionName'} = (params: ${requestDataTypeName!}) => {
          ${destructuringLine}${destructuringLine ? '\n' : ''}return request(
            ${useTemplate ? `\`${processedPath}\`` : JSON.stringify(processedPath)},
            {
              method: '${requestMethod}',
              ${requestDataKey}: ${requestDataValue}
            }
          );
        };
      `;
    };

    const code = `${genComment((title) => `@description 接口 ${title} 的 **请求类型**`)}
${requestDataType.trim()}

${genComment((title) => `@description 接口 ${title} 的 **返回类型**`)}
${responseDataType.trim()}

${generateRequestFunction()}`;

    const outputFilePath = getOutputFilePath(
      interfaceInfo as any,
      changeCase,
      syntheticalConfig.outputDir,
    );

    return {
      outputFilePath,
      code,
    };
  }
}
