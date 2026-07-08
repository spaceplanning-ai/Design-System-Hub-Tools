/**
 * Token generator.
 *
 * Reads the single source of truth (src/tokens) and emits three artifacts into
 * src/tokens/generated/:
 *   1. tokens.css        — CSS custom properties (Light default + [data-theme=dark]),
 *                          shadow vars, typography vars + utility classes.
 *   2. figma.tokens.json — a Figma-plugin-ready description of Variable Collections,
 *                          Modes, Variables (with aliases + scopes), Effect Styles,
 *                          and Text Styles. RGBA colors are pre-converted to 0..1.
 *   3. token-ids.ts      — a `TokenId` union + `tokenIds` array for type-safe
 *                          token references in component metadata.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allCollections,
  tokenRegistry,
  resolveValue,
  cssVarName,
  isAlias,
  figmaVariableType,
} from '../src/tokens/index';
import type {
  DesignToken,
  ShadowValue,
  TokenCollection,
  TokenValue,
  TypographyValue,
} from '../src/tokens/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/tokens/generated');

/* ----------------------------- colour utils ----------------------------- */

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(input: string): Rgba {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 6) hex += 'ff';
    const n = parseInt(hex, 16);
    return {
      r: ((n >> 24) & 255) / 255,
      g: ((n >> 16) & 255) / 255,
      b: ((n >> 8) & 255) / 255,
      a: (n & 255) / 255,
    };
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: (parts[0] ?? 0) / 255, g: (parts[1] ?? 0) / 255, b: (parts[2] ?? 0) / 255, a: parts[3] ?? 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

const round = (n: number, p = 4) => Number(n.toFixed(p));

/* ----------------------------- CSS emitter ------------------------------ */

/** Format a resolved scalar for CSS output, converting aliases to `var(--…)`. */
function cssScalar(value: TokenValue, type: DesignToken['type']): string {
  if (isAlias(value)) return `var(${cssVarName(value.alias)})`;
  switch (type) {
    case 'dimension':
      return `${value}px`;
    case 'duration':
      return `${value}ms`;
    case 'number':
    case 'fontWeight':
      return `${value}`;
    default:
      return `${value}`; // color, string, fontFamily, cubicBezier
  }
}

/** Resolve a typography composite to concrete CSS declarations. */
function typographyDecls(t: TypographyValue): Record<string, string> {
  // Keep the font-family as a `var(--…)` reference (not the resolved string) so
  // overriding `--tds-font-family-{body,display}` at runtime re-themes typography.
  // (The Figma text-style emitter resolves the concrete family separately.)
  const fam = isAlias(t.fontFamily)
    ? `var(${cssVarName(t.fontFamily.alias)})`
    : String(t.fontFamily);
  const size = isAlias(t.fontSize) ? Number(resolveValue(t.fontSize.alias)) : Number(t.fontSize);
  const weight = isAlias(t.fontWeight) ? Number(resolveValue(t.fontWeight.alias)) : Number(t.fontWeight);
  const lh = isAlias(t.lineHeight) ? Number(resolveValue(t.lineHeight.alias)) : Number(t.lineHeight);
  const ls = isAlias(t.letterSpacing) ? Number(resolveValue(t.letterSpacing.alias)) : Number(t.letterSpacing);
  return {
    'font-family': fam,
    'font-size': `${size}px`,
    'font-weight': `${weight}`,
    'line-height': `${lh}`,
    'letter-spacing': `${ls}em`,
  };
}

/** Resolve a shadow composite to a CSS box-shadow string. */
function shadowToCss(layers: ShadowValue): string {
  return layers
    .map((l) => {
      const color = isAlias(l.color) ? String(resolveValue(l.color.alias)) : l.color;
      const inset = l.inset ? 'inset ' : '';
      return `${inset}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread}px ${color}`;
    })
    .join(', ');
}

function emitVarsForMode(collection: TokenCollection, mode: string): string[] {
  const lines: string[] = [];
  for (const token of collection.tokens) {
    const varName = cssVarName(token.id);
    const value = token.values[mode] ?? token.values[collection.defaultMode];
    if (value === undefined) continue;

    if (token.type === 'shadow') {
      lines.push(`  ${varName}: ${shadowToCss(value as ShadowValue)};`);
    } else if (token.type === 'typography') {
      const decls = typographyDecls(value as TypographyValue);
      for (const [prop, v] of Object.entries(decls)) {
        lines.push(`  ${varName}-${prop.replace('font-', '')}: ${v};`);
      }
    } else {
      lines.push(`  ${varName}: ${cssScalar(value, token.type)};`);
    }
  }
  return lines;
}

function emitTypographyUtilities(collection: TokenCollection): string[] {
  const blocks: string[] = [];
  for (const token of collection.tokens) {
    if (token.type !== 'typography') continue;
    const decls = typographyDecls(token.values.default as TypographyValue);
    const body = Object.entries(decls)
      .map(([prop, v]) => `  ${prop}: ${v};`)
      .join('\n');
    const className = `.tds-${token.id.replace(/\./g, '-')}`;
    blocks.push(`${className} {\n${body}\n}`);
  }
  return blocks;
}

