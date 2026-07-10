// V1-2 — 매핑 규약 검증: src/ds/* props ↔ figma-plugin COMPONENT_MANIFEST 대조
// §3 분류 규칙: union → variant axis / boolean(show*) → BOOLEAN / 기타 boolean → variant(true/false)
//              string → TEXT / ReactNode → INSTANCE_SWAP / children → slot
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

// ── 1. 플러그인 매니페스트 로드 (esbuild로 TS → ESM 변환 후 import) ──
const tmpOut = join(root, 'figma-plugin', 'dist', '__manifest-check.mjs')
execFileSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'esbuild',
    join(root, 'figma-plugin', 'src', 'generators', 'components.ts'),
    '--bundle',
    '--format=esm',
    `--outfile=${tmpOut}`,
  ],
  { cwd: join(root, 'figma-plugin'), stdio: 'pipe', shell: process.platform === 'win32' },
)
const { COMPONENT_MANIFEST } = await import(pathToFileURL(tmpOut).href)
rmSync(tmpOut)

// ── 2. src/ds TSX props 파싱 ──
function parseProps(component) {
  const src = readFileSync(join(root, 'src', 'ds', component, `${component}.tsx`), 'utf8')
  const m = src.match(/export type \w+Props = \{([\s\S]*?)\n\}/)
  if (!m) throw new Error(`${component}: Props 타입을 찾지 못함`)
  const props = []
  for (const line of m[1].split('\n')) {
    const pm = line.match(/^\s*(\w+)(\?)?:\s*(.+?)\s*$/)
    if (!pm) continue
    const [, name, optional, typeStr] = pm
    if (typeStr.includes("'")) {
      const values = [...typeStr.matchAll(/'([^']+)'/g)].map((x) => x[1])
      props.push({ name, kind: 'union', values })
    } else if (typeStr.startsWith('boolean')) {
      props.push({ name, kind: 'boolean', optional: !!optional })
    } else if (typeStr.startsWith('string')) {
      props.push({ name, kind: 'string' })
    } else if (typeStr.includes('ReactNode')) {
      props.push({ name, kind: name === 'children' ? 'children' : 'swap' })
    }
  }
  return props
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function check(component, manifestName) {
  const spec = COMPONENT_MANIFEST.components.find((c) => c.name === manifestName)
  if (!spec) {
    failures.push(`${manifestName}: 매니페스트에 없음`)
    return
  }
  const props = parseProps(component)

  // §3 분류 규칙으로 기대 매니페스트 구성
  const expectAxes = []
  const expectText = []
  const expectBooleans = []
  const expectSwaps = []
  let expectSlot = null
  for (const p of props) {
    if (p.kind === 'union') expectAxes.push({ name: p.name, values: p.values })
    else if (p.kind === 'boolean' && p.name.startsWith('show')) expectBooleans.push(p.name)
    else if (p.kind === 'boolean') expectAxes.push({ name: p.name, values: ['false', 'true'] })
    else if (p.kind === 'string') expectText.push(p.name)
    else if (p.kind === 'swap') expectSwaps.push(p.name)
    else if (p.kind === 'children') expectSlot = 'content' // children ↔ content (§3)
  }

  const actualAxes = spec.variants.map((v) => ({ name: v.name, values: v.values }))
  if (!eq(actualAxes, expectAxes))
    failures.push(
      `${manifestName}: variant 축 불일치\n  기대(D1): ${JSON.stringify(expectAxes)}\n  실제(P3): ${JSON.stringify(actualAxes)}`,
    )
  const actualText = spec.text.map((t) => t.name)
  if (!eq(actualText, expectText))
    failures.push(`${manifestName}: TEXT 불일치 — 기대 ${expectText} vs 실제 ${actualText}`)
  const actualBooleans = spec.booleans.map((b) => b.name)
  if (!eq(actualBooleans, expectBooleans))
    failures.push(`${manifestName}: BOOLEAN 불일치 — 기대 ${expectBooleans} vs 실제 ${actualBooleans}`)
  const actualSwaps = spec.swaps.map((s) => s.name)
  if (!eq(actualSwaps, expectSwaps))
    failures.push(`${manifestName}: INSTANCE_SWAP 불일치 — 기대 ${expectSwaps} vs 실제 ${actualSwaps}`)
  const actualSlot = spec.slot ? spec.slot.name : null
  if (actualSlot !== expectSlot)
    failures.push(`${manifestName}: slot 불일치 — 기대 ${expectSlot} vs 실제 ${actualSlot}`)
}

check('Button', 'DS/Button')
check('TextField', 'DS/TextField')
check('Card', 'DS/Card')
check('Alert', 'DS/Alert')
check('Badge', 'DS/Badge')

// D2: provider/size 유니온 ↔ manifest.social
{
  const props = parseProps('SocialLoginButton')
  const provider = props.find((p) => p.name === 'provider')
  const size = props.find((p) => p.name === 'size')
  if (!eq(provider?.values, COMPONENT_MANIFEST.social.providers))
    failures.push(`DS/SocialLoginButton: provider 불일치 — ${provider?.values} vs ${COMPONENT_MANIFEST.social.providers}`)
  if (!eq(size?.values, COMPONENT_MANIFEST.social.sizes))
    failures.push(`DS/SocialLoginButton: size 불일치 — ${size?.values} vs ${COMPONENT_MANIFEST.social.sizes}`)
}

// D3: type 유니온 ↔ manifest.chart.types
{
  const src = readFileSync(join(root, 'src', 'ds', 'Chart', 'DsChart.tsx'), 'utf8')
  const m = src.match(/type:\s*((?:'[^']+'\s*\|?\s*)+)/)
  const types = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []
  if (!eq(types, COMPONENT_MANIFEST.chart.types))
    failures.push(`DS/Chart: type 불일치 — ${types} vs ${COMPONENT_MANIFEST.chart.types}`)
}

if (failures.length > 0) {
  console.error(`verify-mapping FAIL — ${failures.length}건:\n` + failures.join('\n'))
  process.exit(1)
}
console.log('verify-mapping OK — D1~D3 props ↔ P3 매니페스트 불일치 0건')
