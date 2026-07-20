/**
 * 계약(generated/<Name>.figma.json) → ComponentSetSpec — **순수 계층**.
 *
 * "이 컴포넌트를 Figma 에서 어떤 Component/ComponentSet 으로, 어떤 변형 조합으로, 각 변형은
 * 어떤 노드 트리로 만들 것인가"를 전부 여기서 결정한다. Figma API 호출은 한 줄도 없다.
 *
 * 컴포넌트별 분기(if name === 'Button')는 금지다 — 구조는 계약의 anatomy 가, anatomy 가 없으면
 * tokens 키 이름이 알려 준다(deriveAnatomy).
 */
import type { Anatomy, AnatomyNode, AnatomyStyles } from './anatomy';
import { normalizeAnatomy } from './anatomy';
import type { BuildContext, NodeSpec } from './node-spec';
import { buildNodeSpec, collectBindings, collectUnbound } from './node-spec';
import type { UnboundField, VarBinding } from './node-spec';
import type { VariantTokens } from './tokens';
import { normalizeVariantTokens } from './tokens';

// ---------------------------------------------------------------------------
// 입력 형식 — generated/<Name>.figma.json
// ---------------------------------------------------------------------------

export type FigmaPropType = 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';

export interface FigmaPropSpec {
  /** Figma 속성 이름 (예: 'Variant', 'Children') */
  name: string;
  /** 계약 prop 이름 (예: 'variant', 'children') — anatomy 의 textProp/slotProp 이 가리키는 이름 */
  prop?: string;
  /** 문서의 prop 섹션 헤더 밑 한 줄 설명 — codegen 이 계약에서 뽑아 둔다 */
  summary?: string;
  type: FigmaPropType;
  values?: string[];
  default?: unknown;
  accepts?: string[];
}

