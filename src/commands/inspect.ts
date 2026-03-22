import chalk from 'chalk';
import { detectProject } from '../detector/index.js';
import { log } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import { resolveAllPlugins } from '../config/plugin.js';

export async function inspectCommand(options: { path?: string }): Promise<void> {
  const rootDir = options.path || process.cwd();

  log.banner();
  log.header('Inspecting project...');

  // Load plugins so extra detectors can contribute
  const { detectors: extraDetectors } = await resolveAllPlugins(rootDir);
  if (extraDetectors.length > 0) {
    log.dim(`Plugins: ${extraDetectors.length} extra detector(s) loaded`);
  }

  const project = await withSpinner('Scanning project files', () => detectProject(rootDir, extraDetectors));

  if (!project.primary) {
    log.warn('Could not detect a known stack in this project.');
    log.dim('Supported stacks: Django, FastAPI, Node.js (Express, Next.js, Vite, NestJS, Fastify)');
    log.break();
    log.info('Make sure you are running this command from your project root directory.');
    return;
  }

  const primary = project.primary;

  log.success(`Detected: ${chalk.bold(primary.stack.toUpperCase())} (confidence: ${primary.confidence}%)`);
  log.break();

  log.header('Project details');
  const rows: [string, string][] = [
    ['Directory', rootDir],
    ['Stack', primary.stack],
    ['Confidence', `${primary.confidence}%`],
  ];

  if (primary.nodeSubType) {
    rows.push(['Framework', primary.nodeSubType]);
  }

  if (primary.databases.length > 0) {
    rows.push(['Databases', primary.databases.map((d) => d.type).join(', ')]);
  }

  for (const [key, value] of Object.entries(primary.details)) {
    rows.push([key, value]);
  }

  log.table(rows);

  if (project.detections.length > 1) {
    log.break();
    log.dim('Other possible stacks detected:');
    for (const d of project.detections.slice(1)) {
      log.dim(`  ${d.stack} (${d.confidence}%)`);
    }
  }

  // Monorepo section
  if (project.monorepo) {
    const { monorepo } = project;
    log.break();
    log.header(`Monorepo (${monorepo.type})`);
    log.info(`${monorepo.packages.length} workspace package(s) detected:`);
    for (const pkg of monorepo.packages) {
      const stackLabel = pkg.stack ? chalk.dim(` → ${pkg.stack.stack} (${pkg.stack.confidence}%)`) : '';
      log.info(`  ${chalk.bold(pkg.name)}  ${chalk.dim(pkg.path)}${stackLabel}`);
    }
  }

  log.break();
  log.step(`Next: run ${chalk.cyan('dank-trank generate')} to create infrastructure files`);
  log.break();
}
