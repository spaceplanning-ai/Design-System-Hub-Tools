// Shared documentation kit — used by BOTH foundation.ts and components.ts so every
// page (Foundation + the 7 component pages) has the SAME chrome: a vertical auto-layout
// page canvas with an eyebrow/title/description header, holding white rounded "doc cards".
//
// Also the single, robust font loader for the whole plugin: it tries the real family
// (Paperlogy / Pretendard / JetBrains Mono) first, preserves weight on fallback, and
// records which real families were missing so ONE consolidated note is emitted at the end
// (instead of the per-style log spam that was the old bug).

import type { Rgba, TokensBundle, VariableDef } from './types';
import { warn } from './log';

// ---------------------------------------------------------------------------
// Robust font loader (Goal 1).
// ---------------------------------------------------------------------------

/** Weight → candidate Figma style names. Multiple spellings because vendors differ
 *  ("SemiBold" vs "Semi Bold" vs "Semibold"). First that loads wins. */
const WEIGHT_TO_STYLES: Record<number, string[]> = {
  100: ['Thin'],
  200: ['ExtraLight', 'Extra Light'],
  300: ['Light'],
  400: ['Regular'],
  500: ['Medium'],
  600: ['SemiBold', 'Semi Bold', 'Semibold'],
  700: ['Bold'],
  800: ['ExtraBold', 'Extra Bold'],
  900: ['Black', 'Heavy'],
};

const fontCache = new Map<string, FontName>();
const fallbackFamilies = new Set<string>();

