import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { render } from '../renderer/index.js';
import { safeWriteFile } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import type { DeployProvider } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'providers', 'vercel');

export const vercelProvider: DeployProvider = {
  name: 'Vercel',
  slug: 'vercel',
  configFile: 'vercel.json',

  async generateConfig(rootDir, options) {
    const template = await readFile(join(TEMPLATES_DIR, 'vercel.json.hbs'), 'utf-8');
    const context = { projectName: options.appName, port: options.port ?? 3000 };
    const content = render(template, context);
    const outPath = join(rootDir, 'vercel.json');
    await safeWriteFile(outPath, content, { force: true });
    return outPath;
  },

  checkCli() {
    try {
      execSync('vercel --version', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  runDeploy(_configPath, options) {
    log.info('Running: vercel deploy --prod');
    try {
      execSync('vercel deploy --prod', { stdio: 'inherit', timeout: 120_000 });
    } catch {
      log.error('vercel deploy failed. Check the error above.');
      if (options?.onFailure) options.onFailure();
    }
  },

  installInstructions: [
    'Install Vercel CLI:  npm install -g vercel',
    'Then authenticate:   vercel login',
  ],

  postDeployInstructions(_options) {
    return [
      'vercel.json written.',
      'Deploy manually: vercel deploy --prod',
      'Note: Vercel is optimised for Node.js / frontend. For Django/FastAPI consider DigitalOcean or AWS.',
    ];
  },
};
