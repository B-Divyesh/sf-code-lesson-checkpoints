import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Deployment = {
  artifactClass: string;
  publicUrl: string;
  registry: string;
  imageRepository: string;
  targetPort: number;
  activeRevisionsMode: string;
  scale: { minReplicas: number; maxReplicas: number };
  postgres: {
    keyVault: string;
    migrationKeyVaultSecret: string;
    keyVaultSecret: string;
    containerSecret: string;
    schema: string;
  };
  coherenceProbe: { cycles: number; minimumDistinctReplicas: number };
};

const deployment = JSON.parse(
  readFileSync(new URL('../deployment/container-app.json', import.meta.url), 'utf8'),
) as Deployment;
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const deploymentScript = readFileSync(new URL('../scripts/apply-deployment-contract.sh', import.meta.url), 'utf8');
const releaseScript = readFileSync(new URL('../scripts/deploy-release.sh', import.meta.url), 'utf8');
const coherenceScript = readFileSync(new URL('../tests/live-coherence.mjs', import.meta.url), 'utf8');
const postgresCoherenceScript = readFileSync(new URL('../tests/postgres-replica-coherence.mjs', import.meta.url), 'utf8');
const extensionManifest = JSON.parse(
  readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'),
) as { repository?: { url?: string }; files?: string[] };
const extensionLicense = readFileSync(new URL('../extension/LICENSE', import.meta.url), 'utf8');

describe('shared PostgreSQL container deployment contract', () => {
  it('uses a product-owned shared PostgreSQL schema for every replica', () => {
    expect(deployment.artifactClass).toBe('web-with-backend');
    expect(deployment.targetPort).toBe(8080);
    expect(deployment.activeRevisionsMode).toBe('Single');
    expect(deployment.scale).toEqual({ minReplicas: 3, maxReplicas: 3 });
    expect(deployment.postgres).toEqual({
      keyVault: 'sociobot-keyvault1',
      migrationKeyVaultSecret: 'sociobot-db-migration-url',
      keyVaultSecret: 'sociobot-db-runtime-url',
      containerSecret: 'code-lesson-checkpoints-database-url',
      schema: 'code_lesson_checkpoints',
    });
    expect(deployment.coherenceProbe).toEqual({ cycles: 4, minimumDistinctReplicas: 2 });
  });

  it('keeps the image self-starting while production injects only a secret reference', () => {
    expect(dockerfile).toContain('FROM rust:1-slim');
    expect(dockerfile).not.toMatch(/FROM rust:1\.\d+/);
    expect(dockerfile).not.toContain('DATABASE_URL=');
    expect(dockerfile).not.toContain('VOLUME ["/data"]');
    expect(dockerfile).toContain('EXPOSE 8080');
  });

  it('applies and reads back the PostgreSQL secret, replica count, and no-local-volume boundary', () => {
    expect(deploymentScript).toContain('az keyvault secret show');
    expect(deploymentScript).toContain('az containerapp secret set');
    expect(deploymentScript).toContain('secretRef:$containerSecret');
    expect(deploymentScript).toContain('az rest');
    expect(deploymentScript).toContain('maxReplicas:$maxReplicas');
    expect(deploymentScript).toContain('replica_count');
    expect(deploymentScript).toContain('(.properties.template.volumes // []) | length == 0');
    expect(deploymentScript).toContain('.secretRef == $secret');
    expect(deploymentScript).toContain('.properties.latestRevisionName == .properties.latestReadyRevisionName');
  });

  it('makes an image release restart and prove shared-state coherence across replicas', () => {
    expect(deployment.publicUrl).toBe('https://code-lesson-checkpoints.sociobot.in');
    expect(deployment.registry).toBe('sociobotregistry');
    expect(deployment.imageRepository).toBe('sf-code-lesson-checkpoints');
    expect(releaseScript).toContain('az acr build');
    expect(releaseScript).toContain('migrate-postgres.sh');
    expect(releaseScript).toContain('test:postgres-coherence');
    expect(releaseScript).toContain('apply-deployment-contract.sh" "$image"');
    expect(releaseScript).toContain('Revision persistence canary');
    expect(releaseScript).toContain('az containerapp revision restart');
    expect(releaseScript).toContain('COHERENCE_CYCLES');
    expect(releaseScript).toContain('MINIMUM_DISTINCT_REPLICAS');
    expect(releaseScript).toContain('EXPECTED_BUILD_SHA');
    expect(coherenceScript).toContain('X-Forwarded-For');
    expect(coherenceScript).toContain('x-checkpoint-replica');
    expect(coherenceScript).toContain('for (let cycle = 1; cycle <= cycles; cycle += 1)');
    expect(coherenceScript).toContain('authorized deletion');
    expect(postgresCoherenceScript).toContain('cross-process authorized delete');
    expect(postgresCoherenceScript).toContain('for (let cycle = 0; cycle < 4; cycle += 1)');
  });

  it('ships repository and license metadata in the extension package', () => {
    expect(extensionManifest.repository?.url).toBe(
      'https://github.com/B-Divyesh/sf-code-lesson-checkpoints.git',
    );
    expect(extensionManifest.files).toContain('LICENSE');
    expect(extensionLicense).toContain('Permission is hereby granted, free of charge');
  });
});
