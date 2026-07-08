import type { DesignToken, ShadowValue, TokenCollection, TypographyValue } from './types';
import { ref } from './types';
import { tok, themed } from './helpers';

/* ------------------------------------------------------------------ *
 * Semantic colors — theme-aware (Light / Dark modes).
 * Each value is an alias to a primitive, so Figma creates alias variables.
 * ------------------------------------------------------------------ */

const fillScope = { scopes: ['ALL_FILLS' as const, 'STROKE_COLOR' as const] };
const textScope = { scopes: ['TEXT_FILL' as const] };
const strokeScope = { scopes: ['STROKE_COLOR' as const] };

/** Build the six status-color families (solid/hover/active/fg/subtle/subtleFg/border). */
function statusColors(
  name: string,
  scale: string, // primitive scale id, e.g. 'color.green'
  group: string,
): DesignToken[] {
  return [
    themed(
      `color.${name}.solid`,
      'color',
      { light: ref(`${scale}.500`), dark: ref(`${scale}.500`) },
      { group, ...fillScope },
    ),
    themed(
      `color.${name}.solidHover`,
      'color',
      { light: ref(`${scale}.600`), dark: ref(`${scale}.400`) },
      { group, ...fillScope },
    ),
    themed(
      `color.${name}.solidActive`,
      'color',
      { light: ref(`${scale}.700`), dark: ref(`${scale}.300`) },
      { group, ...fillScope },
    ),
    themed(
      `color.${name}.fg`,
      'color',
      { light: ref('color.white'), dark: ref('color.white') },
      { group, ...textScope },
    ),
    themed(
      `color.${name}.subtle`,
      'color',
      { light: ref(`${scale}.50`), dark: ref(`${scale}.950`) },
      { group, ...fillScope },
    ),
    themed(
      `color.${name}.subtleFg`,
      'color',
      { light: ref(`${scale}.700`), dark: ref(`${scale}.200`) },
      { group, ...textScope },
    ),
    themed(
      `color.${name}.border`,
      'color',
      { light: ref(`${scale}.200`), dark: ref(`${scale}.800`) },
      { group, ...strokeScope },
    ),
  ];
}

