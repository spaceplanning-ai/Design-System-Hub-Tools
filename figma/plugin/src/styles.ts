// Reproduces tokens.effectStyles[] and tokens.textStyles[] as Figma Effect/Text Styles.

import type { EffectStyleDef, TextStyleDef } from './types';
import { resolveFont } from './doc';
import { log } from './log';

/** Reproduces effect styles; returns token id -> EffectStyle.id for `shadow` bindings. */
export function buildEffectStyles(defs: EffectStyleDef[]): Map<string, string> {
  const registry = new Map<string, string>();
  for (const def of defs) {
    const style = figma.createEffectStyle();
    style.name = def.name;
    if (def.description) style.description = def.description;
    style.effects = def.effects.map((e) => ({
      type: e.type,
      color: e.color,
      offset: e.offset,
      radius: e.radius,
      spread: e.spread,
      visible: e.visible,
      blendMode: e.blendMode,
      showShadowBehindNode: false,
    })) as Effect[];
    registry.set(def.id, style.id);
  }
  log(`Effect styles: ${defs.length}`);
  return registry;
}

export async function buildTextStyles(defs: TextStyleDef[]): Promise<void> {
  for (const def of defs) {
    // Try the REAL family first (Paperlogy / Pretendard / JetBrains Mono), preserving weight
    // on fallback. Missing families are collected for one consolidated note (see doc.ts).
    const fontName = await resolveFont(def.fontFamily, def.fontWeight);
    const style = figma.createTextStyle();
    style.name = def.name;
    if (def.description) style.description = def.description;
    style.fontName = fontName;
    style.fontSize = def.fontSize;
    style.lineHeight = { unit: 'PERCENT', value: def.lineHeightPercent };
    style.letterSpacing = { unit: 'PERCENT', value: def.letterSpacingEm * 100 };
  }
  log(`Text styles: ${defs.length}`);
}
