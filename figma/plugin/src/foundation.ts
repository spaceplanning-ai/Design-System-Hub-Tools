// Foundation page — a styled showcase of the design tokens as doc cards.
// Renders ONLY real values from the contract (figma/tds.plugin.json): resolved
// palette rgba, real text-style metrics, real radius/spacing/border/shadow tokens.
// Single-platform (Web), single-column — no fabricated iOS/Android columns.
//
// All the reusable chrome (page canvas, doc card, palette, stack/txt/fixedFrame/pill,
// and the robust font loader) lives in doc.ts and is shared with components.ts.

import type { Rgba, TokensBundle, VariableDef } from './types';
import type { VariableRegistry } from './variables';
import type { DocFonts, Palette } from './doc';
import { Tokens, docCard, fixedFrame, hex, pageCanvas, resolveFont, rgb, stack, txt } from './doc';
import { PAGE_TITLES } from './pages';
import { log, progress } from './log';

/** The six token showcase cards, in order. Also the observable count for the harness. */
export const FOUNDATION_CARDS = [
  'Color System',
  'Typography',
  'Radius & Shape',
  'Spacing',
  'Shadows',
  'Borders',
] as const;

// ---------------------------------------------------------------------------
// Card content builders — each renders resolved contract values into a card body.
// ---------------------------------------------------------------------------

/** Small labeled color chip: swatch + name caption + hex caption. */
function swatchChip(
  def: VariableDef,
  color: Rgba,
  p: Palette,
  f: DocFonts,
  vars: VariableRegistry,
  size = 48,
): FrameNode {
  const chip = stack('VERTICAL', 6);
  chip.counterAxisAlignItems = 'CENTER';

  const sw = fixedFrame(chip, size, size);
  sw.cornerRadius = 8;
  const variable = vars.get(def.id);
  const paint: SolidPaint = { type: 'SOLID', color: rgb(color), opacity: 1 };
  sw.fills = variable
    ? [figma.variables.setBoundVariableForPaint(paint, 'color', variable)]
    : [paint];
  sw.strokes = [{ type: 'SOLID', color: p.line }];
  sw.strokeWeight = 1;

  const step = def.name.split('/').pop() || def.name;
  chip.appendChild(txt(step, f.medium, 11, p.ink));
  chip.appendChild(txt(hex(color), f.regular, 10, p.muted));
  return chip;
}

function buildColorCard(
  t: Tokens,
  p: Palette,
  f: DocFonts,
  vars: VariableRegistry,
  body: FrameNode,
): void {
  const PRIMITIVE_GROUPS = ['Neutral', 'Brand', 'Green', 'Amber', 'Red', 'Blue', 'Base'];
  const palettes = stack('VERTICAL', 16);
  palettes.layoutAlign = 'STRETCH';
  for (const group of PRIMITIVE_GROUPS) {
    const defs = t.primitivesInGroup(group);
    if (!defs.length) continue;
    const row = stack('HORIZONTAL', 16);
    row.counterAxisAlignItems = 'MIN';
    const label = txt(group, f.semibold, 13, p.ink);
    label.resize(90, label.height);
    label.textAutoResize = 'HEIGHT';
    row.appendChild(label);
    const strip = stack('HORIZONTAL', 12, { wrap: true });
    for (const def of defs) {
      const c = t.rgbaOf(def);
      if (!c) continue;
      strip.appendChild(swatchChip(def, c, p, f, vars));
    }
    row.appendChild(strip);
    palettes.appendChild(row);
  }
  body.appendChild(palettes);

  // Semantic + Theme color roles (semantic has no colors here → Theme roles render).
  const roleDefs = [...t.colorsIn('Semantic'), ...t.colorsIn('Theme')];
  if (roleDefs.length) {
    const roles = stack('VERTICAL', 12);
    roles.layoutAlign = 'STRETCH';
    roles.appendChild(txt('Semantic & Theme roles (light)', f.semibold, 13, p.ink));
    const grid = stack('HORIZONTAL', 12, { wrap: true });
    for (const def of roleDefs) {
      const c = t.rgbaOf(def, 'light');
      if (!c) continue;
      const rrow = stack('HORIZONTAL', 8);
      rrow.counterAxisAlignItems = 'CENTER';
      rrow.resize(300, 32);
      rrow.primaryAxisSizingMode = 'FIXED';
      const sw = fixedFrame(rrow, 24, 24);
      sw.cornerRadius = 6;
      const variable = vars.get(def.id);
      const paint: SolidPaint = { type: 'SOLID', color: rgb(c), opacity: 1 };
      sw.fills = variable
        ? [figma.variables.setBoundVariableForPaint(paint, 'color', variable)]
        : [paint];
      sw.strokes = [{ type: 'SOLID', color: p.line }];
      sw.strokeWeight = 1;
      const meta = stack('VERTICAL', 2);
      meta.appendChild(txt(def.name, f.medium, 11, p.ink));
      meta.appendChild(txt(hex(c), f.regular, 10, p.muted));
      rrow.appendChild(meta);
      grid.appendChild(rrow);
    }
    roles.appendChild(grid);
    body.appendChild(roles);
  }
}

