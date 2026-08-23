/**
 * @description Schema 中立层
 * 提供与生成无关的 OpenAPI schema 分析/提取工具，供 processors 与 generator 共用，
 * 避免两包相互依赖形成环。
 */

export * from './freeForm';
export * from './operation';
