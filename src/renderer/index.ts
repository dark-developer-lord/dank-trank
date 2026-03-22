/**
 * Micro template renderer — supports {{var}}, {{#if var}}...{{/if}}, {{#each var}}...{{/each}}.
 * No external dependencies. Sufficient for MVP templates.
 */

type Context = Record<string, unknown>;

export function render(template: string, context: Context): string {
  let result = template;

  // Process {{#each key}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, key: string, body: string) => {
      const arr = context[key];
      if (!Array.isArray(arr)) return '';
      return arr.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return render(body, { ...context, ...item, '.': item });
        }
        return render(body, { ...context, '.': item });
      }).join('');
    },
  );

  // Process {{#if key}}...{{else}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, body: string) => {
      const hasElse = body.includes('{{else}}');
      const val = context[key];
      const truthy = val !== undefined && val !== null && val !== false && val !== '' && val !== 0;

      if (hasElse) {
        const [ifBlock, elseBlock] = body.split('{{else}}');
        return truthy ? render(ifBlock, context) : render(elseBlock, context);
      }
      return truthy ? render(body, context) : '';
    },
  );

  // Process {{#unless key}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, key: string, body: string) => {
      const val = context[key];
      const truthy = val !== undefined && val !== null && val !== false && val !== '' && val !== 0;
      return truthy ? '' : render(body, context);
    },
  );

  // Replace {{var}} placeholders (including {{.}} for current item)
  result = result.replace(/\{\{(\w+(?:\.\w+)*|\.)\}\}/g, (_match, key: string) => {
    if (key === '.') {
      const val = context['.'];
      return val !== undefined && val !== null ? String(val) : '';
    }
    const parts = key.split('.');
    let val: unknown = context;
    for (const part of parts) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }
    return val !== undefined && val !== null ? String(val) : '';
  });

  return result;
}
