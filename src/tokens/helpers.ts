import type {
  DesignToken,
  FigmaScope,
  ScalarValue,
  ShadowValue,
  TokenType,
  TypographyValue,
} from './types';

interface Opts {
  scopes?: FigmaScope[];
  description?: string;
  group?: string;
}

/** Single-mode token (mode key `default`). */
export function tok(
  id: string,
  type: TokenType,
  value: ScalarValue | ShadowValue | TypographyValue,
  opts: Opts = {},
): DesignToken {
  return {
    id,
    type,
    values: { default: value },
    figmaScopes: opts.scopes,
    description: opts.description,
    group: opts.group,
  };
}

/** Two-mode (light/dark) token. */
export function themed(
  id: string,
  type: TokenType,
  values: { light: ScalarValue | ShadowValue; dark: ScalarValue | ShadowValue },
  opts: Opts = {},
): DesignToken {
  return {
    id,
    type,
    values: { light: values.light, dark: values.dark },
    figmaScopes: opts.scopes,
    description: opts.description,
    group: opts.group,
  };
}

/** Expand a numeric scale record into single-mode `dimension` tokens. */
export function scaleTokens(
  prefix: string,
  scale: Record<string, number>,
  scopes: FigmaScope[],
  group: string,
): DesignToken[] {
  return Object.entries(scale).map(([key, value]) =>
    tok(`${prefix}.${key}`, 'dimension', value, { scopes, group }),
  );
}

/** Expand a color scale record into single-mode `color` tokens. */
export function colorScaleTokens(
  prefix: string,
  scale: Record<string | number, string>,
  group: string,
): DesignToken[] {
  return Object.entries(scale).map(([key, value]) =>
    tok(`${prefix}.${key}`, 'color', value, {
      scopes: ['ALL_FILLS', 'STROKE_COLOR'],
      group,
    }),
  );
}
