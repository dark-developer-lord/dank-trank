import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import { buildContext, writeGeneratedFiles } from '../generators/index.js';
import {
  certbotScriptGenerator,
  certbotNginxGenerator,
  caddyfileGenerator,
} from '../generators/ssl.js';
import { detectProject } from '../detector/index.js';
import type { GeneratorContext } from '../generators/types.js';
import type { DetectionResult } from '../detector/types.js';

interface SslCommandOptions {
  provider?: string;
  domain?: string;
  email?: string;
  path?: string;
  dryRun?: boolean;
}

async function promptSslOptions(preOptions: SslCommandOptions): Promise<Required<Pick<SslCommandOptions, 'provider' | 'domain' | 'email'>>> {
  const { default: Enquirer } = await import('enquirer');
  const enquirer = new Enquirer();

  let sslProvider = preOptions.provider;
  if (!sslProvider) {
    const ans = await enquirer.prompt({
      type: 'select',
      name: 'provider',
      message: 'SSL provider',
      choices: [
        { name: 'Certbot (Let\'s Encrypt + Nginx)', value: 'certbot' },
        { name: 'Caddy (automatic HTTPS, replaces Nginx)', value: 'caddy' },
      ],
    }) as { provider: string };
    sslProvider = ans.provider;
  }

  let domain = preOptions.domain;
  if (!domain) {
    const ans = await enquirer.prompt({
      type: 'input',
      name: 'domain',
      message: 'Domain name (e.g. example.com)',
    }) as { domain: string };
    domain = ans.domain;
  }

  let email = preOptions.email;
  if (!email && sslProvider === 'certbot') {
    const ans = await enquirer.prompt({
      type: 'input',
      name: 'email',
      message: 'Email address (for Let\'s Encrypt notifications)',
    }) as { email: string };
    email = ans.email;
  }

  return { provider: sslProvider!, domain: domain!, email: email ?? '' };
}

export async function sslCommand(options: SslCommandOptions): Promise<void> {
  const rootDir = options.path || process.cwd();

  log.banner();
  log.header('SSL / TLS Setup');

  let stackResult: DetectionResult | null = null;
  try {
    const project = await withSpinner('Detecting project stack', () => detectProject(rootDir));
    stackResult = project.primary;
    if (stackResult) {
      log.success(`Detected: ${chalk.bold(stackResult.stack.toUpperCase())}`);
    }
  } catch {
    log.dim('Could not detect stack — generating stack-agnostic SSL config.');
  }

  log.break();

  let answers: Required<Pick<SslCommandOptions, 'provider' | 'domain' | 'email'>>;
  try {
    answers = await promptSslOptions(options);
  } catch {
    log.warn('Non-interactive mode. Provide --provider, --domain, and --email flags.');
    process.exitCode = 1;
    return;
  }

  if (!answers.domain) {
    log.error('Domain is required.');
    process.exitCode = 1;
    return;
  }

  const fakeDetection: DetectionResult = stackResult ?? {
    stack: 'node',
    confidence: 50,
    details: {},
    databases: [],
  };

  const baseCtx = buildContext(rootDir, fakeDetection);
  const ctx: GeneratorContext = {
    ...baseCtx,
    domain: answers.domain,
    email: answers.email,
    sslProvider: answers.provider,
  };

  const generators = [certbotScriptGenerator, certbotNginxGenerator, caddyfileGenerator];
  const files = (await Promise.all(generators.map((g) => g.generate(ctx)))).filter(
    (f): f is NonNullable<typeof f> => f !== null,
  );

  log.break();
  log.header(`SSL files ${options.dryRun ? '(preview)' : ''}`);

  const results = await writeGeneratedFiles(rootDir, files, { dryRun: options.dryRun });

  for (const r of results) {
    if (r.action === 'dry-run') {
      log.info(`${chalk.cyan('◎ would create')}  ${chalk.bold(r.path)}`);
    } else {
      log.success(`${chalk.green('✔ created')}  ${chalk.bold(r.path)}`);
    }
  }

  log.break();

  if (answers.provider === 'certbot') {
    log.header('Next steps (Certbot)');
    log.step('1. Copy setup-ssl.sh to your server and run it as root');
    log.step(`2. Replace your nginx.conf with nginx-ssl.conf`);
    log.step(`3. The script handles cert renewal automatically via cron`);
  } else {
    log.header('Next steps (Caddy)');
    log.step('1. Install Caddy: https://caddyserver.com/docs/install');
    log.step('2. Copy Caddyfile to your server');
    log.step('3. Run: sudo caddy run --config /path/to/Caddyfile');
    log.step('4. Caddy obtains and renews TLS certs automatically');
  }

  log.break();
}
