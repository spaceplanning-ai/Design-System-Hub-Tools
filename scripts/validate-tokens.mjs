// V1-5 — tokens JSON 부록 C 스키마 검증기 (P5 export 산출물 검증에도 사용)
// 사용: node scripts/validate-tokens.mjs [파일...] (기본: tokens/*.json)
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PRESETS = ['bootstrap', 'tailwind', 'toss']
const COLOR_KEYS = ['primary', 'secondary', 'error', 'success', 'bg', 'text']
const SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const WEIGHT_KEYS = ['regular', 'medium', 'bold']
const RADIUS_KEYS = ['sm', 'md', 'lg']
const SPACING_KEYS = ['1', '2', '3', '4', '5', '6']
const HEX = /^#[0-9A-Fa-f]{6}$/

export function validateTokens(json) {
  const errors = []
  if (!json || typeof json !== 'object') return ['(root) 객체가 아님']
  if (!PRESETS.includes(json.$preset)) errors.push(`$preset: ${PRESETS} 중 하나여야 함`)
  if (!json.color) errors.push('color: 누락')
  else for (const k of COLOR_KEYS) {
    if (typeof json.color[k] !== 'string' || !HEX.test(json.color[k]))
      errors.push(`color.${k}: #RRGGBB 형식 아님`)
  }
  const t = json.typography
  if (!t) errors.push('typography: 누락')
  else {
    if (typeof t.fontFamily !== 'string') errors.push('typography.fontFamily: string 아님')
    if (typeof t.baseSize !== 'number') errors.push('typography.baseSize: number 아님')
    if (typeof t.scale !== 'number') errors.push('typography.scale: number 아님')
    for (const k of SIZE_KEYS)
      if (typeof t.sizes?.[k] !== 'number') errors.push(`typography.sizes.${k}: number 아님`)
    for (const k of WEIGHT_KEYS)
      if (typeof t.weights?.[k] !== 'number') errors.push(`typography.weights.${k}: number 아님`)
  }
  if (!json.radius) errors.push('radius: 누락')
  else for (const k of RADIUS_KEYS)
    if (typeof json.radius[k] !== 'number') errors.push(`radius.${k}: number 아님`)
  if (!json.spacing) errors.push('spacing: 누락')
  else for (const k of SPACING_KEYS)
    if (typeof json.spacing[k] !== 'number') errors.push(`spacing.${k}: number 아님`)
  return errors
}

const args = process.argv.slice(2)
const files =
  args.length > 0
    ? args
    : readdirSync(join(root, 'tokens'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(root, 'tokens', f))

let failed = false
for (const file of files) {
  const json = JSON.parse(readFileSync(file, 'utf8'))
  const errors = validateTokens(json)
  if (errors.length > 0) {
    failed = true
    console.error(`FAIL ${file}\n  ${errors.join('\n  ')}`)
  } else {
    console.log(`OK   ${file} ($preset=${json.$preset})`)
  }
}
process.exit(failed ? 1 : 0)
