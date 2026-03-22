export interface DeployProvider {
  name: string;
  slug: string;
  deploy(rootDir: string, config: Record<string, unknown>): Promise<void>;
}
