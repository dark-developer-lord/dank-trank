import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { detectDatabases } from '../../src/detector/database.js';

describe('Database detector', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'dt-db-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('detects PostgreSQL from psycopg2 in requirements.txt', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), 'django\npsycopg2-binary\n');
    const dbs = await detectDatabases(tmpDir, 'django');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'postgres' }));
  });

  it('detects MongoDB from pymongo in requirements.txt', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), 'fastapi\npymongo\n');
    const dbs = await detectDatabases(tmpDir, 'fastapi');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'mongodb' }));
  });

  it('detects Redis from redis in requirements.txt', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), 'django\nredis\ncelery\n');
    const dbs = await detectDatabases(tmpDir, 'django');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'redis' }));
  });

  it('detects multiple databases from requirements.txt', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), 'django\npsycopg2\nredis\n');
    const dbs = await detectDatabases(tmpDir, 'django');
    expect(dbs).toHaveLength(2);
    expect(dbs.map((d) => d.type).sort()).toEqual(['postgres', 'redis']);
  });

  it('detects PostgreSQL from pg in package.json', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { pg: '^8.0.0', express: '^4.0.0' },
    }));
    const dbs = await detectDatabases(tmpDir, 'node');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'postgres' }));
  });

  it('detects MongoDB from mongoose in package.json', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { mongoose: '^7.0.0' },
    }));
    const dbs = await detectDatabases(tmpDir, 'node');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'mongodb' }));
  });

  it('detects Redis from ioredis in package.json', async () => {
    await writeFile(join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { ioredis: '^5.0.0' },
    }));
    const dbs = await detectDatabases(tmpDir, 'node');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'redis' }));
  });

  it('returns empty array when no databases detected', async () => {
    await writeFile(join(tmpDir, 'requirements.txt'), 'fastapi\nuvicorn\n');
    const dbs = await detectDatabases(tmpDir, 'fastapi');
    expect(dbs).toHaveLength(0);
  });

  it('returns empty array for empty directory', async () => {
    const dbs = await detectDatabases(tmpDir, 'django');
    expect(dbs).toHaveLength(0);
  });

  it('detects PostgreSQL from asyncpg in pyproject.toml', async () => {
    await writeFile(join(tmpDir, 'pyproject.toml'), '[project]\ndependencies = ["asyncpg"]\n');
    const dbs = await detectDatabases(tmpDir, 'fastapi');
    expect(dbs).toContainEqual(expect.objectContaining({ type: 'postgres' }));
  });
});
