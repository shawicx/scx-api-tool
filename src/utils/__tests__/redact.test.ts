/**
 * @description redact.ts 单元测试
 * 验证 token / config / headers 的脱敏行为
 */

import { describe, it, expect } from 'vitest';
import { redactToken, redactConfig, redactHeaders } from '../redact';

describe('redactToken', () => {
  it('应原样返回 undefined', () => {
    expect(redactToken(undefined)).toBeUndefined();
  });

  it('应原样返回空字符串', () => {
    expect(redactToken('')).toBe('');
  });

  it('应将短 token（<=8）全量遮蔽为 ***', () => {
    expect(redactToken('abc')).toBe('***');
    expect(redactToken('12345678')).toBe('***');
  });

  it('应保留首尾各 4 位，中间以 **** 替换', () => {
    const result = redactToken('sk-abcdefghijklmn');
    expect(result).toBe('sk-a****klmn');
  });

  it('脱敏后不应包含完整的原始 token', () => {
    const token = 'sk-supersecrettoken1234567890';
    const result = redactToken(token);
    expect(result).not.toContain(token);
    expect(result).toContain('****');
  });

  it('对刚好超过最小长度的 token 应保留片段', () => {
    // 长度 9：前 4 + **** + 后 4，但前缀和后缀会重叠 —— 结果仍应遮蔽中间
    const result = redactToken('123456789');
    expect(result).not.toBe('123456789');
    expect(result).toContain('****');
  });
});

describe('redactConfig', () => {
  it('应对 config.token 脱敏，其他字段保持不变', () => {
    const config = {
      source: 'https://api.example.com',
      token: 'sk-abcdefghijklmn',
      timeout: 30000,
    };
    const result = redactConfig(config);
    expect(result.source).toBe(config.source);
    expect(result.timeout).toBe(config.timeout);
    expect(result.token).toBe('sk-a****klmn');
  });

  it('不应修改原对象', () => {
    const config = { token: 'sk-abcdefghijklmn' };
    redactConfig(config);
    expect(config.token).toBe('sk-abcdefghijklmn');
  });

  it('当 token 为 undefined 时应保持 undefined', () => {
    const config = { source: 'https://api.example.com' };
    const result = redactConfig(config);
    expect(result.token).toBeUndefined();
  });
});

describe('redactHeaders', () => {
  it('应对 Authorization Bearer 头脱敏凭证', () => {
    const headers = {
      Authorization: 'Bearer sk-abcdefghijklmn',
      'Content-Type': 'application/json',
    };
    const result = redactHeaders(headers);
    expect(result.Authorization).toBe('Bearer sk-a****klmn');
    expect(result['Content-Type']).toBe('application/json');
  });

  it('应保留 Bearer 前缀以便识别认证方式', () => {
    const headers = { Authorization: 'Bearer sk-supersecrettoken12345' };
    const result = redactHeaders(headers);
    expect(result.Authorization).toMatch(/^Bearer\s/);
  });

  it('脱敏后不应包含完整的原始凭证', () => {
    const credential = 'sk-supersecrettoken12345';
    const headers = { Authorization: `Bearer ${credential}` };
    const result = redactHeaders(headers);
    expect(result.Authorization).not.toContain(credential);
  });

  it('当无 Authorization 头时应原样返回其他字段', () => {
    const headers = { 'Content-Type': 'application/json', Connection: 'keep-alive' };
    const result = redactHeaders(headers);
    expect(result).toEqual(headers);
  });

  it('不应修改原对象', () => {
    const headers = { Authorization: 'Bearer sk-abcdefghijklmn' };
    redactHeaders(headers);
    expect(headers.Authorization).toBe('Bearer sk-abcdefghijklmn');
  });

  it('应处理小写 authorization 头', () => {
    const headers = { authorization: 'Bearer sk-abcdefghijklmn' };
    const result = redactHeaders(headers);
    expect(result.authorization).toBe('Bearer sk-a****klmn');
  });

  it('应对非 Bearer 格式的 Authorization 头整体脱敏', () => {
    const headers = { Authorization: 'Basic sk-supersecrettoken12345' };
    const result = redactHeaders(headers);
    // 非 Bearer 格式，整体作为凭证脱敏
    expect(result.Authorization).not.toContain('supersecret');
    expect(result.Authorization).toContain('****');
  });
});
