/**
 * @description 客户端基础模块导出
 */

export { BaseClient } from './BaseClient';
export type { ClientMetadata, ClientOptions, FetchResult, AttemptFailure } from './BaseClient';
export { clientRegistry, resolveClientOptions } from './registry';
