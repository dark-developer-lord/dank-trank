import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../renderer/index.js';
import type { Generator, GeneratorContext, GeneratedFile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'ssl');

async function loadSslTemplate(provider: string, file: string): Promise<string> {
  return readFile(join(TEMPLATES_DIR, provider, file), 'utf-8');
}

export const certbotScriptGenerator: Generator = {
  name: 'setup-ssl.sh (certbot)',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!ctx.sslProvider || ctx.sslProvider !== 'certbot') return null;
    const template = await loadSslTemplate('certbot', 'setup-ssl.sh.hbs');
    return {
      relativePath: 'setup-ssl.sh',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Certbot SSL setup script (Let\'s Encrypt)',
    };
  },
};

export const certbotNginxGenerator: Generator = {
  name: 'nginx-ssl.conf (certbot)',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!ctx.sslProvider || ctx.sslProvider !== 'certbot') return null;
    const template = await loadSslTemplate('certbot', 'nginx-ssl.conf.hbs');
    return {
      relativePath: 'nginx-ssl.conf',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Nginx SSL configuration with HTTP→HTTPS redirect and HSTS',
    };
  },
};

export const caddyfileGenerator: Generator = {
  name: 'Caddyfile',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!ctx.sslProvider || ctx.sslProvider !== 'caddy') return null;
    const template = await loadSslTemplate('caddy', 'Caddyfile.hbs');
    return {
      relativePath: 'Caddyfile',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Caddyfile with automatic HTTPS via Let\'s Encrypt',
    };
  },
};
