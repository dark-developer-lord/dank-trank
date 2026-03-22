import type { Detector } from '../detector/types.js';
import type { Generator } from '../generators/types.js';

export interface SetupConfig {
  projectName?: string;
  stack?: string;
  port?: number;
  outputDir?: string;
  providers?: string[];
  plugins?: string[];
}

export interface PluginDef {
  name?: string;
  detectors?: Detector[];
  generators?: Generator[];
}

export interface DankTrankConfig extends SetupConfig {
  plugins?: string[];
  detectors?: Detector[];
  generators?: Generator[];
}
