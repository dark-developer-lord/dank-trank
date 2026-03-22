import { Command } from 'commander';
import { createRequire } from 'node:module';
import { inspectCommand } from '../commands/inspect.js';
import { generateCommand } from '../commands/generate.js';
import { initCommand } from '../commands/init.js';
import { deployCommand } from '../commands/deploy.js';
import { doctorCommand } from '../commands/doctor.js';
import { sslCommand } from '../commands/ssl.js';
import { kubeCommand } from '../commands/kube.js';
import { handleError } from '../utils/exit.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json') as { version: string };

const program = new Command();

program
  .name('dank-trank')
  .description('From idea to live app in 1 command. Auto-detect your stack, generate production-ready infrastructure.')
  .version(version);

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
  .option('--k8s', 'Also generate Kubernetes manifests in k8s/ directory')
  .action(async (options) => {
    try {
      await generateCommand({
        path: options.path,
        dryRun: options.dryRun,
        force: options.force,
        outputDir: options.outputDir,
        k8s: options.k8s,
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

program
  .command('ssl')
  .description('Set up SSL/TLS with Let\'s Encrypt (certbot) or Caddy')
  .option('--provider <provider>', 'SSL provider: certbot or caddy')
  .option('--domain <domain>', 'Domain name for the certificate')
  .option('--email <email>', 'Email for Let\'s Encrypt registration (certbot only)')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .option('-d, --dry-run', 'Preview files without writing them')
  .action(async (options) => {
    try {
      await sslCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('kube')
  .description('Generate Kubernetes manifests (Deployment, Service, Ingress, HPA, etc.)')
  .option('-p, --path <path>', 'Project root directory', process.cwd())
  .option('--image <image>', 'Docker image (e.g. registry.example.com/app:latest)')
  .option('--replicas <n>', 'Number of replicas', '2')
  .option('--domain <domain>', 'Ingress domain')
  .option('--namespace <ns>', 'Kubernetes namespace', 'default')
  .option('-d, --dry-run', 'Preview files without writing them')
  .action(async (options) => {
    try {
      await kubeCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program.parse();
