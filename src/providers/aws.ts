import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { render } from '../renderer/index.js';
import { safeWriteFile } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import type { DeployProvider } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'providers', 'aws');

export const awsProvider: DeployProvider = {
  name: 'AWS App Runner',
  slug: 'aws',
  configFile: 'apprunner.yaml',

  async generateConfig(rootDir, options) {
    const template = await readFile(join(TEMPLATES_DIR, 'apprunner.yaml.hbs'), 'utf-8');
    const context = { projectName: options.appName, port: options.port ?? 8080 };
    const content = render(template, context);
    const outPath = join(rootDir, 'apprunner.yaml');
    await safeWriteFile(outPath, content, { force: true });
    return outPath;
  },

  checkCli() {
    try {
      execSync('aws --version', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  runDeploy(configPath, options) {
    log.info('Running: aws apprunner create-service (using ECR image)');
    log.warn('AWS App Runner requires an ECR image URI. Steps:');
    log.step('1. Build & push image:  docker build -t <name> . && docker push <ecr-uri>');
    log.step('2. Update apprunner.yaml with your ECR URI');
    log.step(`3. aws apprunner create-service --cli-input-yaml file://${configPath}`);
    if (options?.onFailure) options.onFailure();
  },

  installInstructions: [
    'Install AWS CLI:  pip install awscli  or  brew install awscli',
    'Then configure:   aws configure',
    'Docs: https://docs.aws.amazon.com/apprunner/latest/dg/getting-started.html',
  ],

  postDeployInstructions(_options) {
    return [
      'apprunner.yaml written.',
      'Next: build & push your Docker image to ECR, then run: aws apprunner create-service --cli-input-yaml file://apprunner.yaml',
    ];
  },
};
