// 컴포넌트 카테고리 문서 — 네이티브 편집형 컴포넌트(베리언트 포함)를 TDS 문서로 배치.
// 오너: "완벽한 문서 + 피그마 디자인 컴포넌트 베리언트". 스펙: docs/spec/input-category-spec.md,
// figma-tds-doc-style.md, figma-category-layout.md.
// Input 계열(단순 TextField-family 8종)을 1차 구현 — 이후 같은 machinery로 카테고리 확장.
import {
  type Ctx,
  solid,
  boundPaint,
  autoFrame,
  txt,
  makeRoot,
  makeHeader,
  makeSection,
  setup,
  placeRoot,
  INK,
  SUB,
  MUTED,
  BORDER,
  ACCENT,
  WHITE,
} from './foundations'
import { ICON_PATHS } from '../icons-data'
import { svgToFigmaPath } from '../svg-path'

const SOURCE_PAGE = 'DS · 컴포넌트 소스'
const FIELD_W = 300

export const CATEGORY_PAGE_NAMES = ['Input', SOURCE_PAGE]

// ── 색 바인딩 텍스트(프리셋 재색) ─────────────────────────────────────
function boundText(ctx: Ctx, chars: string, size: number, varName: string, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  return t
}
function bindFillVar(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(hex)]
}
function bindStrokeVar(ctx: Ctx, node: MinimalStrokesMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(hex)]
}

// 작은 라인아트 아이콘(24그리드 → size)
function iconNode(ctx: Ctx, key: string, size: number, hex: string): FrameNode {
  const wrap = figma.createFrame()
  wrap.name = 'icon'
  wrap.resize(size, size)
  wrap.fills = []
  wrap.clipsContent = false
  const paths = ICON_PATHS[key]
  if (paths) {
    const v = figma.createVector()
    try {
      v.vectorPaths = [{ windingRule: 'NONZERO', data: paths.map(svgToFigmaPath).join(' ') }]
    } catch {
      /* skip */
    }
    v.fills = [solid(hex)]
    v.strokes = []
    wrap.appendChild(v)
    v.x = 0
    v.y = 0
    v.resize(size, size)
  }
  return wrap
}

// ── Input 정의 ────────────────────────────────────────────────────────
type Affordance = {
  leading?: 'search'
  trailing?: 'eye' | 'clear' | 'unit' | 'stepper'
  unit?: string
  otp?: number
  textarea?: boolean
}
type State = { caption: string; props: Record<string, string> }
type InputDef = {
  key: string
  setName: string
  label: string
  placeholder: string
  eyebrow: string
  desc: string
  helper: string
  affordance: Affordance
  axes: string[]
  states: State[]
}

