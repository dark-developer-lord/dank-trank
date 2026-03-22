import { join } from 'node:path';
import { basename } from 'node:path';
import type { GeneratorContext, GeneratedFile, GenerateOptions } from './types.js';
import {
  dockerfileGenerator,
  dockerComposeGenerator,
  nginxGenerator,
  githubActionsGenerator,
} from './dockerfile.js';
import { safeWriteFile, type WriteResult } from '../utils/fs.js';

const allGenerators = [
  dockerfileGenerator,
  dockerComposeGenerator,
  nginxGenerator,
  githubActionsGenerator,
];

function getDefaultPort(stack: string): number {
  switch (stack) {
    case 'django': return 8000;
    case 'fastapi': return 8000;
    case 'node': return 3000;
    default: return 8080;
  }
}

export function buildContext(rootDir: string, stack: import('../detector/types.js').DetectionResult): GeneratorContext {
  const projectName = basename(rootDir).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  return {
    projectName,
    stack,
    port: getDefaultPort(stack.stack),
  };
}

export async function generateAll(ctx: GeneratorContext): Promise<GeneratedFile[]> {
  return Promise.all(allGenerators.map((g) => g.generate(ctx)));
}

export async function writeGeneratedFiles(
  rootDir: string,
  files: GeneratedFile[],
  options: GenerateOptions = {},
): Promise<WriteResult[]> {
  const outputDir = options.outputDir || rootDir;
  const results: WriteResult[] = [];

  for (const file of files) {
    const fullPath = join(outputDir, file.relativePath);
    const result = await safeWriteFile(fullPath, file.content, {
      force: options.force,
      dryRun: options.dryRun,
      backup: true,
    });
    results.push(result);
  }

  return results;
}
