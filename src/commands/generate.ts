import chalk from 'chalk';
import { createRequire } from 'node:module';
import { detectProject } from '../detector/index.js';
import { buildContext, generateAll, writeGeneratedFiles } from '../generators/index.js';
import { log } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import type { WriteResult } from '../utils/fs.js';
import type { DetectionResult } from '../detector/types.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json') as { version: string };

interface GenerateCommandOptions {
  path?: string;
  dryRun?: boolean;
  force?: boolean;
  outputDir?: string;
}

function printResults(results: WriteResult[], dryRun: boolean): void {
  const icons: Record<string, string> = {
    'created': chalk.green('✔ created'),
    'overwritten': chalk.yellow('↻ overwritten'),
    'skipped': chalk.dim('⊘ skipped (exists, use --force)'),
    'dry-run': chalk.cyan('◎ would create'),
  };

  for (const r of results) {
    const icon = icons[r.action] || r.action;
    log.info(`${icon}  ${chalk.bold(r.path)}`);
    if (r.backupPath) {
      log.dim(`  backup → ${r.backupPath}`);
    }
  }

  log.break();
  const created = results.filter((r) => r.action === 'created').length;
  const overwritten = results.filter((r) => r.action === 'overwritten').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;

  if (dryRun) {
    log.info(`Dry run complete. ${results.length} files would be generated.`);
    log.step(`Run ${chalk.cyan('dank-trank generate')} (without --dry-run) to write files.`);
  } else {
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} created`);
    if (overwritten > 0) parts.push(`${overwritten} overwritten`);
    if (skipped > 0) parts.push(`${skipped} skipped`);
    log.success(`Done! ${parts.join(', ')}.`);
  }
}

function printSummaryCard(primary: DetectionResult, fileCount: number): void {
  const dbNames = primary.databases.map((d) => d.type).join(', ');
  const stackLabel = dbNames
    ? `${primary.stack.charAt(0).toUpperCase() + primary.stack.slice(1)} + ${dbNames}`
    : primary.stack.charAt(0).toUpperCase() + primary.stack.slice(1);

  const lines = [
    `  dank-trank v${version}`,
    ``,
    `  Stack:     ${stackLabel}`,
    `  Files:     ${fileCount} generated`,
    ``,
    `  Next: docker compose up --build`,
  ];

  const width = 45;
  const top = chalk.cyan('┌' + '─'.repeat(width) + '┐');
  const bottom = chalk.cyan('└' + '─'.repeat(width) + '┘');
  const body = lines.map((l) => chalk.cyan('│') + l.padEnd(width) + chalk.cyan('│')).join('\n');

  console.log(`\n${top}\n${body}\n${bottom}\n`);
}

export async function generateCommand(options: GenerateCommandOptions): Promise<void> {
  const rootDir = options.path || process.cwd();

  log.banner();

  const project = await withSpinner('Detecting project stack', () => detectProject(rootDir));

  if (!project.primary) {
    log.error('Could not detect a known stack in this project.');
    log.dim('Supported stacks: Django, FastAPI, Node.js (Express, Next.js, Vite, NestJS, Fastify)');
    log.break();
    log.info('Make sure you are running this command from your project root directory.');
    process.exitCode = 1;
    return;
  }

  const primary = project.primary;
  log.success(`Detected: ${chalk.bold(primary.stack.toUpperCase())} (confidence: ${primary.confidence}%)`);

  if (options.dryRun) {
    log.info(chalk.cyan('Dry run mode — no files will be written.'));
  }

  log.break();

  const ctx = buildContext(rootDir, primary);
  const files = await withSpinner('Generating infrastructure files', () => generateAll(ctx));

  log.break();
  log.header(`Files ${options.dryRun ? '(preview)' : ''}`);

  const results = await writeGeneratedFiles(rootDir, files, {
    dryRun: options.dryRun,
    force: options.force,
    outputDir: options.outputDir,
  });

  printResults(results, !!options.dryRun);

  if (!options.dryRun) {
    const created = results.filter((r) => r.action === 'created' || r.action === 'overwritten').length;
    printSummaryCard(primary, created);
  }
}
