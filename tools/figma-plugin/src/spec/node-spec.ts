/**
 * NodeSpec — **순수 계층**의 산출물. "무엇을 그릴 것인가"를 직렬화 가능한 트리로 기술한다.
 * Figma API 호출은 이 파일에 한 줄도 없다 (어댑터: src/render/apply.ts).
 *
 * 이 분리가 이 작업의 검증 가능성을 만든다 — 레이아웃/정렬/바인딩 결정은 전부 여기서 일어나고
 * vitest 가 node 에서 그대로 검사한다. 어댑터는 트리를 따라 걸으며 노드를 만들 뿐 판단하지 않는다.
 */
import type {
  AnatomyAlign,
  AnatomyJustify,
  AnatomyKind,
  AnatomyLayout,
  AnatomyNode,
} from './anatomy';
import type { VariantTokens } from './tokens';
import { resolveStyleToken, typographyVars } from './tokens';

/** Variable 바인딩 요청 — 어댑터가 setBoundVariable(ForPaint) 로 옮긴다 */
export interface VarBinding {
  /** Figma 필드명. 'fills'/'strokes' 는 페인트 바인딩, 나머지는 노드 필드 바인딩 */
  field: string;
  /** Figma Variable 이름 (슬래시 표기) */
  variable: string;
  /** 이 바인딩의 출처 — 계약 tokens 블록의 키 (리포트용) */
  tokenKey: string;
}

/** 토큰이 있는데 Figma 가 바인딩을 지원하지 않아 리터럴로 떨어진 항목 */
export interface UnboundField {
  field: string;
  tokenKey: string;
  variable: string;
  reason: string;
}

/** 컴포넌트 속성 → 레이어 연결 요청. 값은 **Figma 속성 이름**(예: 'Children') */
export interface PropRefs {
  /** TEXT 속성 → characters */
  characters?: string;
  /** BOOLEAN 속성 → visible */
  visible?: string;
  /** INSTANCE_SWAP 속성 → mainComponent */
  mainComponent?: string;
}

export interface NodeSpec {
  kind: AnatomyKind;
  name: string;
  layout: AnatomyLayout;
  justify?: AnatomyJustify;
  align?: AnatomyAlign;
  wrap?: boolean;
  /** 고정 폭(px) — 없으면 오토레이아웃 자동 크기 */
  width?: number;
  /** 고정 높이(px) */
  height?: number;
  /** 부모 주축 채움 */
  grow?: boolean;
  /** 이 부위는 반복 회차가 전부 같은 것이 옳다 (렌더 품질 게이트 예외) */
  uniformRepeat?: boolean;
  /**
   * 주축 크기를 고정으로 둘 것인가 (Figma primaryAxisSizingMode='FIXED').
   *
   * **채움과 감싸기는 같은 축에서 공존할 수 없다.** 자식이 부모를 채우려면(FILL) 부모는 그 축에서
   * 내용에 맞춰 줄어들면(hug/AUTO) 안 된다 — 모순이라 Figma 가 거부하고, 자식은 채우지 못한 채
   * 폭이 접힌다. 예전에는 어댑터가 두 축을 무조건 AUTO 로 두어 **라이브러리 전체의 grow 가
   * 한 번도 적용된 적이 없었다**(긴 문구가 늘어나지 않고, 행이 벌어지지 않던 원인).
   * 판정을 순수 계층에서 끝내 두면 vitest 가 검사할 수 있다.
   */
  primaryAxisFixed?: boolean;
  /** kind='text' 의 문자열 */
  characters?: string;
  /**
   * kind='vector' 의 실제 SVG 마크업 — 이 변형에서 그릴 모양.
   * 어댑터가 figma.createNodeFromSvg 로 진짜 벡터 노드를 만든다(이미지 아님).
   */
  svg?: string;
  /**
   * 줄 높이 — Figma 의 PERCENT 값(배수 1.5 → 150).
   * Variable 바인딩은 px 로 해석되어 쓸 수 없으므로 해석값을 리터럴로 적용한다.
   */
  lineHeightPercent?: number;
  /**
   * 글자 굵기의 **해석값**(400·500·600·700).
   *
   * 왜 바인딩만으로 부족한가: Figma 텍스트 노드의 굵기는 `fontWeight` 필드가 아니라
   * **`fontName.style`**(예: 'Inter Semi Bold')이 정한다. `setBoundVariable('fontWeight')` 는
   * 그 스타일이 **이미 로드돼 있을 때만** 통과하고, 아니면 `unloaded font "…"` 로 던진다
   * (fonts.ts 머리말의 실제 로그가 이 경우다). 즉 어댑터는 노드를 만들 때 이미
   * '이 레이어는 몇 굵기인가'를 알아야 하는데, 예전에는 그 값이 순수 계층에서 어댑터로
   * **전달되는 통로 자체가 없었다** — 그래서 108개 타이포 레이어 전부가 실행 폰트 하나
   * (Inter Regular)로 태어났고, 그중 84개는 토큰이 500 이상을 말하는데도 Regular 로 보였다.
   * 줄 높이(lineHeightPercent)를 해석값으로 넘기는 것과 같은 이유·같은 방식이다.
   */
  fontWeight?: number;
  /** 토큰이 없는 순수 레이아웃 간격 — 8pt 그리드 상수 (바인딩 대상 아님) */
  itemSpacing?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  /** 테두리를 그리려면 두께가 먼저 필요하다 — 토큰이 없으면 헤어라인 */
  strokeWeight?: number;
  bindings: VarBinding[];
  unbound: UnboundField[];
  propRefs?: PropRefs;
  children: NodeSpec[];
}