export interface ComponentFigmaSpec {
  name: string;
  version?: string;
  level?: string;
  category?: string;
  /** draft·beta·stable·deprecated — 문서 카드의 상태 칩 */
  status?: string;
  /** 카드 제목 밑 한 줄 설명 */
  summary?: string;
  /** 인터랙션 매트릭스 행의 원천 (hover·disabled·loading…) */
  states?: string[];
  variantProperties: Record<string, { values: string[]; default: string }>;
  properties?: FigmaPropSpec[];
  tokens?: Record<string, string>;
  /** 변형 축별 토큰 표 — prop → 값 → 토큰 키 → 경로. flat tokens 보다 우선한다 */
  variantTokens?: unknown;
  /** 계약이 직접 선언한 부위 트리. 없으면 tokens 키에서 파생한다 */
  anatomy?: unknown;
  /**
   * codegen 이 실제 구현에서 추출한 자산 표 — prop 이름 → prop 값 → SVG 마크업.
   * anatomy 의 svgFrom 이 이 표를 가리킨다 (아이콘 벡터의 원천).
   */
  assets?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

// ---------------------------------------------------------------------------
// 출력 형식
// ---------------------------------------------------------------------------

export interface VariantAxis {
  /** Figma 속성 이름 */
  name: string;
  /** 계약 prop 이름 */
  prop: string;
  values: string[];
  default: string;
}

export interface VariantSpec {
  /** Figma 변형 이름 — 'Variant=primary, Size=md' */
  name: string;
  /** 축 이름 → 값 (Figma 이름 기준) */
  values: Record<string, string>;
  /** 이 변형이 기본 조합인가 */
  isDefault: boolean;
  node: NodeSpec;
}

export interface ComponentSetSpec {
  name: string;
  level: string;
  category: string;
  /** 변형축이 없으면 단일 Component 로 만든다 */
  isSet: boolean;
  axes: VariantAxis[];
  variants: VariantSpec[];
  /** addComponentProperty 대상 (BOOLEAN/TEXT/INSTANCE_SWAP) */
  properties: FigmaPropSpec[];
  /**
   * Figma TEXT 속성 이름 → anatomy 가 선언한 표본 문구.
   *
   * Figma 는 TEXT 컴포넌트 속성이 걸린 레이어의 characters 를 **속성값으로 덮어쓴다**.
   * 계약의 default 가 빈 문자열이면(대부분의 계약이 그렇다 — 코드에서는 필수 prop 이라
   * 기본값이 없는 것이 옳다) 레이어에 표본을 아무리 써 놔도 Figma 에서는 빈 칸이 된다.
   * 그래서 같은 계약이 anatomy 에 이미 적어 둔 표본 문구를 속성 기본값으로 승계한다 —
   * 원천은 여전히 계약 하나이고, 컴포넌트별 분기는 없다.
   */
  textSpecimens: ReadonlyMap<string, string>;
  /**
   * 어떤 텍스트 부위가 실제로 참조하는 Figma TEXT 속성 이름들.
   *
   * Id·Name·Src·Href 처럼 **레이어에 걸리지 않는** 코드 전용 prop 은 기본값이 비어도 무해하다
   * (화면에 나타나는 자리가 없다). 반대로 여기 들어 있는데 표본이 없으면 그 레이어는 빈 칸으로
   * 보인다 — 경고를 낼 가치가 있는 것은 후자뿐이다.
   */
  textBoundProps: ReadonlySet<string>;
  /** anatomy 출처 — 계약 선언인지 파생인지 (리포트용) */
  anatomySource: 'contract' | 'derived';
  /** 정규화된 변형별 토큰 표 — 패리티 검사가 DS 쪽 값과 대조하는 원천 */
  variantTokens: VariantTokens;
  /** 트리 전체의 Variable 바인딩 요청 (변형 전부 합산) */
  bindings: VarBinding[];
  /** 바인딩 불가 항목 (변형 전부 합산) */
  unbound: UnboundField[];
}

/**
 * 변형 조합 상한 — 초과하면 계약 분리 대상.
 *
 * 이 가드는 **의도치 않은** 조합 폭발(축을 잘못 곱한 계약)을 잡으려는 것이지, 열거형 자산 축을
 * 막으려는 것이 아니다. Icon 처럼 모양 자체가 열거인 계약은 값이 늘수록 변형도 정직하게 는다 —
 * 현재 59종 × 크기 4단 = 236 조합이고, 이건 결함이 아니라 계약이 실제로 그만큼 크다는 뜻이다.
 * (Figma 자체의 제한이 아니라 우리 가드다. 크기 축을 버리면 236→59 로 줄지만 sm·md·lg 를
 * 디자이너가 고를 수 없게 되므로 실제 정보를 잃는다.)
 * 320 은 59종 아이콘 × 4단에 여유를 두면서도 진짜 폭주는 여전히 잡는 값이다.
 */
export const MAX_VARIANTS = 320;

// ---------------------------------------------------------------------------
// tokens 키 → 부위 파생 (계약이 anatomy 를 선언하지 않았을 때의 폴백)
// ---------------------------------------------------------------------------

/** 역할 어휘 — 토큰 키에서 이 단어를 찾으면 역할이고, 앞에 남는 토막이 부위 이름이다 */
const ROLE_WORDS: Record<string, keyof AnatomyStyles> = {
  surface: 'fill',
  background: 'fill',
  bg: 'fill',
  border: 'stroke',
  outline: 'stroke',
  borderwidth: 'strokeWidth',
  text: 'color',
  foreground: 'color',
  fg: 'color',
  label: 'color',
  title: 'color',
  caption: 'color',
  icon: 'color',
  radius: 'radius',
  gap: 'gap',
  padding: 'pad',
  paddingx: 'padX',
  paddingy: 'padY',
  typography: 'typography',
  size: 'size',
};

/** 상태/레이아웃 수식어 — 부위가 아니다. 기본 상태만 그리므로 부위로 잡히면 버린다 */
const STATE_WORDS = new Set([
  'hover',
  'active',
  'disabled',
  'focus',
  'focusring',
  'selected',
  'pressed',
  'checked',
  'on',
  'off',
  'dimmed',
  'muted',
  'invalid',
  'error',
  'block',
  'inline',
  'transition',
  'motion',
]);

/** camelCase 키를 소문자 토막으로 (headText → ['head','text']) */
export function segmentsOf(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0);
}

interface DerivedPart {
  name: string;
  styles: AnatomyStyles;
}

/**
 * tokens 키를 **부위 × 역할**로 해체해 anatomy 를 만든다.
 * 변형 값이 들어간 키(surfaceDanger)는 역할만 남기고 값 축은 buildNodeSpec 의 후보 탐색이
 * 처리하므로 여기서는 **값 토막을 지운 기본 키**로 환원한다.
 */
