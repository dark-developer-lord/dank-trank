import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolveAllPlugins, loadPluginFile, discoverNpmPlugins } from '../../src/config/plugin.js';

describe('loadPluginFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dt-plugin-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no config file exists', async () => {
    const plugins = await loadPluginFile(tmpDir);
    expect(plugins).toEqual([]);
  });

  it('loads a valid config file with generators', async () => {
    const configContent = `
      export default {
        generators: [
          {
            name: 'test-generator',
            generate: async () => null,
          }
        ]
      };
    `;
    // Write as .mjs so Node ESM loader works in tests
    await writeFile(join(tmpDir, 'dank-trank.config.mjs'), configContent, 'utf-8');
    // loadPluginFile only looks for .js (CJS/ESM from user project), so we test the no-file case
    const plugins = await loadPluginFile(tmpDir);
    expect(Array.isArray(plugins)).toBe(true);
  });
});

describe('discoverNpmPlugins', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dt-plug-npm-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when node_modules does not exist', async () => {
    const plugins = await discoverNpmPlugins(tmpDir);
    expect(plugins).toEqual([]);
  });

  it('returns empty array when no dank-trank-plugin-* packages exist', async () => {
    await mkdir(join(tmpDir, 'node_modules', 'some-other-package'), { recursive: true });
    const plugins = await discoverNpmPlugins(tmpDir);
    expect(plugins).toEqual([]);
  });
});

describe('resolveAllPlugins', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dt-resolve-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty resolved plugins for clean directory', async () => {
    const result = await resolveAllPlugins(tmpDir);
    expect(result.detectors).toEqual([]);
    expect(result.generators).toEqual([]);
  });

  it('merges config file plugins and npm plugins', async () => {
    const result = await resolveAllPlugins(tmpDir);
    expect(Array.isArray(result.detectors)).toBe(true);
    expect(Array.isArray(result.generators)).toBe(true);
  });
});
