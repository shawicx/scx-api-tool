/**
 * @description 并发执行工具
 * 提供带并发控制和错误处理的批量执行功能
 */

import consola from 'consola';

/**
 * @description 并发执行器
 * 带并发控制和错误处理
 * @param items 需要处理的项目数组
 * @param handler 处理函数
 * @param concurrency 并发数量
 * @param taskName 任务名称（用于日志）
 *
 * @example
 * ```typescript
 * await executeWithConcurrency(
 *   items,
 *   (item) => processItem(item),
 *   10,
 *   '处理项目'
 * );
 * ```
 */
export async function executeWithConcurrency<T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  concurrency: number,
  taskName: string,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  if (process.env.DEBUG) {
    consola.debug(`${taskName}：开始并发处理 ${items.length} 个项目，并发数：${concurrency}`);
  }

  const errors: Array<{ item: T; error: Error }> = [];
  let completed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(batch.map(async (item) => handler(item)));

    batchResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({ item: batch[index], error: result.reason });
      }
    });

    completed += batch.length;

    if (process.env.DEBUG) {
      consola.debug(`${taskName}：进度 ${completed}/${items.length}`);
    }
  }

  if (errors.length > 0) {
    consola.warn(`${taskName}：${errors.length}/${items.length} 个项目处理失败`);
    if (process.env.DEBUG) {
      errors.forEach(({ error }) => {
        consola.error(`  - ${error.message}`);
      });
    }
  } else if (process.env.DEBUG) {
    consola.success(`${taskName}：成功完成 ${items.length} 个项目`);
  }
}