export function deriveAnatomy(spec: ComponentFigmaSpec): Anatomy {
  const tokens = spec.tokens ?? {};
  const axisValues = new Set<string>();
  for (const def of Object.values(spec.variantProperties)) {
    for (const value of def.values) axisValues.add(value.toLowerCase());
  }

  const rootStyles: AnatomyStyles = {};
  const parts: DerivedPart[] = [];
  const partIndex = new Map<string, DerivedPart>();

  for (const key of Object.keys(tokens)) {
    const segs = segmentsOf(key);
    // 변형 값 토막은 제거한다 — 'surfaceDanger' → 'surface' (값 선택은 토큰 후보 탐색이 한다)
    const rest = segs.filter((s) => !axisValues.has(s));
    if (rest.length === 0) continue;

    // 'paddingX' 처럼 붙여 읽어야 역할인 경우를 먼저 본다
    let role: keyof AnatomyStyles | undefined = ROLE_WORDS[rest.join('')];
    let partName = '';
    if (role === undefined) {
      const roleIdx = rest.findIndex((s) => ROLE_WORDS[s] !== undefined);
      if (roleIdx < 0) continue; // 역할 어휘가 없는 키(duration·easing 등)는 그리지 않는다
      if (roleIdx === 0) {
        // 역할이 앞 → 뒤는 상태 수식어(backgroundHover). 기본 상태만 그리므로 건너뛴다
        if (rest.length > 1) continue;
        role = ROLE_WORDS[rest[0] ?? ''];
      } else {
        role = ROLE_WORDS[rest[roleIdx] ?? ''];
        partName = rest.slice(0, roleIdx).join('-');
      }
    }
    if (role === undefined) continue;
    if (partName.length > 0 && STATE_WORDS.has(partName.replace(/-/g, ''))) continue;

    // 환원된 기본 키를 쓴다 — 실제 값 선택은 activeValues 후보 탐색이 담당
    const baseKey = reduceKey(key, axisValues);
    if (partName.length === 0) {
      if (rootStyles[role] === undefined) rootStyles[role] = baseKey;
      continue;
    }
    let part = partIndex.get(partName);
    if (!part) {
      part = { name: partName, styles: {} };
      partIndex.set(partName, part);
      parts.push(part);
    }
    if (part.styles[role] === undefined) part.styles[role] = baseKey;
  }

  const children: AnatomyNode[] = [
    { kind: 'text', name: 'Label', text: spec.name, styles: pickTextStyles(rootStyles) },
  ];
  for (const part of parts) {
    children.push({
      kind: 'frame',
      name: titleize(part.name),
      layout: 'HORIZONTAL',
      align: 'CENTER',
      styles: part.styles,
      children: [
        {
          kind: 'text',
          name: `${titleize(part.name)} Label`,
          text: titleize(part.name),
          styles: pickTextStyles(part.styles),
        },
      ],
    });
  }

  return {
    kind: 'frame',
    name: 'Root',
    layout: 'VERTICAL',
    align: 'MIN',
    styles: rootStyles,
    children,
  };
}

/** 부위 스타일에서 텍스트 노드가 쓸 축(color·typography)만 뽑는다 */
function pickTextStyles(styles: AnatomyStyles): AnatomyStyles {
  const out: AnatomyStyles = {};
  if (styles.color !== undefined) out.color = styles.color;
  if (styles.typography !== undefined) out.typography = styles.typography;
  return out;
}

/** 'surfaceDanger' → 'surface' — 변형 값 토막을 지운 기본 키 */
function reduceKey(key: string, axisValues: ReadonlySet<string>): string {
  const segs = segmentsOf(key);
  const kept = segs.filter((s) => !axisValues.has(s));
  if (kept.length === segs.length) return key;
  if (kept.length === 0) return key;
  return kept.map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))).join('');
}

function titleize(s: string): string {
  return s
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// 조합 생성
// ---------------------------------------------------------------------------

/** 카테시안 곱 — 축 순서를 보존한다(변형 이름의 결정성) */
export function cartesian<T>(groups: readonly T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap((combo) => group.map((item) => [...combo, item])),
    [[]],
  );
}

/**
 * anatomy 를 훑어 textProp 이 걸린 텍스트 부위의 표본 문구를 모은다.
 * 반환 키는 **Figma 속성 이름**(예: 'Children') — addComponentProperty 가 쓰는 이름과 같다.
 */
