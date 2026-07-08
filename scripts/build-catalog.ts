/**
 * build-catalog — generates docs/COMPONENTS.md from every *.meta.ts.
 *
 * The catalog is the token-cheap component index the AI harness (and humans)
 * read to reuse components instantly, without opening each source file.
 * Regenerate after adding/changing a component:  npm run catalog:build
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ComponentMeta } from '../src/core/types';

const ROOT = resolve(import.meta.dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');
const OUT = join(ROOT, 'docs', 'COMPONENTS.md');

const CATEGORY_ORDER: ComponentMeta['category'][] = ['atom', 'molecule', 'organism'];
const CATEGORY_TITLE: Record<string, string> = {
  atom: 'Atoms',
  molecule: 'Molecules',
  organism: 'Organisms',
};

/** Recursively collect every *.meta.ts path. */
function findMetaFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMetaFiles(full));
    else if (entry.name.endsWith('.meta.ts')) out.push(full);
  }
  return out;
}

/** Pick the exported ComponentMeta from a module (the `*Meta` object). */
function pickMeta(mod: Record<string, unknown>): ComponentMeta | undefined {
  for (const value of Object.values(mod)) {
    if (
      value &&
      typeof value === 'object' &&
      'name' in value &&
      'category' in value &&
      'variantProps' in value
    ) {
      return value as ComponentMeta;
    }
  }
  return undefined;
}

function variantSummary(m: ComponentMeta): string {
  if (!m.variantProps.length) return '—';
  return m.variantProps
    .map((v) => {
      // Cap long option lists (e.g. Icon's 130 names) — the count is enough to reuse.
      const opts = v.options.length > 8 ? `${v.options.length} options` : v.options.join('|');
      return `\`${v.name}\`=${opts}`;
    })
    .join(' · ');
}

function propSummary(m: ComponentMeta): string {
  const props = m.componentProps ?? [];
  if (!props.length) return '—';
  return props.map((p) => `\`${p.name}\``).join(' ');
}

async function main() {
  const files = findMetaFiles(COMPONENTS_DIR).sort();
  const metas: ComponentMeta[] = [];
  for (const file of files) {
    const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    const meta = pickMeta(mod);
    if (meta) metas.push(meta);
    else console.warn(`[catalog] no meta export found in ${file}`);
  }

  const byCat = new Map<string, ComponentMeta[]>();
  for (const m of metas) {
    const list = byCat.get(m.category) ?? [];
    list.push(m);
    byCat.set(m.category, list);
  }

  const lines: string[] = [];
  lines.push('# TDS Component Catalog');
  lines.push('');
  lines.push('> **Auto-generated** by `npm run catalog:build` — do not edit by hand.');
  lines.push(`> ${metas.length} components. Import any of them from the single barrel:`);
  lines.push('>');
  lines.push('> ```ts');
  lines.push("> import { Button, Card, Dropdown } from '@/components';");
  lines.push('> ```');
  lines.push('');

  for (const cat of CATEGORY_ORDER) {
    const list = (byCat.get(cat) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) continue;
    lines.push(`## ${CATEGORY_TITLE[cat]} (${list.length})`);
    lines.push('');
    lines.push('| Component | Variants | Props | What it is |');
    lines.push('| --- | --- | --- | --- |');
    for (const m of list) {
      const desc = m.description.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|');
      lines.push(`| **${m.name}** | ${variantSummary(m)} | ${propSummary(m)} | ${desc} |`);
    }
    lines.push('');
  }

  writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`[catalog] wrote ${metas.length} components → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
