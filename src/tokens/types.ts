/**
 * Design Token type system.
 *
 * The model is deliberately shaped to map 1:1 onto Figma primitives so a future
 * Figma plugin can consume it with zero custom per-token logic:
 *
 *   TokenCollection  ->  Figma Variable Collection
 *   TokenCollection.modes -> Figma Collection Modes (e.g. Light / Dark)
 *   DesignToken (scalar) ->  Figma Variable (COLOR | FLOAT | STRING | BOOLEAN)
 *   TokenAlias           ->  Figma Variable alias
 *   DesignToken (shadow) ->  Figma Effect Style
 *   DesignToken (typography) -> Figma Text Style
 *
 * It is also DTCG (W3C Design Tokens) friendly: `type` mirrors `$type` and the
 * generator can emit `$value` / `$type` JSON.
 */

/** Scalar token types map to a Figma Variable type; composite types map to Figma Styles. */
export type TokenType =
  | 'color' // -> COLOR variable
  | 'dimension' // px length -> FLOAT variable
  | 'number' // unitless -> FLOAT variable
  | 'fontFamily' // -> STRING variable
  | 'fontWeight' // -> FLOAT variable
  | 'duration' // ms -> FLOAT variable (also emitted as CSS ms)
  | 'cubicBezier' // -> STRING variable (CSS easing)
  | 'string' // -> STRING variable
  | 'boolean' // -> BOOLEAN variable
  | 'shadow' // composite -> Effect Style
  | 'typography'; // composite -> Text Style

export type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Figma variable scopes constrain where a variable can be applied in the UI.
 * Names match the Figma Plugin API `VariableScope` enum.
 */
export type FigmaScope =
  | 'ALL_SCOPES'
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'CORNER_RADIUS'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'STROKE_FLOAT'
  | 'OPACITY'
  | 'FONT_FAMILY'
  | 'FONT_STYLE'
  | 'FONT_WEIGHT'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING'
  | 'PARAGRAPH_SPACING'
  | 'TEXT_CONTENT'
  | 'EFFECT_FLOAT'
  | 'EFFECT_COLOR';

/** A reference to another token, by its global dot-notated id. Becomes a Figma alias. */
export interface TokenAlias {
  alias: string;
}

export interface ShadowLayer {
  color: string | TokenAlias;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  inset?: boolean;
}

export type ShadowValue = ShadowLayer[];

export interface TypographyValue {
  fontFamily: string | TokenAlias;
  fontSize: number | TokenAlias;
  fontWeight: number | TokenAlias;
  lineHeight: number | TokenAlias; // unitless multiplier
  letterSpacing: number | TokenAlias; // em
}

export type ScalarValue = string | number | boolean | TokenAlias;
export type TokenValue = ScalarValue | ShadowValue | TypographyValue;

export interface DesignToken {
  /** Globally-unique dot-notated id, e.g. `color.bg.default`, `space.4`. */
  id: string;
  type: TokenType;
  /**
   * Value keyed by mode. Single-mode collections use `{ default: value }`.
   * Every key must be one of the owning collection's `modes`.
   */
  values: Record<string, TokenValue>;
  description?: string;
  figmaScopes?: FigmaScope[];
  /** Group label used purely for docs/organisation (e.g. "Neutral", "Brand"). */
  group?: string;
}

export interface TokenCollection {
  /** Human name -> Figma Variable Collection name. */
  name: string;
  /** Namespace prefix used in CSS var names and ids, e.g. `primitive`, `theme`. */
  id: string;
  /** Ordered modes. Single-mode collections use `['default']`. */
  modes: string[];
  defaultMode: string;
  tokens: DesignToken[];
}

/** Convert a token id to its CSS custom property name: `color.bg.default` -> `--tds-color-bg-default`. */
export function cssVarName(id: string): string {
  return `--tds-${id.replace(/\./g, '-')}`;
}

/** Reference a token as a CSS value: `cssVar('color.bg.default')` -> `var(--tds-color-bg-default)`. */
export function cssVar(id: string): string {
  return `var(${cssVarName(id)})`;
}

export function isAlias(v: unknown): v is TokenAlias {
  return typeof v === 'object' && v !== null && 'alias' in v;
}

export function ref(alias: string): TokenAlias {
  return { alias };
}

/** Scalar token types that become Figma Variables (vs. Styles). */
export const SCALAR_TYPES: TokenType[] = [
  'color',
  'dimension',
  'number',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'string',
  'boolean',
];

export function figmaVariableType(type: TokenType): FigmaVariableType | null {
  switch (type) {
    case 'color':
      return 'COLOR';
    case 'dimension':
    case 'number':
    case 'fontWeight':
    case 'duration':
      return 'FLOAT';
    case 'fontFamily':
    case 'cubicBezier':
    case 'string':
      return 'STRING';
    case 'boolean':
      return 'BOOLEAN';
    default:
      return null; // shadow / typography -> Styles, not Variables
  }
}
