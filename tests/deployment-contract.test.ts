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
const deploymentScript = readFileSync(new URL('../scripts/apply-deployment-contract.sh', import.meta.url), 'utf8');
const releaseScript = readFileSync(new URL('../scripts/deploy-release.sh', import.meta.url), 'utf8');
const extensionManifest = JSON.parse(
  readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'),
) as { repository?: { url?: string }; files?: string[] };
const extensionLicense = readFileSync(new URL('../extension/LICENSE', import.meta.url), 'utf8');

describe('SQLite container deployment contract', () => {
  it('uses one durable writer instead of per-replica databases', () => {
    expect(deployment.artifactClass).toBe('web-with-backend');
    expect(deployment.targetPort).toBe(8080);
    expect(deployment.activeRevisionsMode).toBe('Single');
    expect(deployment.scale).toEqual({ minReplicas: 1, maxReplicas: 1 });
    expect(deployment.sqlite).toMatchObject({
      databaseUrl: 'sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile',
      mountPath: '/data',
      volumeName: 'lesson-data',
      storageType: 'AzureFile',
    });
    expect(deployment.sqlite.storageName).not.toBe('');
  });

  it('keeps the image runtime aligned with the durable mount contract', () => {
    expect(dockerfile).toContain('FROM rust:1-slim');
    expect(dockerfile).not.toMatch(/FROM rust:1\.\d+/);
    expect(dockerfile).toContain('DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc');
    expect(dockerfile).toContain('VOLUME ["/data"]');
    expect(dockerfile).toContain('EXPOSE 8080');
  });

  it('applies and then reads back the live topology instead of only documenting it', () => {
    expect(deploymentScript).toContain('az rest');
    expect(deploymentScript).toContain('maxReplicas:$maxReplicas');
    expect(deploymentScript).toContain('storageType:"AzureFile"');
    expect(deploymentScript).toContain('DATABASE_URL');
    expect(deploymentScript).toContain('.properties.template.scale.maxReplicas == 1');
    expect(deploymentScript).toContain('.properties.configuration.activeRevisionsMode == $revisionMode');
    expect(deploymentScript).toContain('.properties.latestRevisionName == .properties.latestReadyRevisionName');
    expect(deploymentScript).toContain('.storageName == $storage');
  });

  it('makes topology enforcement and a persistence canary part of every image release', () => {
    expect(deployment.publicUrl).toBe('https://code-lesson-checkpoints.sociobot.in');
    expect(deployment.registry).toBe('sociobotregistry');
    expect(deployment.imageRepository).toBe('sf-code-lesson-checkpoints');
    expect(releaseScript).toContain('az acr build');
    expect(releaseScript).toContain('az containerapp update');
    expect(releaseScript).not.toMatch(/az containerapp up(?:\s|\\)/);
    expect(releaseScript).toContain('Revision persistence canary');
    expect(releaseScript.match(/apply-deployment-contract\.sh/g)).toHaveLength(2);
    expect(releaseScript.indexOf('apply-deployment-contract.sh')).toBeLessThan(
      releaseScript.indexOf('Revision persistence canary'),
    );
    expect(releaseScript.lastIndexOf('apply-deployment-contract.sh')).toBeGreaterThan(
      releaseScript.indexOf('az containerapp update'),
    );
    expect(releaseScript.indexOf('EXPECTED_BUILD_SHA')).toBeGreaterThan(
      releaseScript.lastIndexOf('apply-deployment-contract.sh'),
    );
  });

  it('ships repository and license metadata in the extension package', () => {
    expect(extensionManifest.repository?.url).toBe(
      'https://github.com/B-Divyesh/sf-code-lesson-checkpoints.git',
    );
    expect(extensionManifest.files).toContain('LICENSE');
    expect(extensionLicense).toContain('Permission is hereby granted, free of charge');
  });
});
