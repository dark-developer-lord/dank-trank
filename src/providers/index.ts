import type { DeployProvider } from './types.js';

const createStubProvider = (name: string, slug: string): DeployProvider => ({
  name,
  slug,
  async deploy() {
    throw new Error(`${name} deployment is coming soon. Follow the roadmap for updates.`);
  },
});

export const digitalocean = createStubProvider('DigitalOcean', 'digitalocean');
export const vercel = createStubProvider('Vercel', 'vercel');
export const aws = createStubProvider('AWS', 'aws');

export const providers: DeployProvider[] = [digitalocean, vercel, aws];

export function getProvider(slug: string): DeployProvider | undefined {
  return providers.find((p) => p.slug === slug);
}
