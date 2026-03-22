# Adding a New Stack

This guide walks you through adding support for a new framework/stack to dank-trank.

## Overview

To add a new stack (e.g., Ruby on Rails, Go, Rust), you need to create:

1. A **detector** — identifies the stack from project files
2. **Templates** — Dockerfile, docker-compose.yml, nginx.conf, deploy.yml
3. Register the detector in the orchestrator
4. Add **tests**

## Step 1: Create the Detector

Create `src/detector/<stack>.ts`:

```typescript
import type { Detector, DetectionResult } from './types.js';
import { fileExists, readProjectFile } from '../utils/fs.js';
import { join } from 'node:path';

export const myStackDetector: Detector = {
  name: 'MyStack',

  async detect(rootDir: string): Promise<DetectionResult | null> {
    let confidence = 0;
    const details: Record<string, string> = {};

    // Check for key files
    if (await fileExists(join(rootDir, 'key-file.ext'))) {
      confidence += 40;
      details['key-file.ext'] = 'found';
    }

    // Check dependencies
    const depFile = await readProjectFile(rootDir, 'deps.txt');
    if (depFile && /mystack/i.test(depFile)) {
      confidence += 40;
      details['mystack dependency'] = 'found';
    }

    if (confidence === 0) return null;

    return {
      stack: 'mystack' as any, // Add to StackType first
      confidence: Math.min(confidence, 100),
      details,
    };
  },
};
```

## Step 2: Add to StackType

In `src/detector/types.ts`, add your stack:

```typescript
export type StackType = 'django' | 'fastapi' | 'node' | 'mystack';
```

## Step 3: Create Templates

Create 4 template files in `src/templates/mystack/`:

- `Dockerfile.hbs`
- `docker-compose.yml.hbs`
- `nginx.conf.hbs`
- `deploy.yml.hbs`

Use `{{variable}}` for interpolation. Available variables:
- `{{projectName}}` — project folder name
- `{{port}}` — default port
- Any custom variables from your detector's `details`

## Step 4: Register the Detector

In `src/detector/index.ts`:

```typescript
import { myStackDetector } from './mystack.js';

const detectors: Detector[] = [
  djangoDetector,
  fastapiDetector,
  nodeDetector,
  myStackDetector,  // Add here
];
```

## Step 5: Set Default Port

In `src/generators/index.ts` `getDefaultPort()`:

```typescript
case 'mystack': return 4000;
```

## Step 6: Add Tests

Create `tests/detector/mystack.test.ts` and a test fixture in `tests/fixtures/mystack-project/`.

## Step 7: Update tsup.config.ts

Add your stack to the `stacks` array in the `copyTemplates()` function.

## Done!

Run tests: `pnpm test`
Build: `pnpm build`
Try it: `node dist/cli/index.js inspect --path tests/fixtures/mystack-project`
