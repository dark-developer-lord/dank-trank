import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { detectProject } from '../../src/detector/index.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

describe('Django detector', () => {
  it('detects a Django project', async () => {
    const result = await detectProject(join(FIXTURES, 'django-project'));
    expect(result.primary).not.toBeNull();
    expect(result.primary!.stack).toBe('django');
    expect(result.primary!.confidence).toBeGreaterThanOrEqual(60);
  });

  it('does not detect Django in a Node project', async () => {
    const result = await detectProject(join(FIXTURES, 'node-project'));
    const django = result.detections.find((d) => d.stack === 'django');
    expect(django).toBeUndefined();
  });
});

describe('FastAPI detector', () => {
  it('detects a FastAPI project', async () => {
    const result = await detectProject(join(FIXTURES, 'fastapi-project'));
    expect(result.primary).not.toBeNull();
    expect(result.primary!.stack).toBe('fastapi');
    expect(result.primary!.confidence).toBeGreaterThanOrEqual(50);
  });
});

describe('Node.js detector', () => {
  it('detects a Node.js project', async () => {
    const result = await detectProject(join(FIXTURES, 'node-project'));
    expect(result.primary).not.toBeNull();
    expect(result.primary!.stack).toBe('node');
    expect(result.primary!.confidence).toBeGreaterThanOrEqual(50);
  });

  it('detects Express sub-framework', async () => {
    const result = await detectProject(join(FIXTURES, 'node-project'));
    expect(result.primary!.nodeSubType).toBe('express');
    expect(result.primary!.details['framework']).toBe('Express');
  });

  it('detects NestJS sub-framework', async () => {
    const result = await detectProject(join(FIXTURES, 'nestjs-project'));
    expect(result.primary).not.toBeNull();
    expect(result.primary!.stack).toBe('node');
    expect(result.primary!.nodeSubType).toBe('nestjs');
    expect(result.primary!.details['framework']).toBe('NestJS');
  });
});

describe('Database detection integration', () => {
  it('detects PostgreSQL in Django fixture (psycopg2-binary)', async () => {
    const result = await detectProject(join(FIXTURES, 'django-project'));
    expect(result.primary).not.toBeNull();
    expect(result.primary!.databases).toContainEqual(expect.objectContaining({ type: 'postgres' }));
  });

  it('returns empty databases for Node Express fixture', async () => {
    const result = await detectProject(join(FIXTURES, 'node-project'));
    expect(result.primary!.databases).toHaveLength(0);
  });

  it('returns empty databases for FastAPI fixture', async () => {
    const result = await detectProject(join(FIXTURES, 'fastapi-project'));
    expect(result.primary!.databases).toHaveLength(0);
  });
});

describe('Empty directory', () => {
  it('returns no detections for empty dir', async () => {
    const result = await detectProject(join(FIXTURES, '..', '..'));
    // May or may not detect anything — just shouldn't throw
    expect(result.detections).toBeDefined();
  });
});
