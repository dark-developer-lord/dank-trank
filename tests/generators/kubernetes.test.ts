import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { buildContext } from '../../src/generators/index.js';
import {
  k8sNamespaceGenerator,
  k8sConfigMapGenerator,
  k8sDeploymentGenerator,
  k8sServiceGenerator,
  k8sIngressGenerator,
  k8sHpaGenerator,
  k8sSecretTemplateGenerator,
} from '../../src/generators/kubernetes.js';
import { detectProject } from '../../src/detector/index.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');

async function makeK8sCtx(fixtureDir: string, k8sExtra: Record<string, unknown> = {}) {
  const project = await detectProject(join(FIXTURES, fixtureDir));
  return {
    ...buildContext(join(FIXTURES, fixtureDir), project.primary!),
    k8s: {
      namespace: 'production',
      image: 'registry.example.com/myapp:latest',
      replicas: 3,
      domain: 'app.example.com',
      minReplicas: 2,
      maxReplicas: 15,
      cpuLimit: '500m',
      memoryLimit: '512Mi',
      ...k8sExtra,
    },
  };
}

describe('Kubernetes generators', () => {
  it('all k8s generators return null when k8s flag is not set', async () => {
    const project = await detectProject(join(FIXTURES, 'node-project'));
    const ctx = buildContext(join(FIXTURES, 'node-project'), project.primary!);
    // k8s is NOT set on ctx
    for (const gen of [k8sNamespaceGenerator, k8sDeploymentGenerator, k8sServiceGenerator]) {
      const result = await gen.generate(ctx);
      expect(result).toBeNull();
    }
  });

  it('generates namespace manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sNamespaceGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/namespace.yaml');
    expect(result!.content).toContain('kind: Namespace');
    expect(result!.content).toContain('production');
  });

  it('generates configmap manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sConfigMapGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/configmap.yaml');
    expect(result!.content).toContain('kind: ConfigMap');
  });

  it('generates secret template manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sSecretTemplateGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/secret.template.yaml');
    expect(result!.content).toContain('kind: Secret');
  });

  it('generates deployment manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sDeploymentGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/deployment.yaml');
    expect(result!.content).toContain('kind: Deployment');
    expect(result!.content).toContain('registry.example.com/myapp:latest');
  });

  it('generates service manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sServiceGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/service.yaml');
    expect(result!.content).toContain('kind: Service');
  });

  it('generates ingress manifest when domain is set', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sIngressGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/ingress.yaml');
    expect(result!.content).toContain('kind: Ingress');
    expect(result!.content).toContain('app.example.com');
  });

  it('returns null for ingress when no domain', async () => {
    const ctx = await makeK8sCtx('node-project', { domain: undefined });
    const result = await k8sIngressGenerator.generate(ctx);
    expect(result).toBeNull();
  });

  it('generates HPA manifest', async () => {
    const ctx = await makeK8sCtx('node-project');
    const result = await k8sHpaGenerator.generate(ctx);
    expect(result).not.toBeNull();
    expect(result!.relativePath).toBe('k8s/hpa.yaml');
    expect(result!.content).toContain('HorizontalPodAutoscaler');
  });
});
