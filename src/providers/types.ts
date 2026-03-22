export interface ProviderDeployOptions {
  appName: string;
  port?: number;
  region?: string;
  domain?: string;
  plan?: string;
  onFailure?: () => void;
}

export interface DeployProvider {
  name: string;
  slug: string;
  /** Path to the generated config file relative to project root */
  configFile: string;
  /** Generate the provider-specific config file and return its absolute path */
  generateConfig(rootDir: string, options: ProviderDeployOptions): Promise<string>;
  /** Check if the provider CLI is installed */
  checkCli(): boolean;
  /** Execute the deploy CLI */
  runDeploy(configPath: string, options?: ProviderDeployOptions): void;
  /** Lines to print when CLI is not installed */
  installInstructions: string[];
  /** Lines to print after generation as next-step guidance */
  postDeployInstructions(options: ProviderDeployOptions): string[];
}
