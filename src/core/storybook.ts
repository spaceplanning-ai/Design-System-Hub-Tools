/**
 * Bridges ComponentMeta -> Storybook. Controls, default args, and autodocs
 * descriptions are all derived from the single metadata source, so nothing is
 * hand-maintained twice.
 */
import type { ComponentMeta } from './types';
import { variantCount } from './defineComponent';

interface ArgType {
  control?: { type: string } | string | false;
  options?: string[];
  description?: string;
  table?: { category?: string; defaultValue?: { summary: string }; type?: { summary: string } };
}

export function argTypesFromMeta(meta: ComponentMeta): Record<string, ArgType> {
  const argTypes: Record<string, ArgType> = {};

  for (const v of meta.variantProps) {
    argTypes[v.name] = {
      control: 'select',
      options: v.options,
      description: v.description ?? `${v.label} variant property.`,
      table: {
        category: 'Variants',
        defaultValue: { summary: v.default },
        type: { summary: v.options.join(' | ') },
      },
    };
  }

  for (const p of meta.componentProps ?? []) {
    const control =
      p.type === 'boolean'
        ? 'boolean'
        : p.type === 'number'
          ? { type: 'number' }
          : p.type === 'select'
            ? 'select'
            : 'text';
    argTypes[p.name] = {
      control: p.type === 'instanceSwap' ? false : (control as ArgType['control']),
      options: p.options,
      description: p.description,
      table: {
        category: 'Properties',
        defaultValue: p.default !== undefined ? { summary: String(p.default) } : undefined,
      },
    };
  }

  return argTypes;
}

export function argsFromMeta(meta: ComponentMeta): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const v of meta.variantProps) args[v.name] = v.default;
  for (const p of meta.componentProps ?? []) {
    if (p.default !== undefined) args[p.name] = p.default;
  }
  return args;
}

/** Compose a rich autodocs component description from the metadata. */
export function docDescription(meta: ComponentMeta): string {
  const lines: string[] = [meta.description, ''];

  lines.push(`**Category:** ${meta.category}`);
  if (meta.responsive) lines.push(`**Responsive:** ${meta.responsive}`);

  if (meta.variantProps.length) {
    lines.push('', '**Variant properties → Figma Variant Properties**');
    for (const v of meta.variantProps) {
      lines.push(`- \`${v.name}\` (${v.label}): ${v.options.join(', ')}`);
    }
  }

  lines.push('', `**States:** ${meta.states.join(', ')}`);

  if (meta.a11y?.keyboard?.length) {
    lines.push('', '**Keyboard**');
    for (const k of meta.a11y.keyboard) lines.push(`- ${k}`);
  }

  lines.push(
    '',
    `**Figma:** generates ${meta.isComponentSet ? 'a Component Set' : 'a Component'} with ${variantCount(meta)} variant combination(s).`,
  );

  return lines.join('\n');
}

/** Standard `parameters` block for a story that wires autodocs + a11y. */
export function metaParameters(meta: ComponentMeta) {
  return {
    docs: { description: { component: docDescription(meta) } },
    a11y: meta.a11y?.role ? { element: `[role="${meta.a11y.role}"]` } : undefined,
  };
}
