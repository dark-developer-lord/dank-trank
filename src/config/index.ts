import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists } from '../utils/fs.js';
import type { SetupConfig } from './types.js';

const CONFIG_FILE = 'setup.config.json';

export async function loadConfig(rootDir: string): Promise<SetupConfig> {
  const configPath = join(rootDir, CONFIG_FILE);
  if (!(await fileExists(configPath))) {
    return {};
  }
  try {
    const raw = await readFile(configPath, 'utf-8');
    return JSON.parse(raw) as SetupConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(rootDir: string, config: SetupConfig): Promise<void> {
  const configPath = join(rootDir, CONFIG_FILE);
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
