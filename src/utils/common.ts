/*
 * @Author: shawicx d35f3153@proton.me
 * @Description:
 */
/**
 * @description 抛出错误。
 * @param msg 错误信息
 */
export function throwError(...msg: string[]): never {
  /* istanbul ignore next */
  throw new Error(msg.join(''));
}

/**
 * @description 根据权重排序。
 * @param list 列表
 * @returns 排序后的列表
 */
export function sortByWeights<T extends { weights: number[] }>(list: T[]): T[] {
  list.sort((a, b) => {
    const x = a.weights.length > b.weights.length ? b : a;
    const minLen = Math.min(a.weights.length, b.weights.length);
    const maxLen = Math.max(a.weights.length, b.weights.length);

    x.weights.push(...new Array(maxLen - minLen).fill(0));
    const weightDiff = a.weights.reduce((weight, _, i) => {
      if (weight === 0) {
        // eslint-disable-next-line no-param-reassign
        weight = a.weights[i] - b.weights[i];
      }
      return weight;
    }, 0);
    return weightDiff;
  });
  return list;
}
