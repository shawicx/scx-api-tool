/**
 * @description 请求绑定生成模块
 * 根据 OpenAPI 参数来源生成函数内解构、Axios data/params 与请求选项代码片段
 */

import type { RequestParameterGroups } from './requestParameters';
import { getFormDataInlineExpression } from './template/formDataBody';

/** 请求绑定生成输入 */
export interface RequestBindingInput {
  requestParamName: string;
  groups: RequestParameterGroups;
  hasBody: boolean;
  isJavaScript: boolean;
  path: string;
  method: string;
  responseTypeName: string;
  requestMethodsObjectName: string;
}

/** 请求绑定生成结果 */
export interface RequestBinding {
  requestOptionsParam: string;
  destructureStatement: string;
  methodOptionsStatement: string;
  dataExpression: string;
  paramsExpression: string;
  methodOptionsExpression: string;
  methodCallExpression: string;
  requestConfigFields: string;
  configDeclaration: string;
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * @description 去掉 sanitizePropertyName 添加的外层引号
 * @param name 属性名
 * @returns 原始属性名
 */
function parsePropertyName(name: string): string {
  return name.replace(/^'(.*)'$/, '$1');
}

/**
 * @description 创建参数解构与对象字面量条目
 * @param properties 参数属性列表
 * @returns 含原始键名、合法别名与解构片段的条目列表
 */
function createBindingEntries(properties: RequestParameterGroups['queryProperties']) {
  const aliases = new Set<string>();
  return properties.map((property) => {
    const bareName = parsePropertyName(property.name);
    if (IDENTIFIER_RE.test(property.name)) {
      return { key: property.name, alias: property.name, destructure: property.name };
    }

    const baseAlias = bareName.replace(/[^A-Za-z0-9_$]/g, '_');
    let alias = baseAlias;
    let suffix = 1;
    while (aliases.has(alias)) {
      alias = `${baseAlias}${suffix}`;
      suffix += 1;
    }
    aliases.add(alias);
    return {
      key: `'${bareName}'`,
      alias,
      destructure: `'${bareName}': ${alias}`,
    };
  });
}

/**
 * @description 拼接 Axios params 对象字面量内容
 * @param entries 参数绑定条目
 * @returns 对象字面量内部字符串
 */
function joinEntries(entries: Array<{ key: string; alias: string }>): string {
  return entries
    .map((entry) => (entry.key === entry.alias ? entry.alias : `${entry.key}: ${entry.alias}`))
    .join(', ');
}

/**
 * @description 选择不与非 body 参数别名冲突的 rest 变量名
 * @param entries 非 body 参数绑定条目
 * @returns 合法的 rest 变量名
 */
function getRestVariableName(entries: Array<{ alias: string }>): string {
  const aliases = new Set(entries.map((entry) => entry.alias));
  return ['body', 'bodyParams', 'requestBody'].find((name) => !aliases.has(name)) || 'bodyValue';
}

/**
 * @description 构造 raw binary 请求的 method-specific 选项
 * @param groups 请求参数分组
 * @returns 选项构造语句与调用表达式
 */
function buildMethodOptions(groups: RequestParameterGroups): {
  statement: string;
  expression: string;
} {
  if (groups.requestBodyKind !== 'binary') {
    return { statement: '', expression: 'options' };
  }

  return {
    statement: [
      'const requestOptions = {',
      '  ...options,',
      '  headers: {',
      '    ...options.headers,',
      "    'Content-Type': 'application/octet-stream',",
      '  },',
      '}',
    ].join('\n'),
    expression: 'requestOptions',
  };
}

/**
 * @description 生成接口函数的请求绑定代码片段
 * @param input 请求绑定输入
 * @returns 请求绑定代码片段
 *
 * @example
 * ```typescript
 * buildRequestBinding({
 *   requestParamName: 'params',
 *   groups,
 *   hasBody: true,
 *   isJavaScript: false,
 *   path: "'/api/users'",
 *   method: 'POST',
 *   responseTypeName: 'User',
 *   requestMethodsObjectName: 'requestMethods',
 * });
 * ```
 */
export function buildRequestBinding(input: RequestBindingInput): RequestBinding {
  const { requestParamName, groups, hasBody, isJavaScript } = input;
  const nonBodyProperties = [...groups.pathProperties, ...groups.queryProperties];
  const entries = createBindingEntries(groups.queryProperties);
  const nonBodyEntries = createBindingEntries(nonBodyProperties);
  const needsBodyDestructure = hasBody && nonBodyProperties.length > 0;
  const needsQueryDestructure = !hasBody && groups.pathProperties.length > 0 && entries.length > 0;
  const restVariableName = getRestVariableName(nonBodyEntries);

  let destructureStatement = '';
  if (needsBodyDestructure) {
    destructureStatement = `const { ${nonBodyEntries
      .map((entry) => entry.destructure)
      .join(', ')}, ...${restVariableName} } = ${requestParamName};`;
  } else if (needsQueryDestructure) {
    destructureStatement = `const { ${nonBodyEntries
      .map((entry) => entry.destructure)
      .join(', ')} } = ${requestParamName};`;
  }

  const requestBodyVariable = needsBodyDestructure ? restVariableName : requestParamName;
  let dataExpression = 'undefined';
  if (hasBody) {
    if (groups.requestBodyKind === 'binary') {
      dataExpression = `${requestBodyVariable}.${groups.rawBodyPropertyName}`;
    } else if (groups.requestBodyKind === 'multipart') {
      dataExpression = getFormDataInlineExpression(requestBodyVariable);
    } else {
      dataExpression = requestBodyVariable;
    }
  }

  let paramsExpression = 'undefined';
  if (groups.queryProperties.length > 0) {
    if (!hasBody && groups.pathProperties.length === 0) {
      paramsExpression = requestParamName;
    } else {
      paramsExpression = `{ ${joinEntries(entries)} }`;
    }
  }

  const methodOptions = buildMethodOptions(groups);
  const canHaveBody = ['post', 'put', 'patch'].includes(input.method.toLowerCase());
  const methodCallArguments = canHaveBody
    ? [dataExpression, paramsExpression, methodOptions.expression]
    : [paramsExpression, methodOptions.expression];
  const methodCallExpression = `${input.requestMethodsObjectName}.${input.method.toLowerCase()}<${input.responseTypeName}>(${[
    input.path,
    ...methodCallArguments,
  ].join(', ')})`;

  const configFields = [
    hasBody ? `data: ${dataExpression},` : '',
    paramsExpression !== 'undefined' ? `params: ${paramsExpression},` : '',
    groups.requestBodyKind === 'binary'
      ? "headers: { ...options.headers, 'Content-Type': 'application/octet-stream' }"
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    requestOptionsParam: isJavaScript
      ? 'options = {}'
      : "options: Omit<RequestConfig, 'url' | 'method' | 'data' | 'params'> = {}",
    destructureStatement,
    methodOptionsStatement: methodOptions.statement,
    dataExpression,
    paramsExpression,
    methodOptionsExpression: methodOptions.expression,
    methodCallExpression,
    requestConfigFields: configFields,
    configDeclaration: isJavaScript ? 'const config = {' : 'const config: RequestConfig = {',
  };
}
