import type { ProjectInfo, Detector } from './types.js';
import { djangoDetector } from './django.js';
import { fastapiDetector } from './fastapi.js';
import { nodeDetector } from './node.js';
import { detectDatabases } from './database.js';
import { detectMonorepo } from './monorepo.js';

const baseDetectors: Detector[] = [djangoDetector, fastapiDetector, nodeDetector];

export async function detectProject(rootDir: string, extraDetectors: Detector[] = []): Promise<ProjectInfo> {
  const allDetectors = [...baseDetectors, ...extraDetectors];

  const results = await Promise.all(
    allDetectors.map((d) => d.detect(rootDir)),
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

  // Detect monorepo
  const monorepo = await detectMonorepo(rootDir);
  if (monorepo) {
    // Run stack detection on each workspace package
    await Promise.all(
      monorepo.packages.map(async (pkg) => {
        const { join } = await import('node:path');
        const pkgResult = await detectProject(join(rootDir, pkg.path), extraDetectors);
        pkg.stack = pkgResult.primary ?? undefined;
      }),
    );
  }

  return {
    rootDir,
    detections,
    primary: detections.length > 0 ? detections[0] : null,
    ...(monorepo ? { monorepo } : {}),
  };
}

export {
  type ProjectInfo,
  type DetectionResult,
  type StackType,
  type NodeSubType,
  type DatabaseInfo,
  type DatabaseType,
  type MonorepoInfo,
  type WorkspacePackage,
} from './types.js';
