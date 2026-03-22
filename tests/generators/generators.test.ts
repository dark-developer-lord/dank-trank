import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { buildContext, generateAll, writeGeneratedFiles } from '../../src/generators/index.js';
import { detectProject } from '../../src/detector/index.js';
import { fileExists } from '../../src/utils/fs.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

describe('Generator orchestrator', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'sms-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('generates all 4 files for Django project', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    expect(project.primary).not.toBeNull();

    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    expect(files).toHaveLength(4);
    expect(files.map((f) => f.relativePath).sort()).toEqual([
      '.github/workflows/deploy.yml',
      'Dockerfile',
      'docker-compose.yml',
      'nginx.conf',
    ]);
  });

  it('generates Dockerfile with correct content for Django', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('gunicorn');
    expect(dockerfile.content).toContain('python:3.12-slim');
    expect(dockerfile.content).toContain('non-root');
  });

  it('generates files for Node.js project with Express', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);

    expect(files).toHaveLength(4);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('node:20-alpine');
  });

  it('writes files to output directory', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    const results = await writeGeneratedFiles(tmpDir, files, { force: true });

    expect(results.every((r) => r.action === 'created')).toBe(true);
    expect(await fileExists(join(tmpDir, 'Dockerfile'))).toBe(true);
    expect(await fileExists(join(tmpDir, 'docker-compose.yml'))).toBe(true);
    expect(await fileExists(join(tmpDir, 'nginx.conf'))).toBe(true);
    expect(await fileExists(join(tmpDir, '.github', 'workflows', 'deploy.yml'))).toBe(true);
  });

  it('skips existing files without --force', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    // Write once
    await writeGeneratedFiles(tmpDir, files, { force: true });
    // Write again without force
    const results = await writeGeneratedFiles(tmpDir, files, { force: false });

    expect(results.every((r) => r.action === 'skipped')).toBe(true);
  });

  it('creates backup when overwriting with --force', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    // Write once
    await writeGeneratedFiles(tmpDir, files, { force: true });
    // Write again with force
    const results = await writeGeneratedFiles(tmpDir, files, { force: true });

    expect(results.some((r) => r.action === 'overwritten')).toBe(true);
    expect(await fileExists(join(tmpDir, 'Dockerfile.bak'))).toBe(true);
  });

  it('dry-run does not write files', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);

    const results = await writeGeneratedFiles(tmpDir, files, { dryRun: true });

    expect(results.every((r) => r.action === 'dry-run')).toBe(true);
    expect(await fileExists(join(tmpDir, 'Dockerfile'))).toBe(false);
  });
});
