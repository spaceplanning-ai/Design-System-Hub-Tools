// P5 — 토큰 양방향 동기화: export(Variables→JSON) / import(JSON→mode 값 갱신)
import {
  COLOR_KEYS,
  PRESET_NAMES,
  RADIUS_KEYS,
  SIZE_KEYS,
  SPACING_KEYS,
  WEIGHT_KEYS,
  computeSizes,
  hexToRgb,
  rgbToHex,
  type PresetName,
  type TokensJson,
} from '../presets'

// ── 부록 C 스키마 검증 (오류 키 목록 반환; 빈 배열 = 통과) ──
export function validateTokens(json: unknown): string[] {
  const errors: string[] = []
  const j = json as Partial<TokensJson> | null
  if (!j || typeof j !== 'object') return ['(root) 객체가 아님']

  if (!j.$preset || !PRESET_NAMES.includes(j.$preset as PresetName)) {
    errors.push(`$preset: bootstrap|tailwind|toss 중 하나여야 함 (현재: ${String(j.$preset)})`)
  }
  const hexRe = /^#[0-9A-Fa-f]{6}$/
  if (!j.color || typeof j.color !== 'object') errors.push('color: 누락')
  else {
    for (const k of COLOR_KEYS) {
      const v = (j.color as Record<string, unknown>)[k]
      if (typeof v !== 'string' || !hexRe.test(v)) errors.push(`color.${k}: #RRGGBB 형식 아님`)
    }
  }
  const t = j.typography
  if (!t || typeof t !== 'object') errors.push('typography: 누락')
  else {
    if (typeof t.fontFamily !== 'string') errors.push('typography.fontFamily: string 아님')
    if (typeof t.baseSize !== 'number') errors.push('typography.baseSize: number 아님')
    if (typeof t.scale !== 'number') errors.push('typography.scale: number 아님')
    for (const k of SIZE_KEYS) {
      if (typeof (t.sizes as Record<string, unknown> | undefined)?.[k] !== 'number')
        errors.push(`typography.sizes.${k}: number 아님`)
    }
    for (const k of WEIGHT_KEYS) {
      if (typeof (t.weights as Record<string, unknown> | undefined)?.[k] !== 'number')
        errors.push(`typography.weights.${k}: number 아님`)
    }
  }
  if (!j.radius || typeof j.radius !== 'object') errors.push('radius: 누락')
  else {
    for (const k of RADIUS_KEYS) {
      if (typeof (j.radius as Record<string, unknown>)[k] !== 'number')
        errors.push(`radius.${k}: number 아님`)
    }
  }
  if (!j.spacing || typeof j.spacing !== 'object') errors.push('spacing: 누락')
  else {
    for (const k of SPACING_KEYS) {
      if (typeof (j.spacing as Record<string, unknown>)[k] !== 'number')
        errors.push(`spacing.${k}: number 아님`)
    }
  }
  return errors
}

type Collections = {
  color: VariableCollection
  typography: VariableCollection
  radiusSpacing: VariableCollection
  vars: Map<string, Variable>
}

async function getCollections(): Promise<Collections> {
  const cols = await figma.variables.getLocalVariableCollectionsAsync()
  const color = cols.find((c) => c.name === 'DS Color')
  const typography = cols.find((c) => c.name === 'DS Typography')
  const radiusSpacing = cols.find((c) => c.name === 'DS Radius·Spacing')
  if (!color || !typography || !radiusSpacing) {
    throw new Error('DS Color/Typography/Radius·Spacing 컬렉션이 없습니다 — 먼저 토큰을 생성하세요.')
  }
  const vars = new Map((await figma.variables.getLocalVariablesAsync()).map((v) => [v.name, v]))
  return { color, typography, radiusSpacing, vars }
}

function numberOf(vars: Map<string, Variable>, name: string, modeId: string): number {
  const v = vars.get(name)
  if (!v) throw new Error(`변수 없음: ${name}`)
  const raw = v.valuesByMode[modeId]
  if (typeof raw !== 'number') throw new Error(`숫자 아님: ${name}`)
  return raw
}

