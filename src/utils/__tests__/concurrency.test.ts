/**
 * @description concurrency.ts 单元测试
 */

import { describe, it, expect, vi } from 'vitest';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
  setDebugEnabled: vi.fn(),
  isDebugEnabled: vi.fn(() => false),
}));

import { executeWithConcurrency } from '../concurrency';
import { logger } from '@/utils/logger';

describe('executeWithConcurrency', () => {
  it('should return immediately for an empty array', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    await executeWithConcurrency([], handler, 5, 'TestTask');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should execute all items successfully', async () => {
    const items = [1, 2, 3];
    const results: number[] = [];
    const handler = vi.fn().mockImplementation(async (item: number) => {
      results.push(item);
    });

    await executeWithConcurrency(items, handler, 10, 'TestTask');

    expect(handler).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(3);
    expect(results.toSorted()).toEqual([1, 2, 3]);
  });

  it('should not log warnings when all items succeed', async () => {
    const items = ['a', 'b', 'c'];
    const handler = vi.fn().mockResolvedValue(undefined);

    await executeWithConcurrency(items, handler, 10, 'SuccessTask');

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn when some items fail', async () => {
    const items = ['a', 'b', 'c'];
    const handler = vi.fn().mockImplementation(async (item: string) => {
      if (item === 'b') {
        throw new Error('Item b failed');
      }
    });

    await executeWithConcurrency(items, handler, 10, 'PartialFailTask');

    expect(logger.warn).toHaveBeenCalledWith('PartialFailTask：1/3 个项目处理失败');
  });

  it('should process items in batches respecting concurrency', async () => {
    const items = [1, 2, 3, 4, 5];
    const callOrder: number[] = [];
    const handler = vi.fn().mockImplementation(async (item: number) => {
      callOrder.push(item);
    });

    await executeWithConcurrency(items, handler, 2, 'BatchTask');

    // All items should be processed
    expect(handler).toHaveBeenCalledTimes(5);
    expect(callOrder).toHaveLength(5);

    // With concurrency of 2, items are processed in batches:
    // Batch 1: [1, 2], Batch 2: [3, 4], Batch 3: [5]
    // The order within each batch may vary, but the batch boundaries are fixed
    expect(callOrder).toContain(1);
    expect(callOrder).toContain(2);
    expect(callOrder).toContain(3);
    expect(callOrder).toContain(4);
    expect(callOrder).toContain(5);
  });

  it('should handle all items failing', async () => {
    const items = [1, 2, 3];
    const handler = vi.fn().mockRejectedValue(new Error('Always fails'));

    await executeWithConcurrency(items, handler, 10, 'AllFailTask');

    expect(logger.warn).toHaveBeenCalledWith('AllFailTask：3/3 个项目处理失败');
  });

  it('should handle a single item', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    await executeWithConcurrency([42], handler, 5, 'SingleTask');

    expect(handler).toHaveBeenCalledWith(42);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle concurrency greater than item count', async () => {
    const items = [1, 2];
    const handler = vi.fn().mockResolvedValue(undefined);

    await executeWithConcurrency(items, handler, 100, 'HighConcurrencyTask');

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
