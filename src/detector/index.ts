import type { ProjectInfo, Detector } from './types.js';
import { djangoDetector } from './django.js';
import { fastapiDetector } from './fastapi.js';
import { nodeDetector } from './node.js';
import { detectDatabases } from './database.js';

const detectors: Detector[] = [djangoDetector, fastapiDetector, nodeDetector];

export async function detectProject(rootDir: string): Promise<ProjectInfo> {
  const results = await Promise.all(
    detectors.map((d) => d.detect(rootDir)),
  );

  const detections = results.filter((r) => r !== null);

  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence);

  // Run database detection for each detected stack
  await Promise.all(
    detections.map(async (detection) => {
      detection.databases = await detectDatabases(rootDir, detection.stack);
    }),
  );

  return {
    rootDir,
    detections,
    primary: detections.length > 0 ? detections[0] : null,
  };
}

export { type ProjectInfo, type DetectionResult, type StackType, type NodeSubType, type DatabaseInfo, type DatabaseType } from './types.js';
