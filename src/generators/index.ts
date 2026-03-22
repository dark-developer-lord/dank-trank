import { join } from 'node:path';
import { basename } from 'node:path';
import type { GeneratorContext, GeneratedFile, GenerateOptions, Generator } from './types.js';
import {
  dockerfileGenerator,
  dockerComposeGenerator,
  nginxGenerator,
  githubActionsGenerator,
  dockerignoreGenerator,
  envExampleGenerator,
  entrypointGenerator,
} from './dockerfile.js';
import {
  certbotScriptGenerator,
  certbotNginxGenerator,
  caddyfileGenerator,
} from './ssl.js';
import {
  k8sNamespaceGenerator,
  k8sConfigMapGenerator,
  k8sSecretTemplateGenerator,
  k8sDeploymentGenerator,
  k8sServiceGenerator,
  k8sIngressGenerator,
  k8sHpaGenerator,
} from './kubernetes.js';
import { monorepoRootComposeGenerator } from './monorepo.js';
import { safeWriteFile, type WriteResult } from '../utils/fs.js';

const baseGenerators: Generator[] = [
  dockerfileGenerator,
  dockerComposeGenerator,
  nginxGenerator,
  githubActionsGenerator,
  dockerignoreGenerator,
  envExampleGenerator,
  entrypointGenerator,
  // SSL generators (only active when ctx.sslProvider is set)
  certbotScriptGenerator,
  certbotNginxGenerator,
  caddyfileGenerator,
  // k8s generators (only active when ctx.k8s is set)
  k8sNamespaceGenerator,
  k8sConfigMapGenerator,
  k8sSecretTemplateGenerator,
  k8sDeploymentGenerator,
  k8sServiceGenerator,
  k8sIngressGenerator,
  k8sHpaGenerator,
  // monorepo (only active when ctx.monorepo is set)
  monorepoRootComposeGenerator,
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

export async function generateAll(ctx: GeneratorContext, extraGenerators: Generator[] = []): Promise<GeneratedFile[]> {
  const allGenerators = [...baseGenerators, ...extraGenerators];
  const results = await Promise.all(allGenerators.map((g) => g.generate(ctx)));
  return results.filter((f): f is GeneratedFile => f !== null);
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