const semanticColorTokens: DesignToken[] = [
  // Backgrounds / surfaces
  themed(
    'color.bg.canvas',
    'color',
    { light: ref('color.neutral.50'), dark: ref('color.neutral.950') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.surface',
    'color',
    { light: ref('color.white'), dark: ref('color.neutral.900') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.subtle',
    'color',
    { light: ref('color.neutral.100'), dark: ref('color.neutral.800') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.muted',
    'color',
    { light: ref('color.neutral.200'), dark: ref('color.neutral.700') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.inverse',
    'color',
    { light: ref('color.neutral.900'), dark: ref('color.neutral.50') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.hover',
    'color',
    { light: ref('color.neutral.100'), dark: ref('color.neutral.800') },
    { group: 'Background', ...fillScope },
  ),
  themed(
    'color.bg.active',
    'color',
    { light: ref('color.neutral.200'), dark: ref('color.neutral.700') },
    { group: 'Background', ...fillScope },
  ),

  // Foreground / text
  themed(
    'color.fg.default',
    'color',
    { light: ref('color.neutral.900'), dark: ref('color.neutral.50') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.muted',
    'color',
    { light: ref('color.neutral.600'), dark: ref('color.neutral.400') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.subtle',
    'color',
    { light: ref('color.neutral.500'), dark: ref('color.neutral.500') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.onAccent',
    'color',
    { light: ref('color.white'), dark: ref('color.white') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.inverse',
    'color',
    { light: ref('color.neutral.50'), dark: ref('color.neutral.900') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.link',
    'color',
    { light: ref('color.brand.600'), dark: ref('color.brand.300') },
    { group: 'Foreground', ...textScope },
  ),
  themed(
    'color.fg.disabled',
    'color',
    { light: ref('color.neutral.400'), dark: ref('color.neutral.600') },
    { group: 'Foreground', ...textScope },
  ),

  // Borders
  themed(
    'color.border.default',
    'color',
    { light: ref('color.neutral.200'), dark: ref('color.neutral.700') },
    { group: 'Border', ...strokeScope },
  ),
  themed(
    'color.border.subtle',
    'color',
    { light: ref('color.neutral.100'), dark: ref('color.neutral.800') },
    { group: 'Border', ...strokeScope },
  ),
  themed(
    'color.border.strong',
    'color',
    { light: ref('color.neutral.300'), dark: ref('color.neutral.600') },
    { group: 'Border', ...strokeScope },
  ),
  themed(
    'color.border.focus',
    'color',
    { light: ref('color.brand.500'), dark: ref('color.brand.400') },
    { group: 'Border', ...strokeScope },
  ),

  // Brand
  themed(
    'color.brand.solid',
    'color',
    { light: ref('color.brand.500'), dark: ref('color.brand.500') },
    { group: 'Brand', ...fillScope },
  ),
  themed(
    'color.brand.solidHover',
    'color',
    { light: ref('color.brand.600'), dark: ref('color.brand.400') },
    { group: 'Brand', ...fillScope },
  ),
  themed(
    'color.brand.solidActive',
    'color',
    { light: ref('color.brand.700'), dark: ref('color.brand.300') },
    { group: 'Brand', ...fillScope },
  ),
  themed(
    'color.brand.fg',
    'color',
    { light: ref('color.white'), dark: ref('color.white') },
    { group: 'Brand', ...textScope },
  ),
  themed(
    'color.brand.subtle',
    'color',
    { light: ref('color.brand.50'), dark: ref('color.brand.950') },
    { group: 'Brand', ...fillScope },
  ),
  themed(
    'color.brand.subtleFg',
    'color',
    { light: ref('color.brand.700'), dark: ref('color.brand.200') },
    { group: 'Brand', ...textScope },
  ),
  themed(
    'color.brand.border',
    'color',
    { light: ref('color.brand.200'), dark: ref('color.brand.800') },
    { group: 'Brand', ...strokeScope },
  ),

  // Neutral tone family (mirrors the status-family shape for DRY component styling)
  themed(
    'color.neutral.solid',
    'color',
    { light: ref('color.neutral.900'), dark: ref('color.neutral.100') },
    { group: 'Neutral', ...fillScope },
  ),
  themed(
    'color.neutral.solidHover',
    'color',
    { light: ref('color.neutral.700'), dark: ref('color.neutral.300') },
    { group: 'Neutral', ...fillScope },
  ),
  themed(
    'color.neutral.solidActive',
    'color',
    { light: ref('color.neutral.600'), dark: ref('color.neutral.400') },
    { group: 'Neutral', ...fillScope },
  ),
  themed(
    'color.neutral.fg',
    'color',
    { light: ref('color.white'), dark: ref('color.neutral.900') },
    { group: 'Neutral', ...textScope },
  ),
  themed(
    'color.neutral.subtle',
    'color',
    { light: ref('color.neutral.100'), dark: ref('color.neutral.800') },
    { group: 'Neutral', ...fillScope },
  ),
  themed(
    'color.neutral.subtleFg',
    'color',
    { light: ref('color.neutral.700'), dark: ref('color.neutral.200') },
    { group: 'Neutral', ...textScope },
  ),
  themed(
    'color.neutral.border',
    'color',
    { light: ref('color.neutral.300'), dark: ref('color.neutral.600') },
    { group: 'Neutral', ...strokeScope },
  ),

  // Status families
  ...statusColors('success', 'color.green', 'Success'),
  ...statusColors('warning', 'color.amber', 'Warning'),
  ...statusColors('danger', 'color.red', 'Danger'),
  ...statusColors('info', 'color.blue', 'Info'),

  // Form fields
  themed(
    'color.field.bg',
    'color',
    { light: ref('color.white'), dark: ref('color.neutral.900') },
    { group: 'Field', ...fillScope },
  ),
  themed(
    'color.field.bgDisabled',
    'color',
    { light: ref('color.neutral.100'), dark: ref('color.neutral.800') },
    { group: 'Field', ...fillScope },
  ),
  themed(
    'color.field.border',
    'color',
    { light: ref('color.neutral.300'), dark: ref('color.neutral.600') },
    { group: 'Field', ...strokeScope },
  ),
  themed(
    'color.field.borderHover',
    'color',
    { light: ref('color.neutral.400'), dark: ref('color.neutral.500') },
    { group: 'Field', ...strokeScope },
  ),
  themed(
    'color.field.placeholder',
    'color',
    { light: ref('color.neutral.400'), dark: ref('color.neutral.500') },
    { group: 'Field', ...textScope },
  ),

  // Overlay / scrim
  themed(
    'color.overlay',
    'color',
    { light: 'rgba(11, 14, 20, 0.5)', dark: 'rgba(0, 0, 0, 0.65)' },
    { group: 'Overlay', ...fillScope },
  ),

  // Chart series palette — theme-aware (light/dark values from styles/charts.css). Raw hex: these
  // custom data hues don't map 1:1 onto the primitive scales, and they must recolor in dark mode.
  themed('chart.1', 'color', { light: '#2a78d6', dark: '#3987e5' }, { group: 'Chart', ...fillScope }),
  themed('chart.2', 'color', { light: '#1baf7a', dark: '#199e70' }, { group: 'Chart', ...fillScope }),
  themed('chart.3', 'color', { light: '#eda100', dark: '#c98500' }, { group: 'Chart', ...fillScope }),
  themed('chart.4', 'color', { light: '#008300', dark: '#008300' }, { group: 'Chart', ...fillScope }),
  themed('chart.5', 'color', { light: '#4a3aa7', dark: '#9085e9' }, { group: 'Chart', ...fillScope }),
  themed('chart.6', 'color', { light: '#e34948', dark: '#e66767' }, { group: 'Chart', ...fillScope }),
];

export const semanticColorCollection: TokenCollection = {
  name: 'Theme',
  id: 'theme',
  modes: ['light', 'dark'],
  defaultMode: 'light',
  tokens: semanticColorTokens,
};

/* ------------------------------------------------------------------ *
 * Semantic scalars — single mode aliases + component sizing.
 * ------------------------------------------------------------------ */

const semanticScalarTokens: DesignToken[] = [
  // Font-family semantics — role aliases over the primitive families.
  tok('font.family.body', 'fontFamily', ref('font.family.sans'), {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),
  tok('font.family.display', 'fontFamily', ref('font.family.paperlogy'), {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),

  // Radius semantics
  tok('radius.control', 'dimension', ref('radius.md'), {
    group: 'Radius',
    scopes: ['CORNER_RADIUS'],
  }),
  tok('radius.surface', 'dimension', ref('radius.xl'), {
    group: 'Radius',
    scopes: ['CORNER_RADIUS'],
  }),
  tok('radius.pill', 'dimension', ref('radius.full'), {
    group: 'Radius',
    scopes: ['CORNER_RADIUS'],
  }),

  // Control heights (sm/md/lg) — drive Buttons, Inputs, Selects.
  tok('size.control.sm', 'dimension', 32, { group: 'Sizing', scopes: ['WIDTH_HEIGHT'] }),
  tok('size.control.md', 'dimension', 40, { group: 'Sizing', scopes: ['WIDTH_HEIGHT'] }),
  tok('size.control.lg', 'dimension', 48, { group: 'Sizing', scopes: ['WIDTH_HEIGHT'] }),

  // Focus ring
  tok('focus.ring.width', 'dimension', 3, { group: 'Focus', scopes: ['STROKE_FLOAT'] }),
  tok('focus.ring.offset', 'dimension', 2, { group: 'Focus', scopes: ['STROKE_FLOAT'] }),

  // Motion semantics (alias primitives)
  tok('motion.duration.hover', 'duration', ref('duration.fast'), { group: 'Motion' }),
  tok('motion.duration.enter', 'duration', ref('duration.normal'), { group: 'Motion' }),
  tok('motion.duration.exit', 'duration', ref('duration.fast'), { group: 'Motion' }),
  tok('motion.easing.standard', 'cubicBezier', ref('easing.standard'), { group: 'Motion' }),
  tok('motion.easing.enter', 'cubicBezier', ref('easing.decelerate'), { group: 'Motion' }),
  tok('motion.easing.exit', 'cubicBezier', ref('easing.accelerate'), { group: 'Motion' }),
];

export const semanticScalarCollection: TokenCollection = {
  name: 'Semantic',
  id: 'semantic',
  modes: ['default'],
  defaultMode: 'default',
  tokens: semanticScalarTokens,
};

/* ------------------------------------------------------------------ *
 * Effect styles (shadows) -> Figma Effect Styles.
 * ------------------------------------------------------------------ */

const shadow = (offsetY: number, blur: number, spread: number, alpha: number): ShadowValue => [
  { color: `rgba(11, 14, 20, ${alpha})`, offsetX: 0, offsetY, blur, spread },
];

const effectTokens: DesignToken[] = [
  tok('shadow.xs', 'shadow', shadow(1, 2, 0, 0.06), { group: 'Shadow' }),
  tok('shadow.sm', 'shadow', shadow(2, 6, -1, 0.08), { group: 'Shadow' }),
  tok('shadow.md', 'shadow', shadow(6, 16, -2, 0.1), { group: 'Shadow' }),
  tok('shadow.lg', 'shadow', shadow(12, 28, -4, 0.12), { group: 'Shadow' }),
  tok('shadow.xl', 'shadow', shadow(24, 48, -8, 0.16), { group: 'Shadow' }),
  tok(
    'shadow.focus',
    'shadow',
    [{ color: 'rgba(51, 102, 255, 0.4)', offsetX: 0, offsetY: 0, blur: 0, spread: 3 }],
    {
      group: 'Shadow',
    },
  ),
];

export const effectCollection: TokenCollection = {
  name: 'Effects',
  id: 'effect',
  modes: ['default'],
  defaultMode: 'default',
  tokens: effectTokens,
};

/* ------------------------------------------------------------------ *
 * Text styles (typography composites) -> Figma Text Styles.
 * ------------------------------------------------------------------ */

const type = (
  size: string,
  weight: string,
  lh: string,
  ls: string = 'normal',
  // Reference the semantic *role* (body/display), not a primitive family, so a
  // single `--tds-font-family-{body,display}` override re-themes all typography.
  family = 'font.family.body',
): TypographyValue => ({
  fontFamily: ref(family),
  fontSize: ref(`font.size.${size}`),
  fontWeight: ref(`font.weight.${weight}`),
  lineHeight: ref(`font.lineHeight.${lh}`),
  letterSpacing: ref(`font.letterSpacing.${ls}`),
});

const textStyleTokens: DesignToken[] = [
  tok(
    'text.display',
    'typography',
    type('5xl', 'bold', 'tight', 'tight', 'font.family.display'),
    { group: 'Display' },
  ),
  tok('text.h1', 'typography', type('4xl', 'bold', 'tight', 'tight', 'font.family.display'), {
    group: 'Heading',
  }),
  tok('text.h2', 'typography', type('3xl', 'semibold', 'tight', 'tight', 'font.family.display'), {
    group: 'Heading',
  }),
  tok('text.h3', 'typography', type('2xl', 'semibold', 'snug'), { group: 'Heading' }),
  tok('text.h4', 'typography', type('xl', 'semibold', 'snug'), { group: 'Heading' }),
  tok('text.bodyLg', 'typography', type('lg', 'regular', 'relaxed'), { group: 'Body' }),
  tok('text.body', 'typography', type('md', 'regular', 'normal'), { group: 'Body' }),
  tok('text.bodySm', 'typography', type('sm', 'regular', 'normal'), { group: 'Body' }),
  tok('text.label', 'typography', type('sm', 'medium', 'snug'), { group: 'Label' }),
  tok('text.caption', 'typography', type('xs', 'regular', 'snug'), { group: 'Label' }),
  tok('text.code', 'typography', type('sm', 'regular', 'normal', 'normal', 'font.family.mono'), {
    group: 'Code',
  }),
];

export const textStyleCollection: TokenCollection = {
  name: 'Text Styles',
  id: 'text',
  modes: ['default'],
  defaultMode: 'default',
  tokens: textStyleTokens,
};
