import { digitaloceanProvider } from './digitalocean.js';
import { vercelProvider } from './vercel.js';
import { awsProvider } from './aws.js';
import type { DeployProvider } from './types.js';

export { digitaloceanProvider as digitalocean } from './digitalocean.js';
export { vercelProvider as vercel } from './vercel.js';
export { awsProvider as aws } from './aws.js';

export const providers: DeployProvider[] = [digitaloceanProvider, vercelProvider, awsProvider];

export function getProvider(slug: string): DeployProvider | undefined {
  return providers.find((p) => p.slug === slug);
}