async function tryLoad(font: FontName): Promise<boolean> {
  try {
    await figma.loadFontAsync(font);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve (family, weight) to a font Figma can actually render, preserving weight on
 * fallback. Order: real family across its style candidates → real family Regular →
 * Inter same weight/style (weight preserved) → Inter Regular → Roboto Regular. If the
 * real family is missing it is recorded for a single consolidated note (see flushFontNotes).
 */
export async function resolveFont(family: string, weight: number): Promise<FontName> {
  const key = `${family}#${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const styles = WEIGHT_TO_STYLES[weight] ?? ['Regular'];
  const remember = (f: FontName): FontName => {
    fontCache.set(key, f);
    return f;
  };

  // 1) Real family across its style-name candidates.
  for (const style of styles)
    if (await tryLoad({ family, style })) return remember({ family, style });
  // 2) Real family Regular.
  if (await tryLoad({ family, style: 'Regular' })) return remember({ family, style: 'Regular' });

  // Real family unavailable — record it, then fall back preserving weight.
  fallbackFamilies.add(family);

  // 3) Inter with the same weight/style (Figma always ships Inter).
  for (const style of styles)
    if (await tryLoad({ family: 'Inter', style })) return remember({ family: 'Inter', style });
  // 4) Inter Regular.
  if (await tryLoad({ family: 'Inter', style: 'Regular' }))
    return remember({ family: 'Inter', style: 'Regular' });
  // 5) Roboto Regular — the last resort Figma guarantees.
  const roboto: FontName = { family: 'Roboto', style: 'Regular' };
  await figma.loadFontAsync(roboto);
  return remember(roboto);
}

/** Emit ONE consolidated note naming the real families that had to fall back. Call once at
 *  the very end of the run (never per-style / per-call — that was the log-spam bug). */
export function flushFontNotes(): void {
  if (fallbackFamilies.size) {
    warn(`Install for exact type: ${[...fallbackFamilies].join(', ')} (rendered with Inter)`);
  }
}

/** UI-chrome fonts for the doc kit (headings, labels). Inter is always available. */
export interface DocFonts {
  regular: FontName;
  medium: FontName;
  semibold: FontName;
  bold: FontName;
}

export async function loadDocFonts(): Promise<DocFonts> {
  return {
    regular: await resolveFont('Inter', 400),
    medium: await resolveFont('Inter', 500),
    semibold: await resolveFont('Inter', 600),
    bold: await resolveFont('Inter', 700),
  };
}

// ---------------------------------------------------------------------------
// Token graph resolver + palette (shared chrome colors, resolved from real tokens).
// ---------------------------------------------------------------------------

function toHex2(x: number): string {
  return Math.max(0, Math.min(255, Math.round(x * 255)))
    .toString(16)
    .padStart(2, '0');
}
export function hex(c: Rgba): string {
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`;
}
export function rgb(c: Rgba): RGB {
  return { r: c.r, g: c.g, b: c.b };
}

/** Resolver over the full token graph: alias values resolve to their primitive. */
export class Tokens {
  private byId = new Map<string, VariableDef>();
  constructor(private bundle: TokensBundle) {
    for (const col of bundle.collections) for (const v of col.variables) this.byId.set(v.id, v);
  }
  def(id: string): VariableDef | undefined {
    return this.byId.get(id);
  }
  private pick(def: VariableDef, mode: string) {
    return (
      def.valuesByMode[mode] ??
      def.valuesByMode.default ??
      def.valuesByMode[Object.keys(def.valuesByMode)[0]]
    );
  }
  rgbaOf(def: VariableDef, mode = 'default'): Rgba | null {
    const mv = this.pick(def, mode);
    if (!mv) return null;
    if (mv.type === 'COLOR') return mv.rgba;
    if (mv.type === 'VARIABLE_ALIAS') {
      const t = this.byId.get(mv.aliasId);
      return t ? this.rgbaOf(t, mode) : null;
    }
    return null;
  }
  floatOf(def: VariableDef): number | null {
    const mv = this.pick(def, 'default');
    if (!mv) return null;
    if (mv.type === 'FLOAT') return mv.value;
    if (mv.type === 'VARIABLE_ALIAS') {
      const t = this.byId.get(mv.aliasId);
      return t ? this.floatOf(t) : null;
    }
    return null;
  }
  /** Chrome color by primitive id (falls back to black if missing). */
  chrome(id: string): RGB {
    const d = this.byId.get(id);
    const r = d ? this.rgbaOf(d) : null;
    return r ? rgb(r) : { r: 0, g: 0, b: 0 };
  }
  primitivesInGroup(group: string): VariableDef[] {
    const prim = this.bundle.collections.find((c) => c.name === 'Primitives');
    return prim ? prim.variables.filter((v) => v.group === group) : [];
  }
  /** COLOR variables from the given collection name. */
  colorsIn(collection: string): VariableDef[] {
    const col = this.bundle.collections.find((c) => c.name === collection);
    return col ? col.variables.filter((v) => v.figmaType === 'COLOR') : [];
  }
}

export interface Palette {
  brand: RGB;
  greenBg: RGB;
  greenFg: RGB;
  surface: RGB;
  canvas: RGB;
  ink: RGB;
  muted: RGB;
  line: RGB;
}

/** Chrome palette resolved from the real token graph — no invented colors. */
export function makePalette(t: Tokens): Palette {
  return {
    brand: t.chrome('color.brand.600'),
    greenBg: t.chrome('color.green.100'),
    greenFg: t.chrome('color.green.700'),
    surface: t.chrome('color.white'),
    canvas: t.chrome('color.neutral.50'),
    ink: t.chrome('color.neutral.900'),
    muted: t.chrome('color.neutral.500'),
    line: t.chrome('color.neutral.200'),
  };
}

// ---------------------------------------------------------------------------
// Auto-layout building blocks (Goal 3: everything HUGS; only leaf specimens are FIXED).
// ---------------------------------------------------------------------------

export function stack(
  dir: 'HORIZONTAL' | 'VERTICAL',
  gap: number,
  opts: { pad?: number; padX?: number; padY?: number; wrap?: boolean } = {},
): FrameNode {
  const f = figma.createFrame();
  f.layoutMode = dir;
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  if (opts.wrap) f.layoutWrap = 'WRAP';
  const px = opts.padX ?? opts.pad ?? 0;
  const py = opts.padY ?? opts.pad ?? 0;
  f.paddingLeft = px;
  f.paddingRight = px;
  f.paddingTop = py;
  f.paddingBottom = py;
  return f;
}

export function txt(chars: string, font: FontName, size: number, color?: RGB): TextNode {
  const t = figma.createText();
  t.fontName = font;
  t.fontSize = size;
  t.characters = chars;
  if (color) t.fills = [{ type: 'SOLID', color }];
  return t;
}

/**
 * A fixed-size child frame that keeps its exact proportions inside an auto-layout parent.
 * The ONLY nodes allowed an explicit fixed size (color swatches, radius squares, spacing
 * bars, shadow cards, border boxes) — everything else hugs its content.
 */
export function fixedFrame(parent: FrameNode, w: number, h: number): FrameNode {
  const f = figma.createFrame();
  f.resize(w, h);
  f.layoutGrow = 0;
  f.layoutAlign = 'INHERIT';
  parent.appendChild(f);
  try {
    f.layoutSizingHorizontal = 'FIXED';
    f.layoutSizingVertical = 'FIXED';
  } catch {
    /* parent isn't auto-layout — the resize above already fixes the size */
  }
  return f;
}

/** A small rounded status pill (e.g. the green "Web" platform pill). */
export function pill(text: string, p: Palette, fonts: DocFonts): FrameNode {
  const frame = stack('HORIZONTAL', 0, { padX: 10, padY: 4 });
  frame.fills = [{ type: 'SOLID', color: p.greenBg }];
  frame.cornerRadius = 999;
  frame.appendChild(txt(text, fonts.semibold, 11, p.greenFg));
  return frame;
}

// ---------------------------------------------------------------------------
// Page canvas + doc card (Goal 2: unified chrome for every page).
// ---------------------------------------------------------------------------

/** A page-level vertical auto-layout canvas with an eyebrow/title/description header.
 *  Hugs its content — cards are appended to `body`. */
export function pageCanvas(opts: {
  index: number;
  title: string;
  description: string;
  palette: Palette;
  fonts: DocFonts;
}): { root: FrameNode; body: FrameNode } {
  const { index, title, description, palette: p, fonts } = opts;
  const root = stack('VERTICAL', 32, { pad: 48 });
  root.name = title;
  root.fills = [{ type: 'SOLID', color: p.canvas }];
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';

  const header = stack('VERTICAL', 8);
  header.appendChild(txt(`TDS · ${index}`, fonts.semibold, 13, p.brand));
  header.appendChild(txt(title, fonts.bold, 40, p.ink));
  if (description) header.appendChild(txt(description, fonts.regular, 15, p.muted));
  root.appendChild(header);

  return { root, body: root };
}

/**
 * A white rounded doc card (radius 16, 1px line stroke, padding 32, itemSpacing 24) with the
 * standard header block: eyebrow (brand) · bold title · muted description · a green
 * "Platform · Web" pill · optional meta line. Hugs its content. Content goes into `body`.
 */
export function docCard(opts: {
  eyebrow: string;
  title: string;
  description: string;
  palette: Palette;
  fonts: DocFonts;
  badge?: string;
}): { root: FrameNode; body: FrameNode } {
  const { eyebrow, title, description, palette: p, fonts, badge } = opts;
  const root = stack('VERTICAL', 24, { pad: 32 });
  root.name = title;
  root.fills = [{ type: 'SOLID', color: p.surface }];
  root.cornerRadius = 16;
  root.strokes = [{ type: 'SOLID', color: p.line }];
  root.strokeWeight = 1;
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';

  const header = stack('VERTICAL', 8);
  header.appendChild(txt(eyebrow, fonts.semibold, 12, p.brand));
  header.appendChild(txt(title, fonts.bold, 24, p.ink));
  if (description) header.appendChild(txt(description, fonts.regular, 14, p.muted));

  const platform = stack('HORIZONTAL', 10);
  platform.counterAxisAlignItems = 'CENTER';
  platform.appendChild(txt('Platform', fonts.medium, 12, p.muted));
  platform.appendChild(pill('Web', p, fonts));
  header.appendChild(platform);

  if (badge) header.appendChild(txt(badge, fonts.regular, 12, p.muted));
  root.appendChild(header);

  const body = stack('VERTICAL', 20);
  body.layoutAlign = 'STRETCH';
  root.appendChild(body);

  return { root, body };
}
