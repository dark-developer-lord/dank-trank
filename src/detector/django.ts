import type { Detector, DetectionResult } from './types.js';
import { fileExists, readProjectFile } from '../utils/fs.js';
import { join } from 'node:path';

export const djangoDetector: Detector = {
  name: 'Django',

  async detect(rootDir: string): Promise<DetectionResult | null> {
    let confidence = 0;
    const details: Record<string, string> = {};

    // Check manage.py
    if (await fileExists(join(rootDir, 'manage.py'))) {
      confidence += 40;
      details['manage.py'] = 'found';
    }

    // Check for settings.py in any subdirectory pattern
    const requirementsTxt = await readProjectFile(rootDir, 'requirements.txt');
    const pyprojectToml = await readProjectFile(rootDir, 'pyproject.toml');

    // Check dependency files for django
    if (requirementsTxt) {
      details['requirements.txt'] = 'found';
      if (/django/i.test(requirementsTxt)) {
        confidence += 30;
        details['django dependency'] = 'requirements.txt';
      }
    }

    if (pyprojectToml) {
      details['pyproject.toml'] = 'found';
      if (/django/i.test(pyprojectToml)) {
        confidence += 30;
        details['django dependency'] = 'pyproject.toml';
      }
    }

    // Check for wsgi.py or asgi.py
    const wsgiContent = await readProjectFile(rootDir, 'wsgi.py');
    const asgiContent = await readProjectFile(rootDir, 'asgi.py');
    if (wsgiContent || asgiContent) {
      confidence += 20;
      details['wsgi/asgi'] = 'found';
    }

    // Check for Pipfile
    const pipfile = await readProjectFile(rootDir, 'Pipfile');
    if (pipfile && /django/i.test(pipfile)) {
      confidence += 20;
      details['django dependency'] = 'Pipfile';
    }

    if (confidence === 0) return null;

    return {
      stack: 'django',
      confidence: Math.min(confidence, 100),
      details,
    };
  },
};
