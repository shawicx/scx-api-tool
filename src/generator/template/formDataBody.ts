/**
 * @description FormData 请求体序列化片段
 * 为模板提供统一的「参数对象 → FormData」转换代码，正确处理：
 * - File/Blob 单值（File 是 Blob 的子类型，统一用 instanceof Blob 判断）
 * - File[]/Blob[] 数组（逐个 append，同名键重复，符合 multipart 数组惯例）
 * - 普通对象（JSON.stringify 序列化后 append，避免 "[object Object]"）
 * - null/undefined 可选字段（跳过，避免序列化成 "undefined" 字符串）
 * - 基础类型（String() 转换）
 *
 * 该片段被 templateDefinitions.ts（config 风格内联）与
 * templatePartials.ts（method-specific 风格语句）共用，防止两处实现漂移。
 */

/**
 * @description 构建 FormData append 的分支逻辑代码行（作为 forEach 回调体）
 * @param keyVar 键名变量（如 'k' 或 'key'）
 * @param valVar 值变量（如 'v' 或 'value'）
 * @param formVar FormData 变量名（如 'fd' 或 'formData'）
 * @param indent 行首缩进（嵌套层级额外 +2 空格）
 * @returns 分支逻辑代码行数组
 */
function buildAppendBranchLines(
  keyVar: string,
  valVar: string,
  formVar: string,
  indent = '',
): string[] {
  const inner = `${indent}  `;
  return [
    `${indent}if (${valVar} === null || ${valVar} === undefined) return;`,
    `${indent}if (Array.isArray(${valVar})) {`,
    `${inner}${valVar}.forEach((item) => ${formVar}.append(${keyVar}, item instanceof Blob ? item : String(item)));`,
    `${indent}} else if (${valVar} instanceof Blob) {`,
    `${indent}${formVar}.append(${keyVar}, ${valVar});`,
    `${indent}} else if (typeof ${valVar} === 'object') {`,
    `${indent}${formVar}.append(${keyVar}, JSON.stringify(${valVar}));`,
    `${indent}} else {`,
    `${indent}${formVar}.append(${keyVar}, String(${valVar}));`,
    `${indent}}`,
  ];
}

/**
 * @description 生成 config 风格的 FormData 内联表达式（IIFE，单行）
 * 用于模板中 `data: <表达式>,` 的赋值位置
 * @param requestParamName 参数对象变量名（可传 Handlebars 占位符 '{{requestParamName}}'）
 * @returns 内联 IIFE 表达式代码字符串
 *
 * @example
 * ```typescript
 * getFormDataInlineExpression('params');
 * // => (() => { const fd = new FormData(); Object.entries(params).forEach(([k, v]) => { ... }); return fd; })()
 * ```
 */
export function getFormDataInlineExpression(requestParamName: string): string {
  const branches = buildAppendBranchLines('k', 'v', 'fd').join(' ');
  return `(() => { const fd = new FormData(); Object.entries(${requestParamName}).forEach(([k, v]) => { ${branches} }); return fd; })()`;
}

/**
 * @description 生成 method-specific 风格的 FormData 构造语句块（多行，2 空格基准缩进）
 * 用于函数体内先构造 formData 再传给请求方法调用的场景
 * @param requestParamName 参数对象变量名（可传 Handlebars 占位符 '{{requestParamName}}'）
 * @returns 多行语句代码字符串（以 const formData = ... 开头）
 *
 * @example
 * ```typescript
 * getFormDataStatements('params');
 * // =>   const formData = new FormData();
 * //      Object.entries(params).forEach(([key, value]) => { ... });
 * ```
 */
export function getFormDataStatements(requestParamName: string): string {
  return [
    '  const formData = new FormData();',
    `  Object.entries(${requestParamName}).forEach(([key, value]) => {`,
    ...buildAppendBranchLines('key', 'value', 'formData', '    '),
    '  });',
  ].join('\n');
}