const D = 'false'
const INPUTS: InputDef[] = [
  {
    key: 'TextField',
    setName: 'DS/TextField',
    label: '이메일',
    placeholder: 'name@example.com',
    eyebrow: 'MOLECULE · INPUT',
    desc: '라벨·설명·헬퍼텍스트를 지원하는 기본 한 줄 텍스트 입력.',
    helper: '업무용 이메일을 입력하세요.',
    affordance: {},
    axes: ['error', 'success', 'disabled', 'readOnly'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'Success', props: { success: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
      { caption: 'ReadOnly', props: { readOnly: 'true' } },
    ],
  },
  {
    key: 'EmailField',
    setName: 'DS/EmailField',
    label: '이메일',
    placeholder: 'name@example.com',
    eyebrow: 'MOLECULE · INPUT',
    desc: '블러 시 이메일 형식을 검증해 에러/성공을 표시하는 입력.',
    helper: '가입에 사용할 이메일이에요.',
    affordance: {},
    axes: ['error', 'success', 'disabled', 'required'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Required', props: { required: 'true' } },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'Success', props: { success: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
    ],
  },
  {
    key: 'PasswordField',
    setName: 'DS/PasswordField',
    label: '비밀번호',
    placeholder: '8자 이상 입력',
    eyebrow: 'MOLECULE · INPUT',
    desc: '표시/숨김 눈 아이콘 토글이 붙은 비밀번호 입력.',
    helper: '영문·숫자·기호를 조합하세요.',
    affordance: { trailing: 'eye' },
    axes: ['error', 'success', 'disabled', 'required'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'Success', props: { success: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
      { caption: 'Required', props: { required: 'true' } },
    ],
  },
  {
    key: 'SearchField',
    setName: 'DS/SearchField',
    label: '검색',
    placeholder: '검색어를 입력하세요',
    eyebrow: 'MOLECULE · INPUT',
    desc: '검색 아이콘과 지우기 버튼을 가진 검색창.',
    helper: '',
    affordance: { leading: 'search', trailing: 'clear' },
    axes: ['disabled'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Disabled', props: { disabled: 'true' } },
    ],
  },
  {
    key: 'NumberField',
    setName: 'DS/NumberField',
    label: '수량',
    placeholder: '0',
    eyebrow: 'MOLECULE · INPUT',
    desc: '단위 표기 + 증감(−/+) 스테퍼가 붙은 숫자 입력.',
    helper: '',
    affordance: { trailing: 'stepper', unit: '개' },
    axes: ['disabled', 'readOnly'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'ReadOnly', props: { readOnly: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
    ],
  },
  {
    key: 'CurrencyField',
    setName: 'DS/CurrencyField',
    label: '금액',
    placeholder: '0',
    eyebrow: 'MOLECULE · INPUT',
    desc: '천단위 콤마 + 통화 단위 표기가 붙은 금액 입력.',
    helper: '최대 50,000원까지 입력할 수 있어요.',
    affordance: { trailing: 'unit', unit: '원' },
    axes: ['error', 'disabled', 'readOnly'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'ReadOnly', props: { readOnly: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
    ],
  },
  {
    key: 'OtpField',
    setName: 'DS/OtpField',
    label: '인증번호',
    placeholder: '',
    eyebrow: 'MOLECULE · INPUT',
    desc: '자릿수만큼 분리된 셀에 입력하는 인증번호(OTP) 필드.',
    helper: '문자로 받은 6자리를 입력하세요.',
    affordance: { otp: 6 },
    axes: ['error', 'disabled'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
    ],
  },
  {
    key: 'Textarea',
    setName: 'DS/Textarea',
    label: '내용',
    placeholder: '내용을 입력하세요',
    eyebrow: 'MOLECULE · INPUT',
    desc: '자동 높이 조절 + 글자수 카운터가 붙은 여러 줄 텍스트 입력.',
    helper: '10자 이상 입력하세요.',
    affordance: { textarea: true },
    axes: ['error', 'disabled', 'readOnly', 'required'],
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Error', props: { error: 'true' } },
      { caption: 'ReadOnly', props: { readOnly: 'true' } },
      { caption: 'Disabled', props: { disabled: 'true' } },
      { caption: 'Required', props: { required: 'true' } },
    ],
  },
]

// ── 한 베리언트 컴포넌트 렌더 ────────────────────────────────────────
function renderInput(ctx: Ctx, def: InputDef, combo: Record<string, string>): ComponentNode {
  const error = combo.error === 'true'
  const success = combo.success === 'true'
  const disabled = combo.disabled === 'true'
  const readOnly = combo.readOnly === 'true'
  const required = combo.required === 'true'
  const toneVar = error ? 'color/error' : success ? 'color/success' : null
  const toneHex = error ? '#F04452' : success ? '#00C471' : null

  const c = figma.createComponent()
  c.name = def.axes.map((a) => `${a}=${combo[a]}`).join(', ')
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(FIELD_W, c.height)
  c.primaryAxisSizingMode = 'AUTO'
  c.itemSpacing = 6
  c.fills = []
  if (disabled) c.opacity = 0.45

  // 라벨(+필수 *)
  const labelRow = autoFrame('label-row', 'HORIZONTAL')
  labelRow.itemSpacing = 2
  labelRow.appendChild(boundText(ctx, def.label, 13, 'color/text', INK, true))
  if (required) {
    const star = txt(ctx, '*', 13, '#F04452', true)
    labelRow.appendChild(star)
  }
  c.appendChild(labelRow)

  if (def.affordance.otp) {
    // OTP: N개 셀
    const cells = autoFrame('cells', 'HORIZONTAL')
    cells.layoutAlign = 'STRETCH'
    cells.primaryAxisSizingMode = 'FIXED'
    cells.itemSpacing = 6
    for (let i = 0; i < def.affordance.otp; i++) {
      const cell = autoFrame('cell', 'HORIZONTAL')
      cell.primaryAxisAlignItems = 'CENTER'
      cell.counterAxisAlignItems = 'CENTER'
      cell.layoutGrow = 1
      cell.primaryAxisSizingMode = 'FIXED'
      cell.paddingTop = cell.paddingBottom = 10
      cell.cornerRadius = 8
      bindFillVar(ctx, cell, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? '#F5F7FA' : WHITE)
      bindStrokeVar(ctx, cell, toneVar ?? 'color/border', toneHex ?? BORDER)
      cell.strokeWeight = 1
      cell.strokeAlign = 'INSIDE'
      const digit = i < 3 ? String(i + 1) : ''
      cell.appendChild(boundText(ctx, digit, 16, 'color/text', INK, true))
      cells.appendChild(cell)
    }
    c.appendChild(cells)
  } else {
    // 입력 행
    const input = autoFrame('input', 'HORIZONTAL')
    input.counterAxisAlignItems = 'CENTER'
    input.layoutAlign = 'STRETCH'
    input.primaryAxisSizingMode = 'FIXED'
    input.itemSpacing = 8
    input.paddingTop = input.paddingBottom = def.affordance.textarea ? 12 : 10
    input.paddingLeft = input.paddingRight = 12
    if (def.affordance.textarea) {
      input.counterAxisAlignItems = 'MIN'
      input.minHeight = 76
    }
    input.cornerRadius = 8
    bindFillVar(ctx, input, disabled || readOnly ? 'color/bgSubtle' : 'color/bg', disabled || readOnly ? '#F5F7FA' : WHITE)
    bindStrokeVar(ctx, input, toneVar ?? 'color/border', toneHex ?? BORDER)
    input.strokeWeight = 1
    input.strokeAlign = 'INSIDE'

    if (def.affordance.leading === 'search') input.appendChild(iconNode(ctx, '_Icon/Search', 16, MUTED))

    const val = boundText(ctx, def.placeholder, 15, 'color/secondary', MUTED)
    val.layoutGrow = 1
    val.textAutoResize = 'HEIGHT'
    input.appendChild(val)

    if (def.affordance.unit) input.appendChild(txt(ctx, def.affordance.unit, 14, SUB))
    if (def.affordance.trailing === 'eye') input.appendChild(iconNode(ctx, '_Icon/Eye', 16, MUTED))
    if (def.affordance.trailing === 'clear') input.appendChild(iconNode(ctx, '_Icon/Close', 15, MUTED))
    if (def.affordance.trailing === 'stepper') {
      const minus = iconNode(ctx, '_Icon/Minus', 18, SUB)
      const plus = iconNode(ctx, '_Icon/Plus', 18, SUB)
      input.appendChild(minus)
      input.appendChild(plus)
    }
    c.appendChild(input)
  }

  // 헬퍼 텍스트(상태별)
  const helperMsg = error
    ? errorMsg(def.key)
    : success
      ? '사용 가능합니다.'
      : def.helper
  if (helperMsg) {
    const helper = boundText(ctx, helperMsg, 12, toneVar ?? 'color/secondary', toneHex ?? SUB)
    helper.layoutAlign = 'STRETCH'
    helper.textAutoResize = 'HEIGHT'
    c.appendChild(helper)
  }
  return c
}

function errorMsg(key: string): string {
  if (key === 'EmailField' || key === 'TextField') return '올바른 이메일 형식이 아닙니다.'
  if (key === 'PasswordField') return '비밀번호가 너무 짧습니다.'
  if (key === 'CurrencyField') return '잔액이 부족합니다.'
  if (key === 'OtpField') return '인증번호가 일치하지 않습니다.'
  return '입력값을 확인하세요.'
}

function makeInputSet(ctx: Ctx, def: InputDef, page: PageNode): ComponentSetNode {
  // 축의 카르테시안 곱으로 베리언트 전개
  let combos: Record<string, string>[] = [{}]
  for (const axis of def.axes) {
    const next: Record<string, string>[] = []
    for (const combo of combos) for (const v of ['false', 'true']) next.push({ ...combo, [axis]: v })
    combos = next
  }
  const variants: ComponentNode[] = []
  for (const combo of combos) {
    const filled: Record<string, string> = {}
    for (const a of def.axes) filled[a] = combo[a] ?? D
    const comp = renderInput(ctx, def, filled)
    page.appendChild(comp)
    variants.push(comp)
  }
  const set = figma.combineAsVariants(variants, page)
  set.name = def.setName
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 20
  set.counterAxisSpacing = 20
  set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24
  set.fills = [solid('#FBFCFE')]
  return set
}

// ── 변형 아이템(인스턴스 + 캡션) ────────────────────────────────────
function variantItem(ctx: Ctx, set: ComponentSetNode, state: State): FrameNode {
  const item = autoFrame('Variant / ' + state.caption, 'VERTICAL')
  item.counterAxisAlignItems = 'MIN'
  item.itemSpacing = 8
  const inst = set.defaultVariant.createInstance()
  inst.layoutAlign = 'INHERIT'
  inst.layoutGrow = 0
  try {
    inst.setProperties(state.props)
  } catch {
    ctx.warnings.push(`${set.name} setProperties 실패: ${JSON.stringify(state.props)}`)
  }
  item.appendChild(inst)
  item.appendChild(txt(ctx, state.caption, 12, SUB))
  return item
}

// ── Input 카테고리 페이지 ────────────────────────────────────────────
export async function generateInputCategory(fontFamily: string): Promise<string[]> {
  const ctx = await setup(fontFamily)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (figma.root.children.some((p) => p.name === 'Input')) {
    ctx.warnings.push("페이지 'Input' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').")
    return ctx.warnings
  }

  // 1) 네이티브 컴포넌트 세트를 소스 페이지에 생성
  const source =
    figma.root.children.find((p) => p.name === SOURCE_PAGE) ??
    (() => {
      const p = figma.createPage()
      p.name = SOURCE_PAGE
      return p
    })()
  const sets = new Map<string, ComponentSetNode>()
  let sy = 80
  for (const def of INPUTS) {
    const set = makeInputSet(ctx, def, source)
    set.x = 80
    set.y = sy
    sy += set.height + 64
    sets.set(def.setName, set)
  }

  // 2) Input 문서 페이지
  const page = figma.createPage()
  page.name = 'Input'
  const root = makeRoot('Input')
  placeRoot(root, page)
  makeHeader(
    ctx,
    root,
    'Input',
    '텍스트 입력 계열 — 라벨·입력·헬퍼 규약을 공유하는 폼 필드. 각 컴포넌트의 상태 변형(정상·에러·성공·비활성·읽기전용)을 편집 가능한 Figma 컴포넌트로 렌더합니다.',
  )
  for (const def of INPUTS) {
    const set = sets.get(def.setName)
    const render = makeSection(ctx, root, {
      eyebrow: def.eyebrow,
      name: def.key,
      desc: def.desc,
      meta: [`Set: ${def.setName}`, `변형 ${def.states.length}개`, 'Platform: Web'],
      renderDir: 'WRAP',
    })
    if (!set) {
      ctx.warnings.push(`${def.setName} 세트 없음 — 문서 건너뜀`)
      continue
    }
    for (const state of def.states) render.appendChild(variantItem(ctx, set, state))
  }
  return ctx.warnings
}
