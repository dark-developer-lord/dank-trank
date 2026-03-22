import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { buildContext } from '../../src/generators/index.js';
import { certbotScriptGenerator, certbotNginxGenerator, caddyfileGenerator } from '../../src/generators/ssl.js';
import { detectProject } from '../../src/detector/index.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

async function makeCtx(fixtureDir: string, extra: Record<string, unknown> = {}) {
  const project = await detectProject(join(FIXTURES, fixtureDir));
  return { ...buildContext(join(FIXTURES, fixtureDir), project.primary!), ...extra };
}

describe('certbotScriptGenerator', () => {
  it('returns null when sslProvider is not set', async () => {
    const ctx = await makeCtx('node-project');
    const result = await certbotScriptGenerator.generate(ctx);
    expect(result).toBeNull();
  });

  it('returns null when sslProvider is caddy', async () => {
    const ctx = await makeCtx('node-project', { sslProvider: 'caddy', domain: 'example.com', email: 'admin@example.com' });
    const result = await certbotScriptGenerator.generate(ctx);
    expect(result).toBeNull();
  });

  it('generates setup-ssl.sh for certbot', async () => {
    const ctx = await makeCtx('node-project', { sslProvider: 'certbot', domain: 'example.com', email: 'admin@example.com' });
    const result = await certbotScriptGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('setup-ssl.sh');
    expect(result!.content).toContain('certbot');
    expect(result!.content).toContain('example.com');
    expect(result!.content).toContain('admin@example.com');
  });
});

describe('certbotNginxGenerator', () => {
  it('generates nginx SSL config for certbot', async () => {
    const ctx = await makeCtx('node-project', { sslProvider: 'certbot', domain: 'example.com', email: 'admin@example.com' });
    const result = await certbotNginxGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('nginx-ssl.conf');
    expect(result!.content).toContain('ssl_certificate');
    expect(result!.content).toContain('example.com');
  });
});

describe('caddyfileGenerator', () => {
  it('returns null when sslProvider is not caddy', async () => {
    const ctx = await makeCtx('node-project', { sslProvider: 'certbot', domain: 'example.com', email: 'x@x.com' });
    const result = await caddyfileGenerator.generate(ctx);
    expect(result).toBeNull();
  });

  it('generates Caddyfile for caddy', async () => {
    const ctx = await makeCtx('node-project', { sslProvider: 'caddy', domain: 'example.com' });
    const result = await caddyfileGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('Caddyfile');
    expect(result!.content).toContain('example.com');
    expect(result!.content).toContain('reverse_proxy');
  });
});
