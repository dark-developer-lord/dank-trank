import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readProjectFile(rootDir: string, relativePath: string): Promise<string | null> {
  try {
    return await readFile(join(rootDir, relativePath), 'utf-8');
  } catch {
    return null;
  }
}

export async function createBackup(filePath: string): Promise<string> {
  const backupPath = `${filePath}.bak`;
  await copyFile(filePath, backupPath);
  return backupPath;
}

export interface WriteFileOptions {
  force?: boolean;
  dryRun?: boolean;
  backup?: boolean;
}

export interface WriteResult {
  path: string;
  action: 'created' | 'overwritten' | 'skipped' | 'dry-run';
  backupPath?: string;
}

export async function safeWriteFile(
  filePath: string,
  content: string,
  options: WriteFileOptions = {},
): Promise<WriteResult> {
  const { force = false, dryRun = false, backup = true } = options;

  if (dryRun) {
    return { path: filePath, action: 'dry-run' };
  }

  const exists = await fileExists(filePath);

  if (exists && !force) {
    return { path: filePath, action: 'skipped' };
  }

  let backupPath: string | undefined;
  if (exists && backup) {
    backupPath = await createBackup(filePath);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');

  return {
    path: filePath,
    action: exists ? 'overwritten' : 'created',
    backupPath,
  };
}
