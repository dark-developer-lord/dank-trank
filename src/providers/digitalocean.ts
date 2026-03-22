import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { render } from '../renderer/index.js';
import { safeWriteFile } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import type { DeployProvider } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'providers', 'digitalocean');

export const digitaloceanProvider: DeployProvider = {
  name: 'DigitalOcean App Platform',
  slug: 'digitalocean',
  configFile: '.do/app.yaml',

  async generateConfig(rootDir, options) {
    const template = await readFile(join(TEMPLATES_DIR, 'app.yaml.hbs'), 'utf-8');
    const context = {
      projectName: options.appName,
      port: options.port ?? 8000,
      region: options.region ?? 'nyc',
      plan: options.plan ?? 'basic-xxs',
      domain: options.domain,
      hasDomain: !!options.domain,
    };
    const content = render(template, context);
    const outPath = join(rootDir, '.do', 'app.yaml');
    mkdirSync(join(rootDir, '.do'), { recursive: true });
    await safeWriteFile(outPath, content, { force: true });
    return outPath;
  },

  checkCli() {
    try {
      execSync('doctl version', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  runDeploy(configPath, options) {
    log.info('Running: doctl apps create --spec ' + configPath);
    try {
      execSync(`doctl apps create --spec "${configPath}"`, { stdio: 'inherit', timeout: 120_000 });
    } catch {
      log.error('doctl deploy failed. Check the error above.');
      if (options?.onFailure) options.onFailure();
    }
  },

  installInstructions: [
    'Install doctl:  brew install doctl  (macOS)',
    '                snap install doctl  (Linux)',
    '                https://docs.digitalocean.com/reference/doctl/how-to/install/',
    '',
    'Then authenticate: doctl auth init',
  ],

  postDeployInstructions(options) {
    return [
      `App spec written to .do/app.yaml`,
      `Deploy manually: doctl apps create --spec .do/app.yaml`,
      ...(options.domain ? [`Custom domain:  doctl apps create → Dashboard → Domains → add ${options.domain}`] : []),
    ];
  },
};
