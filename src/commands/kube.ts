import chalk from 'chalk';
import { basename } from 'node:path';
import { log } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import { writeGeneratedFiles } from '../generators/index.js';
import {
  k8sNamespaceGenerator,
  k8sConfigMapGenerator,
  k8sSecretTemplateGenerator,
  k8sDeploymentGenerator,
  k8sServiceGenerator,
  k8sIngressGenerator,
  k8sHpaGenerator,
} from '../generators/kubernetes.js';
import type { GeneratorContext } from '../generators/types.js';
import type { DetectionResult } from '../detector/types.js';
import { detectProject } from '../detector/index.js';

interface KubeCommandOptions {
  path?: string;
  image?: string;
  replicas?: string;
  domain?: string;
  namespace?: string;
  dryRun?: boolean;
}

interface KubeWizardAnswers {
  image: string;
  replicas: number;
  domain: string;
  namespace: string;
}

async function promptKubeOptions(opts: KubeCommandOptions, projectName: string): Promise<KubeWizardAnswers> {
  // If all flags provided, skip prompts
  if (opts.image && opts.replicas && opts.namespace) {
    return {
      image: opts.image,
      replicas: parseInt(opts.replicas, 10) || 2,
      domain: opts.domain ?? '',
      namespace: opts.namespace,
    };
  }

  const { default: Enquirer } = await import('enquirer');
  const enquirer = new Enquirer();

  const imageAns = await enquirer.prompt({
    type: 'input',
    name: 'image',
    message: 'Docker image (e.g. ghcr.io/you/app:latest)',
    initial: opts.image ?? `${projectName}:latest`,
  }) as { image: string };

  const replicasAns = await enquirer.prompt({
    type: 'input',
    name: 'replicas',
    message: 'Initial replicas',
    initial: opts.replicas ?? '2',
  }) as { replicas: string };

  const domainAns = await enquirer.prompt({
    type: 'input',
    name: 'domain',
    message: 'Ingress domain (leave blank to skip TLS)',
    initial: opts.domain ?? '',
  }) as { domain: string };

  const nsAns = await enquirer.prompt({
    type: 'input',
    name: 'namespace',
    message: 'Kubernetes namespace',
    initial: opts.namespace ?? projectName,
  }) as { namespace: string };

  return {
    image: imageAns.image,
    replicas: parseInt(replicasAns.replicas, 10) || 2,
    domain: domainAns.domain,
    namespace: nsAns.namespace,
  };
}

export async function kubeCommand(options: KubeCommandOptions): Promise<void> {
  const rootDir = options.path || process.cwd();
  const projectName = basename(rootDir).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

  log.banner();
  log.header('Kubernetes Manifests');

  let primary: DetectionResult | null = null;
  try {
    const project = await withSpinner('Detecting project stack', () => detectProject(rootDir));
    primary = project.primary;
    if (primary) {
      log.success(`Detected: ${chalk.bold(primary.stack.toUpperCase())}`);
    }
  } catch {
    log.dim('Could not detect stack — using generic config.');
  }

  let answers: KubeWizardAnswers;
  try {
    answers = await promptKubeOptions(options, projectName);
  } catch {
    log.warn('Non-interactive mode. Provide --image, --replicas, --domain, --namespace flags.');
    process.exitCode = 1;
    return;
  }

  const port = primary?.stack === 'node' ? 3000 : 8000;

  const ctx: GeneratorContext = {
    projectName,
    port,
    stack: primary ?? {
      stack: 'node',
      confidence: 50,
      details: {},
      databases: [],
    },
    k8s: {
      namespace: answers.namespace,
      image: answers.image,
      replicas: answers.replicas,
      domain: answers.domain || undefined,
      minReplicas: Math.max(1, answers.replicas - 1),
      maxReplicas: answers.replicas * 5,
      cpuLimit: '500m',
      memoryLimit: '512Mi',
    },
  };

  const generators = [
    k8sNamespaceGenerator,
    k8sConfigMapGenerator,
    k8sSecretTemplateGenerator,
    k8sDeploymentGenerator,
    k8sServiceGenerator,
    k8sIngressGenerator,
    k8sHpaGenerator,
  ];

  const files = await withSpinner('Generating k8s manifests', async () => {
    const results = await Promise.all(generators.map((g) => g.generate(ctx)));
    return results.filter((f): f is NonNullable<typeof f> => f !== null);
  });

  log.break();
  log.header(`Kubernetes files ${options.dryRun ? '(preview)' : ''}`);

  const results = await writeGeneratedFiles(rootDir, files, { dryRun: options.dryRun });

  for (const r of results) {
    if (r.action === 'dry-run') {
      log.info(`${chalk.cyan('◎ would create')}  ${chalk.bold(r.path)}`);
    } else {
      log.success(`${chalk.green('✔ created')}  ${chalk.bold(r.path)}`);
    }
  }

  log.break();
  log.header('Next steps');
  log.step(`1. Fill in secrets: edit ${chalk.bold('k8s/secret.template.yaml')} and rename to secret.yaml`);
  log.step('2. Apply manifests:');
  log.step(`   kubectl apply -f k8s/namespace.yaml`);
  log.step(`   kubectl apply -f k8s/`);
  if (answers.domain) {
    log.step('3. Install cert-manager for automatic TLS:');
    log.step('   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml');
  }
  log.break();
}
