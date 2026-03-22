import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../renderer/index.js';
import type { Generator, GeneratorContext, GeneratedFile } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'k8s');

async function loadK8sTemplate(file: string): Promise<string> {
  return readFile(join(TEMPLATES_DIR, file), 'utf-8');
}

function isK8sContext(ctx: GeneratorContext): boolean {
  return !!ctx.k8s;
}

function getK8sContext(ctx: GeneratorContext): Record<string, unknown> {
  const k8s = ctx.k8s as Record<string, unknown> | undefined;
  return {
    ...ctx,
    namespace: k8s?.namespace ?? 'default',
    image: k8s?.image ?? `${ctx.projectName}:latest`,
    replicas: k8s?.replicas ?? 2,
    cpuLimit: k8s?.cpuLimit ?? '500m',
    memoryLimit: k8s?.memoryLimit ?? '512Mi',
    minReplicas: k8s?.minReplicas ?? 2,
    maxReplicas: k8s?.maxReplicas ?? 10,
    domain: k8s?.domain ?? '',
    hasDomain: !!(k8s?.domain),
  };
}

export const k8sNamespaceGenerator: Generator = {
  name: 'k8s/namespace.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('namespace.yaml.hbs');
    return {
      relativePath: 'k8s/namespace.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Kubernetes Namespace',
    };
  },
};

export const k8sConfigMapGenerator: Generator = {
  name: 'k8s/configmap.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('configmap.yaml.hbs');
    return {
      relativePath: 'k8s/configmap.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Kubernetes ConfigMap',
    };
  },
};

export const k8sSecretTemplateGenerator: Generator = {
  name: 'k8s/secret.template.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('secret.template.yaml.hbs');
    return {
      relativePath: 'k8s/secret.template.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Kubernetes Secret template (fill in values before applying)',
    };
  },
};

export const k8sDeploymentGenerator: Generator = {
  name: 'k8s/deployment.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('deployment.yaml.hbs');
    return {
      relativePath: 'k8s/deployment.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Kubernetes Deployment (RollingUpdate, non-root, resource limits)',
    };
  },
};

export const k8sServiceGenerator: Generator = {
  name: 'k8s/service.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('service.yaml.hbs');
    return {
      relativePath: 'k8s/service.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Kubernetes Service (ClusterIP)',
    };
  },
};

export const k8sIngressGenerator: Generator = {
  name: 'k8s/ingress.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const k8sCtx = getK8sContext(ctx);
    // Skip ingress generation when no domain is configured
    if (!k8sCtx.hasDomain) return null;
    const template = await loadK8sTemplate('ingress.yaml.hbs');
    return {
      relativePath: 'k8s/ingress.yaml',
      content: render(template, k8sCtx),
      description: 'Kubernetes Ingress (nginx ingress controller)',
    };
  },
};

export const k8sHpaGenerator: Generator = {
  name: 'k8s/hpa.yaml',
  async generate(ctx: GeneratorContext): Promise<GeneratedFile | null> {
    if (!isK8sContext(ctx)) return null;
    const template = await loadK8sTemplate('hpa.yaml.hbs');
    return {
      relativePath: 'k8s/hpa.yaml',
      content: render(template, getK8sContext(ctx)),
      description: 'Horizontal Pod Autoscaler (CPU + memory targets)',
    };
  },
};
