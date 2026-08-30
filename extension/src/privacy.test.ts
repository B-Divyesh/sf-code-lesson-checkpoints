import { describe, expect, it } from 'vitest';
import { redactAndCap } from './privacy';

describe('VS Code privacy preview', () => {
  it('removes environment secrets and standalone URL credentials', () => {
    const output = redactAndCap('SERVICE_TOKEN=lesson-secret\nredis://cache_user:cache_password@cache.example/0');
    expect(output).toBe('SERVICE_TOKEN=[redacted]\nredis://[redacted]@cache.example/0');
    expect(output).not.toContain('lesson-secret');
    expect(output).not.toContain('cache_password');
  });
});
