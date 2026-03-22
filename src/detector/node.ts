import type { Detector, DetectionResult, NodeSubType } from './types.js';
import { fileExists, readProjectFile } from '../utils/fs.js';
import { join } from 'node:path';

export const nodeDetector: Detector = {
  name: 'Node.js',

  async detect(rootDir: string): Promise<DetectionResult | null> {
    let confidence = 0;
    const details: Record<string, string> = {};
    let nodeSubType: NodeSubType = 'generic';

    // Must have package.json
    const packageJson = await readProjectFile(rootDir, 'package.json');
    if (!packageJson) return null;

    confidence += 30;
    details['package.json'] = 'found';

    let pkg: Record<string, unknown>;
    try {
      pkg = JSON.parse(packageJson);
    } catch {
      return null;
    }

    const allDeps = {
      ...(typeof pkg.dependencies === 'object' ? (pkg.dependencies as Record<string, string>) : {}),
      ...(typeof pkg.devDependencies === 'object' ? (pkg.devDependencies as Record<string, string>) : {}),
    };

    // Detect sub-frameworks
    if ('next' in allDeps) {
      nodeSubType = 'nextjs';
      confidence += 30;
      details['framework'] = 'Next.js';
    } else if ('express' in allDeps) {
      nodeSubType = 'express';
      confidence += 30;
      details['framework'] = 'Express';
    } else if ('vite' in allDeps) {
      nodeSubType = 'vite';
      confidence += 25;
      details['framework'] = 'Vite';
    }

    // Check for src/ directory
    if (await fileExists(join(rootDir, 'src'))) {
      confidence += 10;
      details['src/'] = 'found';
    }

    // Check for TypeScript
    if ('typescript' in allDeps || await fileExists(join(rootDir, 'tsconfig.json'))) {
      details['typescript'] = 'yes';
    }

    // Check for package manager lockfiles
    if (await fileExists(join(rootDir, 'pnpm-lock.yaml'))) {
      details['packageManager'] = 'pnpm';
    } else if (await fileExists(join(rootDir, 'yarn.lock'))) {
      details['packageManager'] = 'yarn';
    } else if (await fileExists(join(rootDir, 'package-lock.json'))) {
      details['packageManager'] = 'npm';
    } else {
      details['packageManager'] = 'npm';
    }

    // Check for start/build scripts
    const scripts = typeof pkg.scripts === 'object' ? (pkg.scripts as Record<string, string>) : {};
    if (scripts.start) {
      details['start script'] = scripts.start;
    }
    if (scripts.build) {
      details['build script'] = scripts.build;
      confidence += 10;
    }

    return {
      stack: 'node',
      confidence: Math.min(confidence, 100),
      details,
      nodeSubType,
    };
  },
};
