export type StackType = 'django' | 'fastapi' | 'node';

export type NodeSubType = 'express' | 'nextjs' | 'vite' | 'nestjs' | 'fastify' | 'generic';

export type DatabaseType = 'postgres' | 'mongodb' | 'redis';

export interface DatabaseInfo {
  type: DatabaseType;
  detectedFrom: string;
}

export interface DetectionResult {
  stack: StackType;
  confidence: number; // 0-100
  details: Record<string, string>;
  nodeSubType?: NodeSubType;
  databases: DatabaseInfo[];
}

export interface ProjectInfo {
  rootDir: string;
  detections: DetectionResult[];
  primary: DetectionResult | null;
}

export interface Detector {
  name: string;
  detect(rootDir: string): Promise<DetectionResult | null>;
}
