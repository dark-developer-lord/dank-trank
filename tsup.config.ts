import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function copyTemplates() {
  const stacks = ['django', 'fastapi', 'node'];
  for (const stack of stacks) {
    const srcDir = join('src', 'templates', stack);
    const destDir = join('dist', 'templates', stack);
    mkdirSync(destDir, { recursive: true });
    for (const file of readdirSync(srcDir)) {
      copyFileSync(join(srcDir, file), join(destDir, file));
    }
  }
}

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['enquirer'],
  onSuccess: async () => {
    copyTemplates();
    console.log('Templates copied to dist/templates/');
  },
});
