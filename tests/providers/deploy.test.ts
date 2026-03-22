import { describe, it, expect } from 'vitest';
import { getProvider } from '../../src/providers/index.js';
import type { ProviderDeployOptions } from '../../src/providers/types.js';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

describe('Provider registry', () => {
  it('returns digitalocean provider by slug', () => {
    const p = getProvider('digitalocean');
    expect(p).toBeDefined();
    expect(p!.slug).toBe('digitalocean');
    expect(p!.name).toContain('DigitalOcean');
  });

  it('returns vercel provider by slug', () => {
    const p = getProvider('vercel');
    expect(p).toBeDefined();
    expect(p!.slug).toBe('vercel');
  });

  it('returns aws provider by slug', () => {
    const p = getProvider('aws');
    expect(p).toBeDefined();
    expect(p!.slug).toBe('aws');
  });

  it('returns undefined for unknown slug', () => {
    const p = getProvider('unknown-cloud');
    expect(p).toBeUndefined();
  });
});

describe('DigitalOcean provider', () => {
  let tmpDir: string;

  it('generateConfig writes .do/app.yaml', async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dt-do-test-'));
    try {
      const p = getProvider('digitalocean')!;
      const opts: ProviderDeployOptions = {
        appName: 'my-app',
        port: 3000,
        region: 'nyc3',
      };
      const configPath = await p.generateConfig(tmpDir, opts);
      expect(configPath).toContain('.do');
      expect(configPath).toContain('app.yaml');

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('my-app');
      expect(content).toContain('3000');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('has installInstructions', () => {
    const p = getProvider('digitalocean')!;
    expect(p.installInstructions.length).toBeGreaterThan(0);
  });

  it('postDeployInstructions returns non-empty array', () => {
    const p = getProvider('digitalocean')!;
    const lines = p.postDeployInstructions({ appName: 'my-app' });
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe('Vercel provider', () => {
  it('generateConfig writes vercel.json', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'dt-vercel-test-'));
    try {
      const p = getProvider('vercel')!;
      const configPath = await p.generateConfig(tmpDir, { appName: 'my-vercel-app' });
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('my-vercel-app');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
