import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../renderer/index.js';
import type { Generator, GeneratorContext, GeneratedFile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'monorepo');

export const monorepoRootComposeGenerator: Generator = {
  name: 'docker-compose.yml (monorepo root)',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!ctx.monorepo) return null;
    const template = await readFile(join(TEMPLATES_DIR, 'docker-compose.yml.hbs'), 'utf-8');
    return {
      relativePath: 'docker-compose.yml',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Root Docker Compose for monorepo (all services)',
    };
  },
};