function buildCss(): string {
  const single = allCollections.filter((c) => c.modes.length === 1);
  const themed = allCollections.filter((c) => c.modes.length > 1);

  // :root => single-mode collections + LIGHT of every themed collection.
  const rootLines: string[] = [];
  for (const c of single) rootLines.push(`  /* ${c.name} */`, ...emitVarsForMode(c, c.defaultMode));
  for (const c of themed) rootLines.push(`  /* ${c.name} (light) */`, ...emitVarsForMode(c, 'light'));

  const darkLines: string[] = [];
  for (const c of themed) darkLines.push(...emitVarsForMode(c, 'dark'));

  const utilities = allCollections.flatMap(emitTypographyUtilities);

  return `/**
 * AUTO-GENERATED by scripts/build-tokens.ts — do not edit by hand.
 * Source of truth: src/tokens/*.ts
 */

:root {
${rootLines.join('\n')}
}

[data-theme='dark'] {
${darkLines.join('\n')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${darkLines.map((l) => '  ' + l).join('\n')}
  }
}

/* Typography utility classes (mirror the Text Styles) */
${utilities.join('\n\n')}
`;
}

/* --------------------------- Figma JSON emitter -------------------------- */

function figmaValueForMode(token: DesignToken, mode: string) {
  const raw = token.values[mode];
  if (raw === undefined) return null;
  if (isAlias(raw)) {
    const target = tokenRegistry.get(raw.alias);
    return {
      type: 'VARIABLE_ALIAS',
      aliasId: raw.alias,
      aliasName: raw.alias.replace(/\./g, '/'),
      aliasCollection: target?.collection.id ?? null,
    };
  }
  if (token.type === 'color') {
    return { type: 'COLOR', value: raw, rgba: colorRounded(String(raw)) };
  }
  return { type: figmaVariableType(token.type), value: raw };
}

function colorRounded(input: string): Rgba {
  const c = parseColor(input);
  return { r: round(c.r), g: round(c.g), b: round(c.b), a: round(c.a) };
}

function buildFigmaJson(): unknown {
  const collections = allCollections
    .filter((c) => !['effect', 'text'].includes(c.id))
    .map((c) => ({
      name: c.name,
      id: c.id,
      modes: c.modes,
      defaultMode: c.defaultMode,
      variables: c.tokens
        .filter((t) => figmaVariableType(t.type) !== null)
        .map((t) => ({
          id: t.id,
          name: t.id.replace(/\./g, '/'),
          type: t.type,
          figmaType: figmaVariableType(t.type),
          scopes: t.figmaScopes ?? ['ALL_SCOPES'],
          description: t.description ?? '',
          group: t.group ?? '',
          valuesByMode: Object.fromEntries(c.modes.map((m) => [m, figmaValueForMode(t, m)])),
        })),
    }));

  const effectStyles = allCollections
    .flatMap((c) => c.tokens.filter((t) => t.type === 'shadow'))
    .map((t) => ({
      id: t.id,
      name: t.id.replace(/\./g, '/'),
      description: t.description ?? '',
      effects: (t.values.default as ShadowValue).map((l) => ({
        type: l.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: colorRounded(isAlias(l.color) ? String(resolveValue(l.color.alias)) : l.color),
        offset: { x: l.offsetX, y: l.offsetY },
        radius: l.blur,
        spread: l.spread,
        visible: true,
        blendMode: 'NORMAL',
      })),
    }));

  const textStyles = allCollections
    .flatMap((c) => c.tokens.filter((t) => t.type === 'typography'))
    .map((t) => {
      const v = t.values.default as TypographyValue;
      const num = (x: TypographyValue[keyof TypographyValue]) =>
        isAlias(x) ? Number(resolveValue(x.alias)) : Number(x);
      const family = isAlias(v.fontFamily)
        ? String(resolveValue(v.fontFamily.alias))
        : String(v.fontFamily);
      return {
        id: t.id,
        name: t.id.replace(/\./g, '/'),
        description: t.description ?? '',
        fontFamily: family.split(',')[0].replace(/['"]/g, '').trim(),
        fontSize: num(v.fontSize),
        fontWeight: num(v.fontWeight),
        lineHeightPercent: round(num(v.lineHeight) * 100, 2),
        letterSpacingEm: num(v.letterSpacing),
      };
    });

  return {
    $schema: 'https://tds.dev/schemas/figma-tokens.json',
    version: 1,
    description:
      'Machine-readable Design Token export for automatic Figma Variable / Style generation.',
    collections,
    effectStyles,
    textStyles,
  };
}

/* -------------------------- token-ids.ts emitter ------------------------ */

function buildTokenIds(): string {
  const ids = Array.from(tokenRegistry.keys()).sort();
  const union = ids.map((id) => `  | '${id}'`).join('\n');
  return `/** AUTO-GENERATED by scripts/build-tokens.ts — do not edit. */
export type TokenId =
${union};

export const tokenIds: TokenId[] = [
${ids.map((id) => `  '${id}',`).join('\n')}
];
`;
}

/* -------------------------------- main ---------------------------------- */

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'tokens.css'), buildCss(), 'utf8');
writeFileSync(
  resolve(OUT_DIR, 'figma.tokens.json'),
  JSON.stringify(buildFigmaJson(), null, 2),
  'utf8',
);
writeFileSync(resolve(OUT_DIR, 'token-ids.ts'), buildTokenIds(), 'utf8');

const counts = {
  collections: allCollections.length,
  tokens: tokenRegistry.size,
};
console.log(
  `✓ tokens: wrote tokens.css, figma.tokens.json, token-ids.ts ` +
    `(${counts.collections} collections, ${counts.tokens} tokens)`,
);
