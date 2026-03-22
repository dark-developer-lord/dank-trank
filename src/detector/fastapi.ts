import type { Detector, DetectionResult } from './types.js';
import { fileExists, readProjectFile } from '../utils/fs.js';
import { join } from 'node:path';

export const fastapiDetector: Detector = {
  name: 'FastAPI',

  async detect(rootDir: string): Promise<DetectionResult | null> {
    let confidence = 0;
    const details: Record<string, string> = {};

    // Check main.py or app/main.py
    if (await fileExists(join(rootDir, 'main.py'))) {
      confidence += 20;
      details['main.py'] = 'found';
    }
    if (await fileExists(join(rootDir, 'app', 'main.py'))) {
      confidence += 20;
      details['app/main.py'] = 'found';
    }

    // Check dependency files for fastapi
    const requirementsTxt = await readProjectFile(rootDir, 'requirements.txt');
    const pyprojectToml = await readProjectFile(rootDir, 'pyproject.toml');

    if (requirementsTxt) {
      if (/fastapi/i.test(requirementsTxt)) {
        confidence += 40;
        details['fastapi dependency'] = 'requirements.txt';
      }
      if (/uvicorn/i.test(requirementsTxt)) {
        confidence += 15;
        details['uvicorn'] = 'requirements.txt';
      }
    }

    if (pyprojectToml) {
      if (/fastapi/i.test(pyprojectToml)) {
        confidence += 40;
        details['fastapi dependency'] = 'pyproject.toml';
      }
      if (/uvicorn/i.test(pyprojectToml)) {
        confidence += 15;
        details['uvicorn'] = 'pyproject.toml';
      }
    }

    // Check Pipfile
    const pipfile = await readProjectFile(rootDir, 'Pipfile');
    if (pipfile && /fastapi/i.test(pipfile)) {
      confidence += 30;
      details['fastapi dependency'] = 'Pipfile';
    }

    if (confidence === 0) return null;

    return {
      stack: 'fastapi',
      confidence: Math.min(confidence, 100),
      details,
    };
  },
};
