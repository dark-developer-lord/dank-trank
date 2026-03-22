import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { detectMonorepo } from '../../src/detector/monorepo.js';
import { detectProject } from '../../src/detector/index.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

describe('detectMonorepo', () => {
  it('detects pnpm monorepo from pnpm-workspace.yaml', async () => {
    const result = await detectMonorepo(join(FIXTURES, 'pnpm-monorepo'));
    expect(result).not.toBeNull();
    expect(result!.type).toBe('pnpm');
  });

  it('returns package list from pnpm-workspace.yaml', async () => {
    const result = await detectMonorepo(join(FIXTURES, 'pnpm-monorepo'));
    expect(result!.packages.length).toBeGreaterThanOrEqual(2);
    const names = result!.packages.map((p) => p.name);
    expect(names).toContain('@myapp/api');
    expect(names).toContain('@myapp/web');
  });

  it('returns null for a non-monorepo project', async () => {
    const result = await detectMonorepo(join(FIXTURES, 'django-project'));
    expect(result).toBeNull();
  });

  it('sets monorepo on ProjectInfo when pnpm-workspace.yaml is present', async () => {
    const project = await detectProject(join(FIXTURES, 'pnpm-monorepo'));
    expect(project.monorepo).toBeDefined();
    expect(project.monorepo!.type).toBe('pnpm');
  });
});
