import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Claim = {
  id: string;
  claim: string;
  where: string;
  test: string;
  sandbox: string;
};

const claims = JSON.parse(
  readFileSync(new URL('../.factory/claims.json', import.meta.url), 'utf8'),
) as Claim[];
const claimRunner = readFileSync(new URL('./claims.mjs', import.meta.url), 'utf8');

describe('claims manifest', () => {
  it('gives every claim a unique executable tag and concrete sandbox', () => {
    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map(({ id }) => id)).size).toBe(claims.length);

    for (const claim of claims) {
      const tag = `@claim:${claim.id}`;
      expect(claim.claim.trim().length).toBeGreaterThan(0);
      expect(claim.where.trim().length).toBeGreaterThan(0);
      expect(claim.sandbox.trim().length).toBeGreaterThan(0);
      expect(claim.test).toBe(`npm run test:claims -- --grep ${tag}`);
      expect(claimRunner.split(`'${tag}'`).length - 1).toBe(1);
    }
  });
});
