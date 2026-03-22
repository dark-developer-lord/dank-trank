import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists } from '../utils/fs.js';
import type { MonorepoInfo, WorkspacePackage } from './types.js';

interface PackageJson {
  workspaces?: string[] | { packages: string[] };
}

interface LernaJson {
  packages?: string[];
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Resolve simple glob patterns — only handles "packages/*" style patterns
 * (no recursive globs, no negations). Sufficient for most monorepos.
 */
async function resolveSimpleGlobs(rootDir: string, patterns: string[]): Promise<WorkspacePackage[]> {
  const { readdirSync, statSync } = await import('node:fs');
  const packages: WorkspacePackage[] = [];

  for (const pattern of patterns) {
    // Handle patterns like "packages/*", "apps/*", "services/*"
    const parts = pattern.split('/');
    if (parts.length !== 2 || parts[1] !== '*') {
      // Non-wildcard: treat as direct package path
      const pkgPath = join(rootDir, pattern);
      const pkgJson = await readJson<{ name?: string }>(join(pkgPath, 'package.json'));
      packages.push({ name: pkgJson?.name ?? pattern, path: pattern });
      continue;
    }

    const dir = join(rootDir, parts[0]);
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const entryPath = join(dir, entry);
        try {
          if (statSync(entryPath).isDirectory()) {
            const relPath = join(parts[0], entry);
            const pkgJson = await readJson<{ name?: string }>(join(entryPath, 'package.json'));
            packages.push({ name: pkgJson?.name ?? entry, path: relPath });
          }
        } catch {
          // skip
        }
      }
    } catch {
      // directory doesn't exist
    }
  }

  return packages;
}

export async function detectMonorepo(rootDir: string): Promise<MonorepoInfo | null> {
  // 1. pnpm-workspace.yaml
  const pnpmWorkspaceFile = join(rootDir, 'pnpm-workspace.yaml');
  if (await fileExists(pnpmWorkspaceFile)) {
    try {
      // Simple YAML parse: just read the file and extract packages manually
      const raw = await readFile(pnpmWorkspaceFile, 'utf-8');
      const packagesMatch = raw.match(/packages:\s*([\s\S]*?)(?=\n\w|$)/);
      const patterns: string[] = [];
      if (packagesMatch) {
        const lines = packagesMatch[1].split('\n');
        for (const line of lines) {
          const m = line.match(/^\s*-\s*['"]?([^'"#\s]+)['"]?/);
          if (m) patterns.push(m[1]);
        }
      }
      if (patterns.length > 0) {
        const packages = await resolveSimpleGlobs(rootDir, patterns);
        return { type: 'pnpm', packages };
      }
    } catch {
      return { type: 'pnpm', packages: [] };
    }
  }

  // 2. package.json workspaces
  const pkgJson = await readJson<PackageJson>(join(rootDir, 'package.json'));
  if (pkgJson?.workspaces) {
    const patterns = Array.isArray(pkgJson.workspaces)
      ? pkgJson.workspaces
      : pkgJson.workspaces.packages ?? [];
    const packages = await resolveSimpleGlobs(rootDir, patterns);
    return { type: 'npm', packages };
  }

  // 3. lerna.json
  const lernaJson = await readJson<LernaJson>(join(rootDir, 'lerna.json'));
  if (lernaJson) {
    const patterns = lernaJson.packages ?? ['packages/*'];
    const packages = await resolveSimpleGlobs(rootDir, patterns);
    return { type: 'lerna', packages };
  }

  return null;
}
