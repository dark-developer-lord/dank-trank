import type { DetectionResult } from '../detector/types.js';

export interface GeneratorContext {
  projectName: string;
  stack: DetectionResult;
  port: number;
  [key: string]: unknown;
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
  description: string;
}

export interface GenerateOptions {
  dryRun?: boolean;
  force?: boolean;
  outputDir?: string;
}

export interface Generator {
  name: string;
  generate(ctx: GeneratorContext): Promise<GeneratedFile>;
}
