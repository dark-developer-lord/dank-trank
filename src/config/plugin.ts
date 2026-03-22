import { join } from 'node:path';
import { fileExists } from '../utils/fs.js';
import { log } from '../utils/logger.js';
import type { Detector } from '../detector/types.js';
import type { Generator } from '../generators/types.js';

export interface PluginModule {
  detectors?: Detector[];
  generators?: Generator[];
  name?: string;
}

export interface ResolvedPlugins {
  detectors: Detector[];
  generators: Generator[];
}

/**
 * Try to load a project-local dank-trank.config.js
 */
export async function loadPluginFile(rootDir: string): Promise<PluginModule[]> {
  const configPath = join(rootDir, 'dank-trank.config.js');
  if (!(await fileExists(configPath))) return [];

  try {
    const mod = await import(configPath) as { default?: PluginModule } | PluginModule;
    const plugin = ('default' in mod && mod.default) ? mod.default : mod as PluginModule;
    validatePlugin(plugin, configPath);
    return [plugin];
  } catch (err) {
    log.warn(`Failed to load plugin file ${configPath}: ${String(err)}`);
    return [];
  }
}

/**
 * Scan node_modules for packages matching:
 *   dank-trank-plugin-*
 *   @dank-trank/plugin-*
 */
export async function discoverNpmPlugins(rootDir: string): Promise<PluginModule[]> {
  const nodeModulesDir = join(rootDir, 'node_modules');
  if (!(await fileExists(nodeModulesDir))) return [];

  const { readdirSync } = await import('node:fs');
  const plugins: PluginModule[] = [];

  try {
    const entries = readdirSync(nodeModulesDir);

    // Flat packages: dank-trank-plugin-*
    for (const entry of entries) {
      if (entry.startsWith('dank-trank-plugin-')) {
        const pkgPath = join(nodeModulesDir, entry);
        const plugin = await tryLoadNpmPlugin(pkgPath, entry);
        if (plugin) plugins.push(plugin);
      }
    }

    // Scoped packages: @dank-trank/plugin-*
    const scopedDir = join(nodeModulesDir, '@dank-trank');
    if (await fileExists(scopedDir)) {
      try {
        const scopedEntries = readdirSync(scopedDir);
        for (const entry of scopedEntries) {
          if (entry.startsWith('plugin-')) {
            const pkgPath = join(scopedDir, entry);
            const plugin = await tryLoadNpmPlugin(pkgPath, `@dank-trank/${entry}`);
            if (plugin) plugins.push(plugin);
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return plugins;
}

async function tryLoadNpmPlugin(pkgPath: string, name: string): Promise<PluginModule | null> {
  try {
    const pkgJsonPath = join(pkgPath, 'package.json');
    if (!(await fileExists(pkgJsonPath))) return null;

    const raw = await import(join(pkgPath, 'package.json'), { assert: { type: 'json' } }) as {
      default: { main?: string };
    };
    const main = raw.default.main ?? 'index.js';
    const entryPath = join(pkgPath, main);

    const mod = await import(entryPath) as { default?: PluginModule } | PluginModule;
    const plugin = ('default' in mod && mod.default) ? mod.default : mod as PluginModule;
    validatePlugin(plugin, name);
    return plugin;
  } catch (err) {
    log.warn(`Failed to load npm plugin ${name}: ${String(err)}`);
    return null;
  }
}

function validatePlugin(plugin: unknown, source: string): void {
  if (typeof plugin !== 'object' || plugin === null) {
    throw new Error(`Plugin from ${source} must export an object`);
  }
  const p = plugin as Record<string, unknown>;
  if (p['detectors'] !== undefined && !Array.isArray(p['detectors'])) {
    throw new Error(`Plugin ${source}: detectors must be an array`);
  }
  if (p['generators'] !== undefined && !Array.isArray(p['generators'])) {
    throw new Error(`Plugin ${source}: generators must be an array`);
  }
}

/**
 * Resolve all plugins from both sources and merge results.
 */
export async function resolveAllPlugins(rootDir: string): Promise<ResolvedPlugins> {
  const [filePlugins, npmPlugins] = await Promise.all([
    loadPluginFile(rootDir),
    discoverNpmPlugins(rootDir),
  ]);

  const allPlugins = [...filePlugins, ...npmPlugins];

  return {
    detectors: allPlugins.flatMap((p) => p.detectors ?? []),
    generators: allPlugins.flatMap((p) => p.generators ?? []),
  };
}
