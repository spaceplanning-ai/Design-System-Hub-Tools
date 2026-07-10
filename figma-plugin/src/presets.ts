// 부록 C 프리셋 고정값 — 플러그인 임베드 사본 (tokens/*.json과 동일 값)
export type PresetName = 'bootstrap' | 'tailwind' | 'toss'

export type ColorKey = 'primary' | 'secondary' | 'error' | 'success' | 'bg' | 'text'
export type SizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type WeightKey = 'regular' | 'medium' | 'bold'
export type RadiusKey = 'sm' | 'md' | 'lg'
export type SpacingKey = '1' | '2' | '3' | '4' | '5' | '6'

export interface TokensJson {
  $preset: PresetName
  color: Record<ColorKey, string>
  typography: {
    fontFamily: string
    baseSize: number
    scale: number
    sizes: Record<SizeKey, number>
    weights: Record<WeightKey, number>
  }
  radius: Record<RadiusKey, number>
  spacing: Record<SpacingKey, number>
}

export const COLOR_KEYS: ColorKey[] = ['primary', 'secondary', 'error', 'success', 'bg', 'text']
export const SIZE_KEYS: SizeKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
export const WEIGHT_KEYS: WeightKey[] = ['regular', 'medium', 'bold']
export const RADIUS_KEYS: RadiusKey[] = ['sm', 'md', 'lg']
export const SPACING_KEYS: SpacingKey[] = ['1', '2', '3', '4', '5', '6']

// sizes = round(baseSize × scale^n), n = -2..3 (부록 C 공식)
export function computeSizes(baseSize: number, scale: number): Record<SizeKey, number> {
  const exp = [-2, -1, 0, 1, 2, 3]
  const out = {} as Record<SizeKey, number>
  SIZE_KEYS.forEach((k, i) => {
    out[k] = Math.round(baseSize * Math.pow(scale, exp[i]))
  })
  return out
}

export const PRESETS: Record<PresetName, TokensJson> = {
  bootstrap: {
    $preset: 'bootstrap',
    color: {
      primary: '#0D6EFD',
      secondary: '#6C757D',
      error: '#DC3545',
      success: '#198754',
      bg: '#FFFFFF',
      text: '#212529',
    },
    typography: {
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      baseSize: 16,
      scale: 1.25,
      sizes: computeSizes(16, 1.25),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
  tailwind: {
    $preset: 'tailwind',
    color: {
      primary: '#2563EB',
      secondary: '#64748B',
      error: '#EF4444',
      success: '#22C55E',
      bg: '#FFFFFF',
      text: '#0F172A',
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      baseSize: 16,
      scale: 1.25,
      sizes: computeSizes(16, 1.25),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
  toss: {
    $preset: 'toss',
    color: {
      primary: '#3182F6',
      secondary: '#4E5968',
      error: '#F04452',
      success: '#00C471',
      bg: '#FFFFFF',
      text: '#191F28',
    },
    typography: {
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      baseSize: 16,
      scale: 1.2,
      sizes: computeSizes(16, 1.2),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
}

export const PRESET_NAMES: PresetName[] = ['bootstrap', 'tailwind', 'toss']

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}

export function rgbToHex(rgb: RGB): string {
  const c = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`
}

/** fontFamily CSS 문자열에서 첫 패밀리명 추출: "'Pretendard', ..." → "Pretendard" */
export function firstFontFamily(fontFamily: string): string {
  const first = fontFamily.split(',')[0].trim()
  return first.replace(/^['"]|['"]$/g, '')
}
