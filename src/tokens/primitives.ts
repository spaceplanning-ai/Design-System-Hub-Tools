import type { DesignToken, TokenCollection } from './types';
import { tok, colorScaleTokens, scaleTokens } from './helpers';

/* ------------------------------------------------------------------ *
 * Raw color palettes (single-mode primitives).
 * ------------------------------------------------------------------ */

const neutral = {
  0: '#ffffff',
  50: '#f7f8fa',
  100: '#eceef2',
  200: '#dce0e8',
  300: '#c2c9d6',
  400: '#9aa3b5',
  500: '#6b7488',
  600: '#4d5566',
  700: '#39404e',
  800: '#252b36',
  900: '#161a22',
  950: '#0b0e14',
  1000: '#000000',
};

const brand = {
  50: '#eef4ff',
  100: '#d9e6ff',
  200: '#bcd3ff',
  300: '#8eb5ff',
  400: '#598cff',
  500: '#3366ff',
  600: '#1f47f5',
  700: '#1836e1',
  800: '#1a2fb6',
  900: '#1c2f8f',
  950: '#151d4d',
};

const green = {
  50: '#e9fbef',
  100: '#c9f5d6',
  200: '#96ebb3',
  300: '#5bd98a',
  400: '#2fc169',
  500: '#16a34a',
  600: '#0f833c',
  700: '#0f6733',
  800: '#11512b',
  900: '#0f4325',
  950: '#04250f',
};

const amber = {
  50: '#fff8eb',
  100: '#ffedc7',
  200: '#ffd888',
  300: '#ffbf4a',
  400: '#ffa620',
  500: '#f98307',
  600: '#dd6002',
  700: '#b74306',
  800: '#94340c',
  900: '#7a2c0d',
  950: '#461402',
};

const red = {
  50: '#fef2f2',
  100: '#fde3e3',
  200: '#fbcccc',
  300: '#f7a7a7',
  400: '#f17474',
  500: '#e64848',
  600: '#d22b2b',
  700: '#b01f1f',
  800: '#921d1d',
  900: '#7a1e1e',
  950: '#420a0a',
};

const blue = {
  50: '#eff8ff',
  100: '#dbeefe',
  200: '#bfe1fe',
  300: '#93cdfd',
  400: '#60b0fa',
  500: '#3b90f6',
  600: '#2472eb',
  700: '#1c5cd8',
  800: '#1d4baf',
  900: '#1d418a',
  950: '#172a54',
};

/* ------------------------------------------------------------------ *
 * Scales.
 * ------------------------------------------------------------------ */

/** 4px base spacing scale. Keys are the "t-shirt"/numeric step; values are px. */
const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

const borderWidth = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
  8: 8,
};

const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

const lineHeight = {
  none: 1,
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
  loose: 2,
};

const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

const letterSpacing = {
  tighter: -0.02,
  tight: -0.01,
  normal: 0,
  wide: 0.02,
  wider: 0.04,
};

const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  40: 0.4,
  60: 0.6,
  80: 0.8,
  90: 0.9,
  100: 1,
};

const zIndex = {
  hide: -1,
  base: 0,
  raised: 10,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1700,
  tooltip: 1800,
};

/** Motion durations in ms. */
const duration = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
};

/** CSS cubic-bezier easings. */
const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
  decelerate: 'cubic-bezier(0, 0, 0, 1)',
  accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  linear: 'cubic-bezier(0, 0, 1, 1)',
};

/** Responsive breakpoints in px. Drives responsive previews + future Figma layout grids. */
const breakpoint = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

/* ------------------------------------------------------------------ *
 * Assemble the primitive collection.
 * ------------------------------------------------------------------ */

const colorTokens: DesignToken[] = [
  tok('color.white', 'color', '#ffffff', { group: 'Base', scopes: ['ALL_FILLS'] }),
  tok('color.black', 'color', '#000000', { group: 'Base', scopes: ['ALL_FILLS'] }),
  tok('color.transparent', 'color', 'transparent', { group: 'Base', scopes: ['ALL_FILLS'] }),
  ...colorScaleTokens('color.neutral', neutral, 'Neutral'),
  ...colorScaleTokens('color.brand', brand, 'Brand'),
  ...colorScaleTokens('color.green', green, 'Green'),
  ...colorScaleTokens('color.amber', amber, 'Amber'),
  ...colorScaleTokens('color.red', red, 'Red'),
  ...colorScaleTokens('color.blue', blue, 'Blue'),
];

