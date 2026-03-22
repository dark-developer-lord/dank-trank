import chalk from 'chalk';
import { detectProject } from '../detector/index.js';
import { log } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import { providers } from '../providers/index.js';
import type { DeployProvider } from '../providers/types.js';

interface DeployCommandOptions {
  provider?: string;
  path?: string;
}

interface WizardAnswers {
  provider: string;
  appName: string;
  region?: string;
  domain?: string;
  plan?: string;
  runNow?: boolean;
}

async function promptWizard(preselectedProvider?: string, projectName?: string): Promise<WizardAnswers> {
  const { default: Enquirer } = await import('enquirer');
  const enquirer = new Enquirer();

  const providerChoices = providers.map((p) => ({ name: p.name, value: p.slug }));

  let providerSlug = preselectedProvider;
  if (!providerSlug) {
    const ans = await enquirer.prompt({
      type: 'select',
      name: 'provider',
      message: 'Which cloud provider?',
      choices: providerChoices,
    }) as { provider: string };
    providerSlug = ans.provider;
  }

  const appNameAns = await enquirer.prompt({
    type: 'input',
    name: 'appName',
    message: 'App name',
    initial: projectName ?? 'my-app',
  }) as { appName: string };

  const domainAns = await enquirer.prompt({
    type: 'input',
    name: 'domain',
    message: 'Custom domain (leave blank to skip)',
    initial: '',
  }) as { domain: string };

  let region: string | undefined;
  if (providerSlug === 'digitalocean' || providerSlug === 'aws') {
    const regionChoices =
      providerSlug === 'digitalocean'
        ? ['nyc', 'sfo', 'ams', 'lon', 'fra', 'sgp', 'blr', 'tor', 'syd']
        : ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
    const regionAns = await enquirer.prompt({
      type: 'select',
      name: 'region',
      message: 'Region',
      choices: regionChoices,
    }) as { region: string };
    region = regionAns.region;
  }

  const runNowAns = await enquirer.prompt({
    type: 'confirm',
    name: 'runNow',
    message: 'Run deploy command now (requires CLI to be installed)?',
    initial: true,
  }) as { runNow: boolean };

  return {
    provider: providerSlug!,
    appName: appNameAns.appName,
    domain: domainAns.domain || undefined,
    region,
    runNow: runNowAns.runNow,
  };
}

function printNextSteps(provider: DeployProvider, answers: WizardAnswers, configPath: string): void {
  log.break();
  log.header('Next steps');

  if (!provider.checkCli()) {
    log.warn(`${provider.name} CLI not found.`);
    for (const line of provider.installInstructions) {
      log.dim(`  ${line}`);
    }
    log.break();
  }

  const steps = provider.postDeployInstructions({
    appName: answers.appName,
    domain: answers.domain,
    region: answers.region,
    port: 8000,
  });

  for (const step of steps) {
    log.step(step);
  }

  log.break();
  log.dim(`Config file: ${chalk.bold(configPath)}`);
}

export async function deployCommand(options: DeployCommandOptions): Promise<void> {
  const rootDir = options.path || process.cwd();

  log.banner();
  log.header('Deploy');

  // 1. Detect project
  const project = await withSpinner('Detecting project stack', () => detectProject(rootDir));
  const primary = project.primary;

  if (primary) {
    log.success(`Detected: ${chalk.bold(primary.stack.toUpperCase())}`);
  } else {
    log.warn('Could not detect a stack — continuing with manual settings.');
  }

  log.break();

  // 2. Interactive wizard
  let answers: WizardAnswers;
  try {
    answers = await promptWizard(options.provider, primary?.stack);
  } catch {
    log.warn('Non-interactive mode. Use flags: --provider <slug>');
    process.exitCode = 1;
    return;
  }

  const provider = providers.find((p) => p.slug === answers.provider);
  if (!provider) {
    log.error(`Unknown provider: ${answers.provider}`);
    log.info(`Available providers: ${providers.map((p) => p.slug).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  log.break();

  // 3. Generate config file
  const configPath = await withSpinner(
    `Generating ${chalk.bold(provider.name)} config`,
    () => provider.generateConfig(rootDir, {
      appName: answers.appName,
      port: primary?.stack === 'node' ? 3000 : 8000,
      region: answers.region,
      domain: answers.domain,
      plan: answers.plan,
    }),
  );

  log.success(`Config written: ${chalk.bold(configPath)}`);

  // 4. Optionally run deploy
  if (answers.runNow) {
    if (!provider.checkCli()) {
      log.warn(`${provider.name} CLI is not installed. Cannot run deploy automatically.`);
    } else {
      log.break();
      log.header('Deploying...');
      provider.runDeploy(configPath, { appName: answers.appName });
    }
  }

  printNextSteps(provider, answers, configPath);
}