async function buildTypographyCard(
  p: Palette,
  f: DocFonts,
  body: FrameNode,
  styles: TokensBundle['textStyles'],
): Promise<void> {
  const list = stack('VERTICAL', 20);
  list.layoutAlign = 'STRETCH';
  for (const s of styles) {
    // Try the REAL family (Paperlogy / Pretendard / JetBrains Mono) — preserve weight on fallback.
    const font = await resolveFont(s.fontFamily, s.fontWeight);
    const rowItem = stack('VERTICAL', 4);
    const specimen = txt('다람쥐 Ag 0123', font, s.fontSize, p.ink);
    specimen.name = s.name;
    rowItem.appendChild(specimen);
    const spec = `${s.fontFamily} · ${s.fontSize}px · ${s.fontWeight} · lh ${s.lineHeightPercent}%`;
    rowItem.appendChild(txt(spec, f.regular, 12, p.muted));
    list.appendChild(rowItem);
  }
  body.appendChild(list);
}

function buildRadiusCard(t: Tokens, p: Palette, f: DocFonts, body: FrameNode): void {
  const grid = stack('HORIZONTAL', 20, { wrap: true });
  grid.layoutAlign = 'STRETCH';
  for (const def of t.primitivesInGroup('Radius')) {
    const value = t.floatOf(def);
    if (value == null) continue;
    const item = stack('VERTICAL', 8);
    item.counterAxisAlignItems = 'CENTER';
    const sq = fixedFrame(item, 64, 64);
    sq.fills = [{ type: 'SOLID', color: p.brand }];
    sq.cornerRadius = Math.min(value, 32); // `full` (9999) clamps to half the square
    item.appendChild(txt(def.name.split('/').pop() || def.name, f.medium, 12, p.ink));
    item.appendChild(txt(`${value}px`, f.regular, 11, p.muted));
    grid.appendChild(item);
  }
  body.appendChild(grid);
}

function buildSpacingCard(t: Tokens, p: Palette, f: DocFonts, body: FrameNode): void {
  const list = stack('VERTICAL', 12);
  list.layoutAlign = 'STRETCH';
  for (const def of t.primitivesInGroup('Spacing')) {
    const value = t.floatOf(def);
    if (value == null) continue;
    const rowItem = stack('HORIZONTAL', 12);
    rowItem.counterAxisAlignItems = 'CENTER';
    const name = txt(def.name.split('/').slice(1).join('/'), f.medium, 12, p.ink);
    name.resize(64, name.height);
    name.textAutoResize = 'HEIGHT';
    rowItem.appendChild(name);
    const bar = fixedFrame(rowItem, Math.max(value, 1), 14);
    bar.cornerRadius = 3;
    bar.fills = [{ type: 'SOLID', color: p.brand }];
    rowItem.appendChild(txt(`${value}px`, f.regular, 11, p.muted));
    list.appendChild(rowItem);
  }
  body.appendChild(list);
}

