import { describe, expect, it } from 'vitest';
import { normalizeShareCode, redactOutput } from './privacy';

describe('privacy helpers', () => {
  it('redacts common secrets before sharing', () => {
    const result = redactOutput('API_KEY=keep-me-safe\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz');
    expect(result.text).not.toContain('keep-me-safe');
    expect(result.text).not.toContain('abcdefghijklmnopqrstuvwxyz');
    expect(result.redactions).toBe(2);
  });

  it('redacts environment secrets and URL credentials', () => {
    const result = redactOutput('SERVICE_TOKEN=lesson-secret\nconnect redis://cache_user:cache_password@cache.example/0');
    expect(result.text).toBe('SERVICE_TOKEN=[redacted]\nconnect redis://[redacted]@cache.example/0');
    expect(result.text).not.toContain('lesson-secret');
    expect(result.text).not.toContain('cache_password');
    expect(result.redactions).toBe(2);
  });

  it('normalizes codes pasted with punctuation', () => {
    expect(normalizeShareCode('ab-12 cd')).toBe('AB12CD');
  });

  it('caps shared output', () => {
    const result = redactOutput('x'.repeat(20), 10);
    expect(result.trimmed).toBe(true);
    expect(result.text).toContain('[output trimmed]');
  });
});