/** sizes 배열에서 scale 역산 — 표준 후보(1.2/1.25/1.333) 대조 후 일치 시 채택 (왕복 무손실) */
function deduceScale(baseSize: number, sizes: Record<string, number>): number {
  for (const candidate of [1.2, 1.25, 1.333]) {
    const computed = computeSizes(baseSize, candidate)
    if (SIZE_KEYS.every((k) => computed[k] === sizes[k])) return candidate
  }
  return Math.round((sizes.lg / sizes.md) * 100) / 100
}

// ── export: mode당 TokensJson 1개 (COLOR → hex 대문자 6자리) ──
export async function exportTokens(): Promise<TokensJson[]> {
  const { color, typography, radiusSpacing, vars } = await getCollections()
  const typoMode = typography.modes[0].modeId
  const rsMode = radiusSpacing.modes[0].modeId

  const familyRaw = vars.get('font/family')?.valuesByMode[typoMode]
  const fontFamily = typeof familyRaw === 'string' ? familyRaw : ''

  const sizes = {} as TokensJson['typography']['sizes']
  for (const k of SIZE_KEYS) sizes[k] = numberOf(vars, `font/size/${k}`, typoMode)
  const weights = {} as TokensJson['typography']['weights']
  for (const k of WEIGHT_KEYS) weights[k] = numberOf(vars, `font/weight/${k}`, typoMode)
  const radius = {} as TokensJson['radius']
  for (const k of RADIUS_KEYS) radius[k] = numberOf(vars, `radius/${k}`, rsMode)
  const spacing = {} as TokensJson['spacing']
  for (const k of SPACING_KEYS) spacing[k] = numberOf(vars, `spacing/${k}`, rsMode)

  const baseSize = sizes.md
  const scale = deduceScale(baseSize, sizes)

  const out: TokensJson[] = []
  for (const mode of color.modes) {
    const preset = mode.name as PresetName
    const colorOut = {} as TokensJson['color']
    for (const k of COLOR_KEYS) {
      const v = vars.get(`color/${k}`)
      if (!v) throw new Error(`변수 없음: color/${k}`)
      const raw = v.valuesByMode[mode.modeId]
      if (!raw || typeof raw !== 'object' || !('r' in (raw as RGB)))
        throw new Error(`COLOR 아님: color/${k}`)
      colorOut[k] = rgbToHex(raw as RGB)
    }
    out.push({
      $preset: preset,
      color: colorOut,
      typography: { fontFamily, baseSize, scale, sizes, weights },
      radius,
      spacing,
    })
  }
  return out
}

// ── import: 스키마 검증 후 해당 preset mode 값만 갱신 (재생성 금지) ──
export async function importTokens(json: TokensJson): Promise<string[]> {
  const errors = validateTokens(json)
  if (errors.length > 0) {
    throw new Error(`스키마 검증 실패:\n${errors.join('\n')}`)
  }
  const { color, typography, radiusSpacing, vars } = await getCollections()
  const mode = color.modes.find((m) => m.name === json.$preset)
  if (!mode) throw new Error(`'${json.$preset}' mode가 DS Color에 없습니다.`)

  for (const k of COLOR_KEYS) {
    vars.get(`color/${k}`)?.setValueForMode(mode.modeId, hexToRgb(json.color[k]))
  }
  const typoMode = typography.modes[0].modeId
  vars.get('font/family')?.setValueForMode(typoMode, json.typography.fontFamily)
  for (const k of SIZE_KEYS) {
    vars.get(`font/size/${k}`)?.setValueForMode(typoMode, json.typography.sizes[k])
  }
  for (const k of WEIGHT_KEYS) {
    vars.get(`font/weight/${k}`)?.setValueForMode(typoMode, json.typography.weights[k])
  }
  const rsMode = radiusSpacing.modes[0].modeId
  for (const k of RADIUS_KEYS) {
    vars.get(`radius/${k}`)?.setValueForMode(rsMode, json.radius[k])
  }
  for (const k of SPACING_KEYS) {
    vars.get(`spacing/${k}`)?.setValueForMode(rsMode, json.spacing[k])
  }
  return [`'${json.$preset}' mode 값 갱신 완료 (컬렉션 재생성 없음).`]
}