async function buildShadowsCard(
  p: Palette,
  f: DocFonts,
  body: FrameNode,
  effects: Map<string, string>,
  defs: TokensBundle['effectStyles'],
): Promise<void> {
  const grid = stack('HORIZONTAL', 32, { wrap: true, pad: 8 });
  grid.layoutAlign = 'STRETCH';
  for (const def of defs) {
    const item = stack('VERTICAL', 10);
    item.counterAxisAlignItems = 'CENTER';
    const cardNode = fixedFrame(item, 96, 96);
    cardNode.cornerRadius = 12;
    cardNode.fills = [{ type: 'SOLID', color: p.surface }];
    const styleId = effects.get(def.id);
    if (styleId) await cardNode.setEffectStyleIdAsync(styleId);
    item.appendChild(txt(def.name.split('/').pop() || def.name, f.medium, 12, p.ink));
    grid.appendChild(item);
  }
  body.appendChild(grid);
}

function buildBordersCard(t: Tokens, p: Palette, f: DocFonts, body: FrameNode): void {
  const grid = stack('HORIZONTAL', 24, { wrap: true });
  grid.layoutAlign = 'STRETCH';
  for (const def of t.primitivesInGroup('Border Width')) {
    const value = t.floatOf(def);
    if (value == null) continue;
    const item = stack('VERTICAL', 8);
    item.counterAxisAlignItems = 'CENTER';
    const box = fixedFrame(item, 80, 64);
    box.cornerRadius = 8;
    box.fills = [{ type: 'SOLID', color: p.surface }];
    box.strokes = [{ type: 'SOLID', color: p.ink }];
    box.strokeWeight = Math.max(value, 0.01);
    item.appendChild(txt(def.name.split('/').slice(-1)[0] || def.name, f.medium, 12, p.ink));
    item.appendChild(txt(`${value}px`, f.regular, 11, p.muted));
    grid.appendChild(item);
  }
  body.appendChild(grid);
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------

const CARD_DESCRIPTIONS: Record<string, string> = {
  'Color System':
    'Primitive palettes plus semantic and theme color roles, resolved to real values.',
  Typography: 'Type styles rendered at their real font, size, weight and line height.',
  'Radius & Shape': 'Corner-radius scale from the radius primitives.',
  Spacing: 'Spacing scale — each bar is the real token width in pixels.',
  Shadows: 'Elevation effect styles applied to real cards.',
  Borders: 'Border-width scale drawn at real stroke weights.',
};

/**
 * Render the Foundation token showcase onto `page`. Returns the page canvas root frame
 * (so the caller can insert the Cover card as its first child) and the number of cards built.
 */
export async function buildFoundation(
  tokens: TokensBundle,
  palette: Palette,
  fonts: DocFonts,
  effects: Map<string, string>,
  vars: VariableRegistry,
  page: PageNode,
): Promise<{ root: FrameNode; count: number }> {
  // Use the async setter — the synchronous `figma.currentPage =` does not reliably
  // switch pages in the plugin runtime (see components.ts).
  await figma.setCurrentPageAsync(page);

  const t = new Tokens(tokens);
  const p = palette;
  const f = fonts;

  const { root, body } = pageCanvas({
    index: PAGE_TITLES.indexOf('Foundation') + 1,
    title: 'Foundation',
    description:
      'Design tokens for the TDS system — colors, type, radius, spacing, elevation and borders (Web).',
    palette: p,
    fonts: f,
  });
  root.x = 0;
  root.y = 0;
  page.appendChild(root);

  let built = 0;
  for (const title of FOUNDATION_CARDS) {
    progress(0.29, `Foundation — ${title}…`);
    const { root: cardRoot, body: cardBody } = docCard({
      eyebrow: 'Foundation',
      title,
      description: CARD_DESCRIPTIONS[title] || '',
      palette: p,
      fonts: f,
    });
    switch (title) {
      case 'Color System':
        buildColorCard(t, p, f, vars, cardBody);
        break;
      case 'Typography':
        await buildTypographyCard(p, f, cardBody, tokens.textStyles);
        break;
      case 'Radius & Shape':
        buildRadiusCard(t, p, f, cardBody);
        break;
      case 'Spacing':
        buildSpacingCard(t, p, f, cardBody);
        break;
      case 'Shadows':
        await buildShadowsCard(p, f, cardBody, effects, tokens.effectStyles);
        break;
      case 'Borders':
        buildBordersCard(t, p, f, cardBody);
        break;
    }
    body.appendChild(cardRoot);
    built++;
  }

  figma.ui.postMessage({ type: 'foundation-cards', count: built });
  log(`Foundation: ${built} token showcase cards`);
  return { root, count: built };
}