function collectTextSpecimens(
  anatomy: AnatomyNode,
  figmaPropertyOf: Readonly<Record<string, string>>,
): { specimens: Map<string, string>; bound: Set<string> } {
  const specimens = new Map<string, string>();
  const bound = new Set<string>();
  const walk = (node: AnatomyNode): void => {
    if (node.kind === 'text' && node.textProp !== undefined) {
      const figmaName = figmaPropertyOf[node.textProp];
      if (figmaName !== undefined) {
        bound.add(figmaName);
        const specimen = node.text ?? node.name;
        // 먼저 발견한 부위가 이긴다 — anatomy 선언 순서가 정본이다
        if (specimen.length > 0 && !specimens.has(figmaName)) {
          specimens.set(figmaName, specimen);
        }
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(anatomy);
  return { specimens, bound };
}

/** properties[] 가 없는 구형 페이로드를 variantProperties 로부터 복원한다 */
function fallbackProps(spec: ComponentFigmaSpec): FigmaPropSpec[] {
  return Object.entries(spec.variantProperties).map(([name, def]) => ({
    name,
    type: 'VARIANT' as const,
    values: def.values,
    default: def.default,
  }));
}

/**
 * 계약 하나를 ComponentSetSpec 으로 옮긴다.
 * varNames 는 파일에 실존하는 Variable 이름 집합 — 없는 Variable 로는 바인딩을 요청하지 않는다.
 */
export function buildComponentSetSpec(
  spec: ComponentFigmaSpec,
  varNames: ReadonlySet<string>,
  tokenValues?: ReadonlyMap<string, string | number | boolean>,
): ComponentSetSpec {
  const props: FigmaPropSpec[] =
    Array.isArray(spec.properties) && spec.properties.length > 0
      ? spec.properties
      : fallbackProps(spec);

  // 축 이름·값 중복 제거 — 중복은 동일 조합명을 만들어 combineAsVariants 를 깨뜨린다
  const seen = new Set<string>();
  const axes: VariantAxis[] = [];
  for (const p of props) {
    if (p.type !== 'VARIANT') continue;
    if (!Array.isArray(p.values) || p.values.length === 0) continue;
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    const values = [...new Set(p.values)];
    axes.push({
      name: p.name,
      prop: p.prop ?? p.name,
      values,
      default:
        typeof p.default === 'string' && values.indexOf(p.default) >= 0
          ? p.default
          : (values[0] ?? ''),
    });
  }

  const otherProps = props.filter((p) => p.type !== 'VARIANT');
  const figmaPropertyOf: Record<string, string> = {};
  for (const p of props) figmaPropertyOf[p.prop ?? p.name] = p.name;

  const declared = normalizeAnatomy(spec.anatomy);
  const anatomy = declared ?? deriveAnatomy(spec);
  const anatomySource: 'contract' | 'derived' = declared ? 'contract' : 'derived';

  const tokens = spec.tokens ?? {};
  const variantTokens = normalizeVariantTokens(spec.variantTokens);
  const makeVariant = (
    values: Record<string, string>,
    isDefault: boolean,
    name: string,
  ): VariantSpec => {
    // when 조건은 **계약 prop 이름**으로 쓰므로 축 이름을 계약 이름으로 되돌려 준다
    const propValues: Record<string, string> = {};
    for (const axis of axes) {
      const value = values[axis.name];
      if (value !== undefined) propValues[axis.prop] = value;
    }
    const ctx: BuildContext = {
      tokens,
      activeValues: Object.values(values),
      varNames,
      figmaPropertyOf,
      propValues,
      variantTokens,
      ...(spec.assets !== undefined ? { assets: spec.assets } : {}),
      ...(tokenValues !== undefined ? { tokenValues } : {}),
    };
    return { name, values, isDefault, node: buildNodeSpec(anatomy, ctx) };
  };

  const variants: VariantSpec[] = [];
  if (axes.length === 0) {
    variants.push(makeVariant({}, true, spec.name));
  } else {
    const combos = cartesian(
      axes.map((axis) => axis.values.map((value) => ({ axis: axis.name, value }))),
    );
    if (combos.length > MAX_VARIANTS) {
      throw new Error(
        `${spec.name}: 변형 조합 ${String(combos.length)}개 > ${String(MAX_VARIANTS)} — 계약 분리가 필요합니다`,
      );
    }
    for (const combo of combos) {
      const values: Record<string, string> = {};
      for (const item of combo) values[item.axis] = item.value;
      const name = combo.map((item) => `${item.axis}=${item.value}`).join(', ');
      const isDefault = axes.every((axis) => values[axis.name] === axis.default);
      variants.push(makeVariant(values, isDefault, name));
    }
    // 기본 조합을 맨 앞으로 — Figma 는 공간상 좌상단을 defaultVariant 로 삼는다
    variants.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
  }

  const textLayerProps = collectTextSpecimens(anatomy, figmaPropertyOf);

  const bindings: VarBinding[] = [];
  const unbound: UnboundField[] = [];
  for (const variant of variants) {
    bindings.push(...collectBindings(variant.node));
    unbound.push(...collectUnbound(variant.node));
  }

  return {
    name: spec.name,
    level: typeof spec.level === 'string' && spec.level.length > 0 ? spec.level : 'atom',
    category:
      typeof spec.category === 'string' && spec.category.length > 0 ? spec.category : 'Utilities',
    isSet: variants.length > 1,
    axes,
    variants,
    properties: otherProps,
    textSpecimens: textLayerProps.specimens,
    textBoundProps: textLayerProps.bound,
    anatomySource,
    variantTokens,
    bindings,
    unbound,
  };
}
