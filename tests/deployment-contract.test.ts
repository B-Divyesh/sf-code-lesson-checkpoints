import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

type Deployment = {
  artifactClass: string;
  publicUrl: string;
  registry: string;
  imageRepository: string;
  targetPort: number;
  activeRevisionsMode: string;
  scale: { minReplicas: number; maxReplicas: number };
  dataDir: string;
  storage: { volumeName: string; storageName: string };
  coherenceProbe: { cycles: number };
};

const repoRoot = new URL('..', import.meta.url).pathname;
const deployment = JSON.parse(
  readFileSync(new URL('../deployment/container-app.json', import.meta.url), 'utf8'),
) as Deployment;
const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const deploymentScript = readFileSync(new URL('../scripts/apply-deployment-contract.sh', import.meta.url), 'utf8');
const releaseScript = readFileSync(new URL('../scripts/deploy-release.sh', import.meta.url), 'utf8');
const coherenceScript = readFileSync(new URL('../tests/live-coherence.mjs', import.meta.url), 'utf8');
const extensionManifest = JSON.parse(
  readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'),
) as { repository?: { url?: string }; files?: string[] };
const extensionLicense = readFileSync(new URL('../extension/LICENSE', import.meta.url), 'utf8');

function textFiles(directory: string): string[] {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: directory, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((filename) => join(directory, filename))
    .filter((filename) => existsSync(filename) && statSync(filename).isFile() && statSync(filename).size <= 2_000_000);
}

// The tokens are deliberately composed: this regression must ensure the
// repository never reintroduces prohibited names while remaining scannable.
const prohibited = [
  ['sociobot', '-v2'],
  ['sociobot', '-db'],
  ['sociobot', '-keyvault1'],
  ['pg', 'bouncer'],
  ['post', 'gres'],
  ['DATA', 'BASE_URL'],
].map((parts) => parts.join(''));

describe('durable single-service deployment contract', () => {
  it('uses exactly one service process and a product-owned /data mount', () => {
    expect(deployment.artifactClass).toBe('web-with-backend');
    expect(deployment.targetPort).toBe(8080);
    expect(deployment.activeRevisionsMode).toBe('Single');
    expect(deployment.scale).toEqual({ minReplicas: 1, maxReplicas: 1 });
    expect(deployment.dataDir).toBe('/data');
    expect(deployment.storage).toEqual({
      volumeName: 'lesson-data',
      storageName: 'sf-code-lesson-checkpoints-data',
    });
    expect(deployment.coherenceProbe).toEqual({ cycles: 4 });
  });

  it('keeps the image self-starting with a writable durable state directory', () => {
    expect(dockerfile).toContain('FROM rust:1-slim');
    expect(dockerfile).not.toMatch(/FROM rust:1\.\d+/);
    expect(dockerfile).toContain('mkdir -p /app/dist /data');
    expect(dockerfile).toContain('chown -R app:app /app /data');
    expect(dockerfile).toContain('BUILD_SHA="$BUILD_SHA" cargo build --release');
    expect(dockerfile).not.toContain('\nENV ');
    expect(dockerfile).toContain('EXPOSE 8080');
  });

  it('applies and reads back the one-replica volume mount with PORT only', () => {
    expect(deploymentScript).toContain('storageType:"AzureFile"');
    expect(deploymentScript).toContain('mountPath:$dataDir');
    expect(deploymentScript).toContain('.env = [{name:"PORT",value:"8080"}]');
    expect(deploymentScript).toContain('replica_count');
    expect(deploymentScript).toContain('[[ "$replica_count" == "$min_replicas" ]]');
    expect(deploymentScript).toContain('.volumeMounts == [{volumeName:$volume,mountPath:$dataDir}]');
    expect(deploymentScript).not.toContain('keyvault');
  });

  it('restarts a release and checks durable state through fresh connections', () => {
    expect(deployment.publicUrl).toBe('https://code-lesson-checkpoints.sociobot.in');
    expect(deployment.registry).toBe('sociobotregistry');
    expect(deployment.imageRepository).toBe('sf-code-lesson-checkpoints');
    expect(releaseScript).toContain('az acr build');
    expect(releaseScript).toContain('apply-deployment-contract.sh" "$image"');
    expect(releaseScript).toContain('Revision persistence canary');
    expect(releaseScript).toContain('az containerapp revision restart');
    expect(releaseScript).toContain('COHERENCE_CYCLES');
    expect(releaseScript).toContain('EXPECTED_BUILD_SHA');
    expect(coherenceScript).toContain('X-Forwarded-For');
    expect(coherenceScript).toContain('for (let cycle = 1; cycle <= cycles; cycle += 1)');
    expect(coherenceScript).toContain('authorized deletion');
  });

  it('rejects prohibited infrastructure residue in every tracked text file', () => {
    for (const filename of textFiles(repoRoot)) {
      const source = readFileSync(filename, 'utf8').toLowerCase();
      for (const name of prohibited) {
        expect(source, `${relative(repoRoot, filename)} contains prohibited infrastructure residue`).not.toContain(name.toLowerCase());
      }
    }
  });

  it('ships repository and license metadata in the extension package', () => {
    expect(extensionManifest.repository?.url).toBe(
      'https://github.com/B-Divyesh/sf-code-lesson-checkpoints.git',
    );
    expect(extensionManifest.files).toContain('LICENSE');
    expect(extensionLicense).toContain('Permission is hereby granted, free of charge');
  });
});
