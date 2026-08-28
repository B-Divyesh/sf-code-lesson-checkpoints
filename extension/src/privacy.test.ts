import { describe, expect, it } from 'vitest';
import { redactAndCap } from './privacy';

describe('VS Code privacy preview', () => {
  it('removes connection-string environment values and standalone URL credentials', () => {
    const output = redactAndCap('DATABASE_URL=postgres://qa_user:qa_password@db.example/private\nredis://cache_user:cache_password@cache.example/0');
    expect(output).toBe('DATABASE_URL=[redacted]\nredis://[redacted]@cache.example/0');
    expect(output).not.toContain('qa_password');
    expect(output).not.toContain('cache_password');
  });
});
