import { Command } from 'commander';
import { inspectCommand } from '../commands/inspect.js';
import { generateCommand } from '../commands/generate.js';
import { initCommand } from '../commands/init.js';
import { deployCommand } from '../commands/deploy.js';
import { doctorCommand } from '../commands/doctor.js';
import { handleError } from '../utils/exit.js';

const program = new Command();

program
  .name('setup-my-startup')
  .description('From idea to live app in 1 command. Auto-detect your stack, generate production-ready infrastructure.')
  .version('0.1.0');

program
  .command('inspect')
  .description('Detect and display project stack information')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .action(async (options) => {
    try {
      await inspectCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('generate')
  .description('Generate Dockerfile, docker-compose.yml, nginx.conf, and CI/CD workflow')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .option('-d, --dry-run', 'Preview files without writing them')
  .option('-f, --force', 'Overwrite existing files (with backup)')
  .option('-o, --output-dir <dir>', 'Output directory (default: project root)')
  .action(async (options) => {
    try {
      await generateCommand({
        path: options.path,
        dryRun: options.dryRun,
        force: options.force,
        outputDir: options.outputDir,
      });
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('init')
  .description('Interactive setup: inspect your project and generate infrastructure')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .option('-f, --force', 'Overwrite existing files (with backup)')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('deploy')
  .description('Deploy to cloud provider (coming soon)')
  .option('--provider <provider>', 'Cloud provider (digitalocean, vercel, aws)')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .action(async (options) => {
    try {
      await deployCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('doctor')
  .description('Check your environment for required tools')
  .action(async () => {
    try {
      await doctorCommand();
    } catch (err) {
      handleError(err);
    }
  });

program.parse();