// Shared fallback tail so every Korean-capable family degrades gracefully.
const krFallback =
  "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

const typographyPrimitives: DesignToken[] = [
  // `sans` is the default UI/body face — Pretendard leads (Latin + Hangul).
  tok('font.family.sans', 'fontFamily', `'Pretendard', ${krFallback}`, {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),
  tok('font.family.pretendard', 'fontFamily', `'Pretendard', ${krFallback}`, {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),
  tok('font.family.paperlogy', 'fontFamily', `'Paperlogy', 'Pretendard', ${krFallback}`, {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),
  tok('font.family.notoSansKr', 'fontFamily', `'Noto Sans KR', 'Pretendard', ${krFallback}`, {
    group: 'Font Family',
    scopes: ['FONT_FAMILY'],
  }),
  tok(
    'font.family.mono',
    'fontFamily',
    "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
    {
      group: 'Font Family',
      scopes: ['FONT_FAMILY'],
    },
  ),
  ...Object.entries(fontSize).map(([k, v]) =>
    tok(`font.size.${k}`, 'dimension', v, { group: 'Font Size', scopes: ['FONT_SIZE'] }),
  ),
  ...Object.entries(fontWeight).map(([k, v]) =>
    tok(`font.weight.${k}`, 'fontWeight', v, { group: 'Font Weight', scopes: ['FONT_WEIGHT'] }),
  ),
  ...Object.entries(lineHeight).map(([k, v]) =>
    tok(`font.lineHeight.${k}`, 'number', v, { group: 'Line Height', scopes: ['LINE_HEIGHT'] }),
  ),
  ...Object.entries(letterSpacing).map(([k, v]) =>
    tok(`font.letterSpacing.${k}`, 'number', v, {
      group: 'Letter Spacing',
      scopes: ['LETTER_SPACING'],
    }),
  ),
];

const motionTokens: DesignToken[] = [
  ...Object.entries(duration).map(([k, v]) =>
    tok(`duration.${k}`, 'duration', v, { group: 'Duration', scopes: ['ALL_SCOPES'] }),
  ),
  ...Object.entries(easing).map(([k, v]) =>
    tok(`easing.${k}`, 'cubicBezier', v, { group: 'Easing', scopes: ['ALL_SCOPES'] }),
  ),
];

export const primitiveCollection: TokenCollection = {
  name: 'Primitives',
  id: 'primitive',
  modes: ['default'],
  defaultMode: 'default',
  tokens: [
    ...colorTokens,
    ...scaleTokens('space', spacing, ['GAP', 'WIDTH_HEIGHT'], 'Spacing'),
    ...scaleTokens('radius', radius, ['CORNER_RADIUS'], 'Radius'),
    ...scaleTokens('border.width', borderWidth, ['STROKE_FLOAT'], 'Border Width'),
    ...typographyPrimitives,
    ...Object.entries(opacity).map(([k, v]) =>
      tok(`opacity.${k}`, 'number', v, { group: 'Opacity', scopes: ['OPACITY'] }),
    ),
    ...Object.entries(zIndex).map(([k, v]) =>
      tok(`z.${k}`, 'number', v, { group: 'Z Index', scopes: ['ALL_SCOPES'] }),
    ),
    ...motionTokens,
    ...Object.entries(breakpoint).map(([k, v]) =>
      tok(`breakpoint.${k}`, 'dimension', v, { group: 'Breakpoint', scopes: ['WIDTH_HEIGHT'] }),
    ),
  ],
};

export const rawScales = {
  neutral,
  brand,
  green,
  amber,
  red,
  blue,
  spacing,
  radius,
  borderWidth,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  opacity,
  zIndex,
  duration,
  easing,
  breakpoint,
};