/** 8pt 그리드 — 토큰이 없는 자리에만 쓰는 레이아웃 상수 */
export const GRID = 8;
/** 기본 자식 간격 */
const DEFAULT_GAP = GRID;
/** 기본 패딩 */
const DEFAULT_PAD = GRID;
/** 헤어라인 */
const HAIRLINE = 1;

export interface BuildContext {
  /** 계약 tokens 블록 (키 → 점 경로) */
  tokens: Readonly<Record<string, string>>;
  /** 이 변형에서 활성인 변형 값들 (예: ['primary','md']) — 변형별 토큰 선택에 쓴다 */
  activeValues: readonly string[];
  /** 파일에 실존하는 Variable 이름 집합 */
  varNames: ReadonlySet<string>;
  /**
   * Variable 이름 → 해석된 값. 바인딩할 수 없는 축을 **리터럴로라도 적용**하는 데 쓴다.
   * (예: line-height 토큰은 배수 1.5 인데 Figma 바인딩은 px 로 해석하므로 걸 수 없다.
   *  값을 알면 PERCENT 150% 로 그대로 적용할 수 있다 — 포기할 이유가 없었다.)
   */
  tokenValues?: ReadonlyMap<string, string | number | boolean>;
  /** 계약 prop 이름 → Figma 속성 이름 (예: children → Children) */
  figmaPropertyOf: Readonly<Record<string, string>>;
  /** 이 변형에서 활성인 prop 값 맵 (when 조건 · 변형별 토큰 조회용) — 예: { tone: 'danger' } */
  propValues: Readonly<Record<string, string>>;
  /** 계약 variantTokens 블록 — prop → 값 → 토큰 키 → 경로. flat tokens 보다 우선한다 */
  variantTokens?: VariantTokens;
  /**
   * 지금 그리고 있는 반복(repeat)의 회차. samples 배열에서 이 회차의 표본을 고른다.
   * 반복 밖에서는 0 이다.
   */
  repeatIndex?: number;
  /**
   * codegen 이 실제 구현에서 추출해 둔 자산 표 — prop 이름 → prop 값 → SVG 마크업.
   * anatomy 의 svgFrom 이 이 표를 가리킨다. 플러그인은 표를 읽기만 하고 모양을 지어내지 않는다.
   */
  assets?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * anatomy 의 when 조건을 판정한다. 조건이 없으면 항상 그린다.
 * 조건 prop 이 이 컴포넌트의 변형축이 아니면(값을 모르면) **그린다** — 문서에서 빠지는 것보다
 * 보이는 편이 낫고, 조건은 변형축에만 의미가 있기 때문이다.
 */
export function shouldRender(
  node: AnatomyNode,
  propValues: Readonly<Record<string, string>>,
): boolean {
  if (!node.when) return true;
  const current = propValues[node.when.prop];
  if (current === undefined) return true;
  return node.when.equals.indexOf(current) >= 0;
}

/** 숫자 토큰(FLOAT) 바인딩 필드 — Figma 가 Variable 바인딩을 지원하는 것만 나열한다 */
const FLOAT_FIELDS = {
  radius: ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'],
  padX: ['paddingLeft', 'paddingRight'],
  padY: ['paddingTop', 'paddingBottom'],
  pad: ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'],
  gap: ['itemSpacing'],
  strokeWidth: ['strokeWeight'],
  size: ['width', 'height'],
  minHeight: ['minHeight'],
  width: ['width'],
} as const;

/**
 * 모서리 반경은 **모서리가 있는 노드**에만 있다. 타원·선·텍스트에 topLeftRadius 를 바인딩하면
 * Figma 가 그 자리에서 거부한다("Cannot bind variable to field ... on node type ELLIPSE").
 *
 * 예전에는 이 요청이 그대로 나갔다가 어댑터의 catch 에 삼켜져 로그 한 줄로 사라졌다 —
 * 계약이 원 모양 부위(예: 범례 점)에 radius:full 을 적는 것은 자연스러운 표현이고,
 * 원은 이미 완전히 둥그니 **요청 자체를 만들지 않는 것**이 옳다.
 */
function hasCorners(kind: AnatomyKind): boolean {
  return kind === 'frame' || kind === 'instance';
}

/**
 * anatomy 노드 하나를 NodeSpec 으로 옮긴다. 토큰이 걸린 모든 속성에 대해 **바인딩을 요청**하고,
 * Figma 가 바인딩할 수 없는 축(lineHeight·fontFamily)은 unbound 로 남긴다.
 */
export function buildNodeSpec(node: AnatomyNode, ctx: BuildContext): NodeSpec {
  const styles = node.styles ?? {};
  const bindings: VarBinding[] = [];
  const unbound: UnboundField[] = [];
  /** 해석값으로 적용할 줄 높이(%) — spec 생성 뒤에 옮긴다 */
  let lineHeightPercent: number | undefined;
  /** 해석값으로 넘길 글자 굵기 — 어댑터가 이 값으로 **로드된 폰트 스타일**을 고른다 */
  let fontWeight: number | undefined;

  const resolve = (key: string): ReturnType<typeof resolveStyleToken> =>
    resolveStyleToken(
      ctx.tokens,
      key,
      ctx.activeValues,
      ctx.varNames,
      ctx.variantTokens,
      ctx.propValues,
    );

  // --- 색 (fills / strokes) ---
  const fill = styles.fill === undefined ? null : resolve(styles.fill);
  if (fill) bindings.push({ field: 'fills', variable: fill.variable, tokenKey: fill.tokenKey });
  // color 는 **텍스트 노드의 글자색**이다. 프레임에 걸면 배경이 글자색으로 칠해져 버리므로
  // (파생 anatomy 가 부위 스타일을 통째로 물려줄 때 실제로 그런 사고가 난다) 텍스트에만 적용한다.
  const color = styles.color === undefined || node.kind !== 'text' ? null : resolve(styles.color);
  if (color) bindings.push({ field: 'fills', variable: color.variable, tokenKey: color.tokenKey });
  const stroke = styles.stroke === undefined ? null : resolve(styles.stroke);
  if (stroke) {
    bindings.push({ field: 'strokes', variable: stroke.variable, tokenKey: stroke.tokenKey });
  }

  // --- 숫자 축 ---
  for (const [styleKey, fields] of Object.entries(FLOAT_FIELDS)) {
    const tokenKey = styles[styleKey as keyof typeof FLOAT_FIELDS];
    if (tokenKey === undefined) continue;
    // padX/padY 가 있으면 pad 는 무시한다 (겹쳐 걸면 마지막 바인딩이 이긴다)
    if (styleKey === 'pad' && (styles.padX !== undefined || styles.padY !== undefined)) continue;
    // 모서리가 없는 노드(타원·선·텍스트)에는 radius 바인딩을 걸 수 없다 — Figma 가 거부한다
    if (styleKey === 'radius' && !hasCorners(node.kind)) continue;
    // [실제 API 규칙] strokeWeight 는 **획이 실제로 있을 때만** 바인딩된다.
    // 테두리 색이 없으면 그릴 획이 없으므로 두께만 걸어 봐야 Figma 가 받지 않는다
    // (실제 실행에서 Pagination·RowActions 의 strokeWeight 가 이 경우로 남았다).
    // 계약이 테두리 색 없이 두께만 선언한 것이므로 unbound 로 보고해 계약 쪽에서 드러나게 한다.
    if (styleKey === 'strokeWidth' && stroke === null) {
      const resolvedWidth = resolve(tokenKey);
      if (resolvedWidth) {
        unbound.push({
          field: 'strokeWeight',
          tokenKey: resolvedWidth.tokenKey,
          variable: resolvedWidth.variable,
          reason:
            '테두리 색(stroke)이 없어 그릴 획이 없다 — Figma 는 획 없는 노드의 strokeWeight 바인딩을 받지 않는다. 계약에 stroke 를 선언하거나 strokeWidth 를 빼야 한다',
        });
      }
      continue;
    }
    const resolved = resolve(tokenKey);
    if (!resolved) continue;
    for (const field of fields) {
      bindings.push({ field, variable: resolved.variable, tokenKey: resolved.tokenKey });
    }
  }

  // --- 글자 크기 단독 지정 (dimension 토큰) — 텍스트 노드 전용 ---
  if (styles.fontSize !== undefined && node.kind === 'text') {
    const resolved = resolve(styles.fontSize);
    if (resolved) {
      bindings.push({
        field: 'fontSize',
        variable: resolved.variable,
        tokenKey: resolved.tokenKey,
      });
    }
  }

  // --- 타이포 (합성 토큰 → 서브 Variable 전개). fontSize/fontWeight 는 텍스트 노드 전용 필드다 ---
  if (styles.typography !== undefined && node.kind === 'text') {
    const resolved = resolve(styles.typography);
    if (resolved) {
      const typo = typographyVars(resolved.variable, ctx.varNames);
      // styles.fontSize 가 있으면 그쪽이 정본이다 — 합성 토큰의 font-size 는 양보한다.
      // 크기 축이 font-size 만 바꾸고 weight/line-height 는 유지하는 경우(Button sm·md·lg)를
      // 합성 typography 토큰 교체 없이 표현하기 위한 규칙이다.
      if (typo.fontSize !== undefined && styles.fontSize === undefined) {
        bindings.push({ field: 'fontSize', variable: typo.fontSize, tokenKey: resolved.tokenKey });
      }
      if (typo.fontWeight !== undefined) {
        bindings.push({
          field: 'fontWeight',
          variable: typo.fontWeight,
          tokenKey: resolved.tokenKey,
        });
        // 바인딩만으로는 굵기가 화면에 나타나지 않는다 — 굵기는 fontName.style 이 정하고,
        // 그 스타일이 로드돼 있지 않으면 바인딩 자체가 던진다. 해석값을 함께 넘겨
        // 어댑터가 노드를 만들 때 맞는 스타일을 고르게 한다(§NodeSpec.fontWeight).
        const rawWeight = ctx.tokenValues?.get(typo.fontWeight);
        if (typeof rawWeight === 'number' && Number.isFinite(rawWeight) && rawWeight > 0) {
          fontWeight = rawWeight;
        }
      }
      if (typo.lineHeight !== undefined) {
        // 값을 알면 PERCENT 로 적용한다 — 배수 1.5 → 150%.
        const raw = ctx.tokenValues?.get(typo.lineHeight);
        const multiplier = typeof raw === 'number' ? raw : Number.NaN;
        // 배수(1.2~2)만 퍼센트로 환산한다. 이미 px 로 적힌 값은 배수가 아니므로 건드리지 않는다
        if (Number.isFinite(multiplier) && multiplier > 0 && multiplier <= 4) {
          lineHeightPercent = Math.round(multiplier * 100);
        }
      }
      if (typo.lineHeight !== undefined && lineHeightPercent === undefined) {
        // 필드 자체는 바인딩 가능하지만(VariableBindableTextField) **단위가 어긋난다**:
        // 토큰의 line-height 는 배수(1.25)인데 Figma 는 바인딩 값을 px 로 해석한다.
        // 배수를 그대로 걸면 1.25px 이 되므로 바인딩하지 않고 PERCENT 로 해석값을 적용한다.
        unbound.push({
          field: 'lineHeight',
          tokenKey: resolved.tokenKey,
          variable: typo.lineHeight,
          reason: 'line-height 토큰은 배수(1.25)인데 Figma 바인딩은 px 로 해석 — 단위 불일치',
        });
      }
      if (typo.fontFamily !== undefined) {
        // fontFamily 도 바인딩 가능 필드지만 토큰 값이 CSS 폰트 스택
        // ('Pretendard, system-ui, sans-serif')이라 Figma 가 요구하는 단일 패밀리명이 아니다.
        unbound.push({
          field: 'fontFamily',
          tokenKey: resolved.tokenKey,
          variable: typo.fontFamily,
          reason:
            '토큰 값이 CSS 폰트 스택이라 Figma 의 단일 패밀리명 규격과 불일치 — 폰트 로드로 대체',
        });
      }
    }
  }

  // --- 기하 기본값 (토큰이 없는 자리에만) ---
  const layout: AnatomyLayout =
    node.layout ?? (node.children && node.children.length > 0 ? 'HORIZONTAL' : 'NONE');
  const spec: NodeSpec = {
    kind: node.kind,
    name: node.name,
    layout,
    bindings,
    unbound,
    children: [],
  };
  if (lineHeightPercent !== undefined && node.kind === 'text') {
    spec.lineHeightPercent = lineHeightPercent;
  }
  if (fontWeight !== undefined && node.kind === 'text') spec.fontWeight = fontWeight;
  if (node.justify !== undefined) spec.justify = node.justify;
  if (node.align !== undefined) spec.align = node.align;
  else if (layout === 'HORIZONTAL') spec.align = 'CENTER';
  // wrap 은 Figma 에서 layoutMode==='HORIZONTAL' 일 때만 유효하다(VERTICAL 에 걸면 던진다).
  // 판정을 **순수 계층에서** 끝내 두면 vitest 가 검사할 수 있고, 어댑터는 받은 값을 믿기만 하면 된다.
  if (node.wrap === true && layout === 'HORIZONTAL') spec.wrap = true;
  if (node.grow === true) spec.grow = true;
  if (node.fixedWidth !== undefined) spec.width = node.fixedWidth;
  if (node.fixedHeight !== undefined) spec.height = node.fixedHeight;

  if (node.kind === 'text') {
    // 반복 회차마다 다른 표본을 고른다 — 하나뿐이면 N개가 전부 같은 글자로 나온다
    const index = ctx.repeatIndex ?? 0;
    const sample =
      node.samples !== undefined && node.samples.length > 0
        ? node.samples[index % node.samples.length]
        : undefined;
    spec.characters = sample ?? node.text ?? node.name;
  }

  // --- 벡터 모양 선택 — 이 변형의 prop 값으로 자산 표에서 고른다 ---
  // 고정 아이콘 — codegen 이 채워 둔 SVG 를 그대로 쓴다
  if (node.kind === 'vector' && node.svg !== undefined) {
    spec.svg = node.svg;
  }
  if (node.kind === 'vector' && node.svgFrom !== undefined) {
    const table = ctx.assets?.[node.svgFrom];
    const value = ctx.propValues[node.svgFrom];
    const svg = table !== undefined && value !== undefined ? table[value] : undefined;
    if (svg !== undefined) spec.svg = svg;
  }

  const bound = new Set(bindings.map((b) => b.field));
  if (layout !== 'NONE' && !bound.has('itemSpacing')) spec.itemSpacing = DEFAULT_GAP;
  if (
    layout !== 'NONE' &&
    node.kind === 'frame' &&
    !bound.has('paddingLeft') &&
    !bound.has('paddingTop')
  ) {
    // 토큰이 패딩을 말하지 않는 컨테이너는 **패딩 0** 이 옳다 — 임의 여백은 정렬을 깬다.
    // 배경/테두리가 있는 부위만 최소 여백을 준다(내용이 테두리에 붙지 않게).
    const hasSkin = bound.has('fills') || bound.has('strokes');
    const pad = hasSkin ? DEFAULT_PAD : 0;
    spec.padding = { top: pad, right: pad, bottom: pad, left: pad };
  }
  if (bound.has('strokes') && !bound.has('strokeWeight')) spec.strokeWeight = HAIRLINE;

  // --- 컴포넌트 속성 참조 ---
  const refs: PropRefs = {};
  if (node.textProp !== undefined) {
    const figmaName = ctx.figmaPropertyOf[node.textProp];
    if (figmaName !== undefined) refs.characters = figmaName;
  }
  if (node.visibleProp !== undefined) {
    const figmaName = ctx.figmaPropertyOf[node.visibleProp];
    if (figmaName !== undefined) refs.visible = figmaName;
  }
  if (node.slotProp !== undefined) {
    const figmaName = ctx.figmaPropertyOf[node.slotProp];
    if (figmaName !== undefined) refs.mainComponent = figmaName;
  }
  if (
    refs.characters !== undefined ||
    refs.visible !== undefined ||
    refs.mainComponent !== undefined
  ) {
    spec.propRefs = refs;
  }

  // --- 자식 (repeat 전개 + when 필터) ---
  for (const child of node.children ?? []) {
    if (!shouldRender(child, ctx.propValues)) continue;
    const times = child.repeat ?? 1;
    for (let i = 0; i < times; i += 1) {
      // 회차를 자식 트리 전체에 물려준다 — 반복되는 것은 부위 하나가 아니라 그 아래 전부다
      // (예: ListCard 의 Row 가 반복되면 Row 안의 제목·부제가 회차마다 달라야 한다)
      const built = buildNodeSpec(child, times > 1 ? { ...ctx, repeatIndex: i } : ctx);
      if (times > 1) {
        built.name = `${child.name} ${String(i + 1)}`;
        if (child.uniformRepeat === true) built.uniformRepeat = true;
      }
      spec.children.push(built);
    }
  }

  // --- 채움 사슬 ---
  // 자식이 주축을 채우겠다고 선언했으면 이 노드는 그 축을 고정해야 한다(hug 이면 모순).
  // 그리고 고정된 폭은 어딘가에서 와야 하므로, 명시 치수가 없으면 이 노드도 **자기 부모를 채운다**.
  // 그렇게 사슬이 위로 이어져 실제 폭을 가진 조상에서 끝난다.
  if (spec.children.some((child) => child.grow === true) && layout !== 'NONE') {
    spec.primaryAxisFixed = true;
    if (spec.width === undefined && spec.grow !== true) spec.grow = true;
  }

  return spec;
}

/** 트리를 전위 순회하며 모든 노드를 훑는다 (테스트·집계용) */
export function walkNodeSpec(
  spec: NodeSpec,
  visit: (node: NodeSpec, depth: number) => void,
  depth = 0,
): void {
  visit(spec, depth);
  for (const child of spec.children) walkNodeSpec(child, visit, depth + 1);
}

/** 트리 전체의 바인딩을 모은다 */
export function collectBindings(spec: NodeSpec): VarBinding[] {
  const out: VarBinding[] = [];
  walkNodeSpec(spec, (node) => out.push(...node.bindings));
  return out;
}

/** 트리 전체의 미바인딩 항목을 모은다 — 리포트의 '바인딩 불가' 목록 원천 */
export function collectUnbound(spec: NodeSpec): UnboundField[] {
  const out: UnboundField[] = [];
  walkNodeSpec(spec, (node) => out.push(...node.unbound));
  return out;
}
