import { describe, it, expect } from 'vitest';
import { render } from '../../src/renderer/index.js';

describe('Template renderer', () => {
  it('replaces simple variables', () => {
    expect(render('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
  });

  it('handles nested variable paths', () => {
    expect(render('{{a.b}}', { a: { b: 'deep' } })).toBe('deep');
  });

  it('renders empty string for missing variables', () => {
    expect(render('Hello {{missing}}!', {})).toBe('Hello !');
  });

  it('renders #if blocks when truthy', () => {
    const tpl = '{{#if show}}visible{{/if}}';
    expect(render(tpl, { show: true })).toBe('visible');
  });

  it('hides #if blocks when falsy', () => {
    const tpl = '{{#if show}}visible{{/if}}';
    expect(render(tpl, { show: false })).toBe('');
    expect(render(tpl, {})).toBe('');
  });

  it('renders #if/else blocks', () => {
    const tpl = '{{#if show}}yes{{else}}no{{/if}}';
    expect(render(tpl, { show: true })).toBe('yes');
    expect(render(tpl, { show: false })).toBe('no');
  });

  it('renders #unless blocks', () => {
    const tpl = '{{#unless hidden}}visible{{/unless}}';
    expect(render(tpl, { hidden: false })).toBe('visible');
    expect(render(tpl, { hidden: true })).toBe('');
  });

  it('renders #each blocks with arrays of strings', () => {
    const tpl = '{{#each items}}[{{.}}]{{/each}}';
    expect(render(tpl, { items: ['a', 'b', 'c'] })).toBe('[a][b][c]');
  });

  it('renders #each blocks with objects', () => {
    const tpl = '{{#each users}}{{name}},{{/each}}';
    expect(render(tpl, { users: [{ name: 'Alice' }, { name: 'Bob' }] })).toBe('Alice,Bob,');
  });

  it('handles empty arrays in #each', () => {
    const tpl = '{{#each items}}x{{/each}}';
    expect(render(tpl, { items: [] })).toBe('');
  });

  it('handles complex templates', () => {
    const tpl = `FROM node:{{nodeVersion}}
{{#if usePnpm}}RUN corepack enable{{/if}}
EXPOSE {{port}}`;
    expect(render(tpl, { nodeVersion: '20', usePnpm: true, port: 3000 }))
      .toBe('FROM node:20\nRUN corepack enable\nEXPOSE 3000');
  });
});
