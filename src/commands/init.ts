import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { inspectCommand } from './inspect.js';
import { generateCommand } from './generate.js';

export async function initCommand(options: { path?: string; force?: boolean }): Promise<void> {
  const rootDir = options.path || process.cwd();

  log.banner();
  log.header('Welcome to Setup My Startup!');
  log.info("Let's get your project production-ready.\n");

  // Step 1: Inspect
  log.step('Step 1: Inspecting your project...');
  log.break();
  await inspectCommand({ path: rootDir });

  // Step 2: Ask to generate
  log.break();
  log.step('Step 2: Generating infrastructure files...');
  log.break();

  try {
    const { default: Enquirer } = await import('enquirer');
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: 'confirm',
      name: 'proceed',
      message: 'Generate infrastructure files for this project?',
      initial: true,
    }) as { proceed: boolean };

    if (!response.proceed) {
      log.info('Skipped. You can run this again anytime.');
      return;
    }
  } catch {
    // Non-interactive mode — proceed
    log.dim('Non-interactive mode, proceeding...');
  }

  await generateCommand({ path: rootDir, force: options.force });

  log.break();
  log.success(chalk.bold('Your project is now production-ready! 🚀'));
  log.break();
}
