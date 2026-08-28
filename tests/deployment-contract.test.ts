import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Deployment = {
  artifactClass: string;
  targetPort: number;
  scale: { minReplicas: number; maxReplicas: number };
  sqlite: {
    databaseUrl: string;
    mountPath: string;
    volumeName: string;
    storageType: string;
    storageName: string;
  };
};

const deployment = JSON.parse(
  readFileSync(new URL('../deployment/container-app.json', import.meta.url), 'utf8'),
) as Deployment;
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');

describe('SQLite container deployment contract', () => {
  it('uses one durable writer instead of per-replica databases', () => {
    expect(deployment.artifactClass).toBe('web-with-backend');
    expect(deployment.targetPort).toBe(8080);
    expect(deployment.scale).toEqual({ minReplicas: 1, maxReplicas: 1 });
    expect(deployment.sqlite).toMatchObject({
      databaseUrl: 'sqlite:///data/checkpoints.db?mode=rwc',
      mountPath: '/data',
      volumeName: 'lesson-data',
      storageType: 'AzureFile',
    });
    expect(deployment.sqlite.storageName).not.toBe('');
  });

  it('keeps the image runtime aligned with the durable mount contract', () => {
    expect(dockerfile).toContain('DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc');
    expect(dockerfile).toContain('VOLUME ["/data"]');
    expect(dockerfile).toContain('EXPOSE 8080');
  });
});
