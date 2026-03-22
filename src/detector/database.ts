import type { DatabaseInfo } from './types.js';
import { readProjectFile } from '../utils/fs.js';

const PYTHON_DB_PATTERNS: [RegExp, DatabaseInfo['type']][] = [
  [/psycopg2|asyncpg|django\.db\.backends\.postgresql/i, 'postgres'],
  [/pymongo|motor/i, 'mongodb'],
  [/redis|django-redis|celery/i, 'redis'],
];

const NODE_DB_PATTERNS: [RegExp, DatabaseInfo['type']][] = [
  [/\b(pg|sequelize|typeorm|prisma|knex|drizzle)\b/i, 'postgres'],
  [/\b(mongoose|mongodb)\b/i, 'mongodb'],
  [/\b(ioredis|redis)\b/i, 'redis'],
];

export async function detectDatabases(rootDir: string, stack: string): Promise<DatabaseInfo[]> {
  const found = new Map<DatabaseInfo['type'], DatabaseInfo>();

  if (stack === 'django' || stack === 'fastapi') {
    await detectFromPython(rootDir, found);
  } else if (stack === 'node') {
    await detectFromNode(rootDir, found);
  }

  return Array.from(found.values());
}

async function detectFromPython(rootDir: string, found: Map<DatabaseInfo['type'], DatabaseInfo>): Promise<void> {
  const files = ['requirements.txt', 'pyproject.toml', 'Pipfile'];
  for (const file of files) {
    const content = await readProjectFile(rootDir, file);
    if (!content) continue;
    for (const [pattern, type] of PYTHON_DB_PATTERNS) {
      if (pattern.test(content) && !found.has(type)) {
        found.set(type, { type, detectedFrom: file });
      }
    }
  }
}

async function detectFromNode(rootDir: string, found: Map<DatabaseInfo['type'], DatabaseInfo>): Promise<void> {
  const content = await readProjectFile(rootDir, 'package.json');
  if (!content) return;

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(content);
  } catch {
    return;
  }

  const allDeps = Object.keys({
    ...(typeof pkg.dependencies === 'object' ? (pkg.dependencies as Record<string, string>) : {}),
    ...(typeof pkg.devDependencies === 'object' ? (pkg.devDependencies as Record<string, string>) : {}),
  }).join(' ');

  for (const [pattern, type] of NODE_DB_PATTERNS) {
    if (pattern.test(allDeps) && !found.has(type)) {
      found.set(type, { type, detectedFrom: 'package.json' });
    }
  }
}
