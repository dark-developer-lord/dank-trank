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

    expect(files).toHaveLength(7);
    expect(files.map((f) => f.relativePath).sort()).toEqual([
      '.dockerignore',
      '.env.example',
      '.github/workflows/deploy.yml',
      'Dockerfile',
      'docker-compose.yml',
      'docker-entrypoint.sh',
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

    expect(files).toHaveLength(6);
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

describe('Template content validation - Django', () => {
  it('Dockerfile includes HEALTHCHECK directive', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('HEALTHCHECK');
  });

  it('Dockerfile uses env-based workers', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('WEB_CONCURRENCY');
  });

  it('Dockerfile does NOT suppress collectstatic errors', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).not.toContain('2>/dev/null');
  });

  it('docker-compose uses service_healthy condition', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const compose = files.find((f) => f.relativePath === 'docker-compose.yml')!;
    expect(compose.content).toContain('condition: service_healthy');
  });

  it('docker-compose does not have hardcoded password', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const compose = files.find((f) => f.relativePath === 'docker-compose.yml')!;
    expect(compose.content).not.toContain('changeme');
  });

  it('nginx includes security headers', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const nginx = files.find((f) => f.relativePath === 'nginx.conf')!;
    expect(nginx.content).toContain('server_tokens off');
    expect(nginx.content).toContain('X-Frame-Options');
    expect(nginx.content).toContain('X-Content-Type-Options');
  });

  it('nginx includes proxy timeouts', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const nginx = files.find((f) => f.relativePath === 'nginx.conf')!;
    expect(nginx.content).toContain('proxy_connect_timeout');
    expect(nginx.content).toContain('proxy_read_timeout');
  });

  it('GitHub Actions uses retry health check (not sleep)', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const ci = files.find((f) => f.relativePath === '.github/workflows/deploy.yml')!;
    expect(ci.content).not.toContain('sleep 5');
    expect(ci.content).toContain('Health check passed');
  });

  it('GitHub Actions includes cleanup step', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const ci = files.find((f) => f.relativePath === '.github/workflows/deploy.yml')!;
    expect(ci.content).toContain('Cleanup');
    expect(ci.content).toContain('if: always()');
  });

  it('generates docker-entrypoint.sh for Django', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const entrypoint = files.find((f) => f.relativePath === 'docker-entrypoint.sh')!;
    expect(entrypoint).toBeDefined();
    expect(entrypoint.content).toContain('migrate');
    expect(entrypoint.content).toContain('collectstatic');
  });

  it('.dockerignore includes critical entries', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerignore = files.find((f) => f.relativePath === '.dockerignore')!;
    expect(dockerignore.content).toContain('.git/');
    expect(dockerignore.content).toContain('__pycache__');
    expect(dockerignore.content).toContain('.env');
  });

  it('.env.example includes required variables', async () => {
    const project = await detectProject(join(FIXTURES, 'django-project'));
    const ctx = buildContext(join(FIXTURES, 'django-project'), project.primary!);
    const files = await generateAll(ctx);
    const envExample = files.find((f) => f.relativePath === '.env.example')!;
    expect(envExample.content).toContain('SECRET_KEY');
    expect(envExample.content).toContain('POSTGRES_PASSWORD');
    expect(envExample.content).toContain('WEB_CONCURRENCY');
  });
});

describe('Template content validation - Node', () => {
  it('Dockerfile includes HEALTHCHECK', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('HEALTHCHECK');
  });

  it('Dockerfile uses npm ci --omit=dev (not npm prune --production)', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('npm ci --omit=dev');
    expect(dockerfile.content).not.toContain('npm prune --production');
  });

  it('does NOT generate docker-entrypoint.sh for Node', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);
    const entrypoint = files.find((f) => f.relativePath === 'docker-entrypoint.sh');
    expect(entrypoint).toBeUndefined();
  });

  it('nginx includes WebSocket upgrade headers', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);
    const nginx = files.find((f) => f.relativePath === 'nginx.conf')!;
    expect(nginx.content).toContain('Upgrade');
    expect(nginx.content).toContain('Connection');
    expect(nginx.content).toContain('server_tokens off');
  });

  it('.dockerignore includes node_modules', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerignore = files.find((f) => f.relativePath === '.dockerignore')!;
    expect(dockerignore.content).toContain('node_modules');
  });
});

describe('Template content validation - FastAPI', () => {
  it('generates 6 files for FastAPI (no entrypoint)', async () => {
    const project = await detectProject(join(FIXTURES, 'fastapi-project'));
    const ctx = buildContext(join(FIXTURES, 'fastapi-project'), project.primary!);
    const files = await generateAll(ctx);
    expect(files).toHaveLength(6);
    expect(files.find((f) => f.relativePath === 'docker-entrypoint.sh')).toBeUndefined();
  });

  it('Dockerfile includes HEALTHCHECK', async () => {
    const project = await detectProject(join(FIXTURES, 'fastapi-project'));
    const ctx = buildContext(join(FIXTURES, 'fastapi-project'), project.primary!);
    const files = await generateAll(ctx);
    const dockerfile = files.find((f) => f.relativePath === 'Dockerfile')!;
    expect(dockerfile.content).toContain('HEALTHCHECK');
    expect(dockerfile.content).toContain('WEB_CONCURRENCY');
  });
});
