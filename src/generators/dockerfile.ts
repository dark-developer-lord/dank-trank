import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../renderer/index.js';
import type { Generator, GeneratorContext, GeneratedFile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Works both in src (dev) and dist (bundled): templates/ is always a sibling of the generators dir
function findTemplatesDir(): string {
  // In bundled mode: dist/cli/index.js → __dirname = dist/cli → ../templates
  // But generators are inlined, so __dirname is dist/cli. Let's resolve from module URL.
  const candidates = [
    join(__dirname, '..', 'templates'),  // from dist/cli/ or src/generators/
    join(__dirname, '..', '..', 'templates'), // fallback
    join(__dirname, 'templates'), // another fallback
  ];
  // We'll just use the first one that makes sense — the build copies templates to dist/templates
  return candidates[0];
}

const TEMPLATES_DIR = findTemplatesDir();

async function loadTemplate(stack: string, file: string): Promise<string> {
  const templatePath = join(TEMPLATES_DIR, stack, file);
  return readFile(templatePath, 'utf-8');
}

function getNodeContext(ctx: GeneratorContext): Record<string, unknown> {
  const pm = (ctx.stack.details['packageManager'] as string) || 'npm';
  const hasBuild = !!ctx.stack.details['build script'];
  const startScript = ctx.stack.details['start script'] as string | undefined;

  let startCmd = '"node", "index.js"';
  if (startScript) {
    if (startScript.includes('next start')) {
      startCmd = '"npx", "next", "start"';
    } else if (startScript.includes('node ')) {
      const entry = startScript.replace('node ', '');
      startCmd = `"node", "${entry}"`;
    } else {
      startCmd = `"npm", "start"`;
    }
  }

  return {
    ...ctx,
    usePnpm: pm === 'pnpm' || undefined,
    useYarn: pm === 'yarn' || undefined,
    useNpm: pm === 'npm' || undefined,
    hasBuild: hasBuild || undefined,
    startCmd,
    installCmd: pm === 'pnpm' ? 'pnpm install --frozen-lockfile' : pm === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci',
    testCmd: pm === 'pnpm' ? 'pnpm test' : pm === 'yarn' ? 'yarn test' : 'npm test',
  };
}

function getFastapiContext(ctx: GeneratorContext): Record<string, unknown> {
  const hasAppDir = !!ctx.stack.details['app/main.py'];
  return {
    ...ctx,
    entrypoint: hasAppDir ? 'app.main' : 'main',
  };
}

export const dockerfileGenerator: Generator = {
  name: 'Dockerfile',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'Dockerfile.hbs');
    const context = ctx.stack.stack === 'node'
      ? getNodeContext(ctx)
      : ctx.stack.stack === 'fastapi'
        ? getFastapiContext(ctx)
        : ctx;
    return {
      relativePath: 'Dockerfile',
      content: render(template, context as Record<string, unknown>),
      description: `Dockerfile for ${ctx.stack.stack} (multi-stage, non-root user)`,
    };
  },
};

export const dockerComposeGenerator: Generator = {
  name: 'docker-compose.yml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'docker-compose.yml.hbs');
    const context = ctx.stack.stack === 'node' ? getNodeContext(ctx) : ctx;
    return {
      relativePath: 'docker-compose.yml',
      content: render(template, context as Record<string, unknown>),
      description: `Docker Compose for local development with Nginx reverse proxy`,
    };
  },
};

export const nginxGenerator: Generator = {
  name: 'nginx.conf',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'nginx.conf.hbs');
    const context = ctx.stack.stack === 'node' ? getNodeContext(ctx) : ctx;
    return {
      relativePath: 'nginx.conf',
      content: render(template, context as Record<string, unknown>),
      description: 'Nginx reverse proxy configuration',
    };
  },
};

export const githubActionsGenerator: Generator = {
  name: 'GitHub Actions workflow',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'deploy.yml.hbs');
    const context = ctx.stack.stack === 'node'
      ? getNodeContext(ctx)
      : ctx.stack.stack === 'fastapi'
        ? getFastapiContext(ctx)
        : ctx;
    return {
      relativePath: '.github/workflows/deploy.yml',
      content: render(template, context as Record<string, unknown>),
      description: 'GitHub Actions CI/CD workflow (test + build + deploy)',
    };
  },
};

export const dockerignoreGenerator: Generator = {
  name: '.dockerignore',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'dockerignore.hbs');
    return {
      relativePath: '.dockerignore',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Docker ignore file for optimized builds',
    };
  },
};

export const envExampleGenerator: Generator = {
  name: '.env.example',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile> {
    const template = await loadTemplate(ctx.stack.stack, 'env.example.hbs');
    return {
      relativePath: '.env.example',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Environment variables template with all required variables',
    };
  },
};

export const entrypointGenerator: Generator = {
  name: 'docker-entrypoint.sh',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (ctx.stack.stack !== 'django') return null;
    const template = await loadTemplate(ctx.stack.stack, 'docker-entrypoint.sh.hbs');
    return {
      relativePath: 'docker-entrypoint.sh',
      content: render(template, ctx as unknown as Record<string, unknown>),
      description: 'Docker entrypoint script (auto-migrate + collectstatic)',
    };
  },
};
