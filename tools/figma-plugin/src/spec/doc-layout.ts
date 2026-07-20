/**
 * 컴포넌트 문서 카드 레이아웃 계획 — **순수 계층**. Figma API 를 참조하지 않는다.
 *
 * 참조 디자인의 구조를 그대로 계약에서 파생한다(컴포넌트별 하드코딩 목록 금지):
 *   ① 페이지 헤더(카테고리명 + 한 줄 설명)
 *   ② 컴포넌트마다 큰 테두리 카드 — 제목/한 줄 설명/상태 칩 + prop 섹션 스택
 *   ③ preview — 여러 배경 표면 위의 컴포넌트(투명 체커보드 포함)
 *   ④ 인터랙션 매트릭스 — Interaction / Active / Focus / Active+Focus 열
 *   ⑤ Resource — 원재료(부위) 패널
 *
 * prop 섹션은 계약 properties 선언 순서를 그대로 따른다 — 순서가 곧 문서의 읽는 순서다.
 */
import type { AnatomyNode } from './anatomy';
import { normalizeAnatomy } from './anatomy';
import type { ComponentFigmaSpec, ComponentSetSpec, FigmaPropSpec } from './component-spec';
import { deriveAnatomy } from './component-spec';

// ---------------------------------------------------------------------------
// 계획 타입
// ---------------------------------------------------------------------------

/** 카드 제목 옆 상태/레벨 칩. positive = 초록 계열, neutral = 회색 계열 */
export interface ChipPlan {
  label: string;
  tone: 'positive' | 'neutral';
}

/**
 * 이 칸을 그릴 때 인스턴스에 걸 **컴포넌트 속성 덮어쓰기**.
 * 변형이 아니라 속성이 그림을 가르는 prop(BOOLEAN)에서 칸마다 값이 갈리게 하는 통로다.
 */
export interface PropOverridePlan {
  /** Figma 속성 이름 (예: 'Checked') — 렌더러가 접미(`Checked#12:3`)를 붙여 찾는다 */
  name: string;
  value: boolean;
}

/** prop 섹션 안의 칸 하나 — 그 값으로 렌더된 컴포넌트 + 캡션 */
export interface PropValueCellPlan {
  /** 계약이 선언한 값 그대로 (칩·캡션에 그대로 쓴다 — 번역하지 않는다) */
  value: string;
  caption: string;
  /**
   * 이 칸이 가리키는 실제 Figma 변형 이름. 변형축이 아닌 prop(BOOLEAN·TEXT·슬롯)은 null —
   * 렌더러가 기본 변형을 쓰고 **아래 propertyOverride 로 그림을 가른다.**
   */
  variantName: string | null;
  /**
   * 기본 변형 위에 얹을 속성 덮어쓰기. 이것이 없으면 그 prop 의 모든 칸이 **같은 그림**이 된다 —
   * Checkbox 의 checked:false 와 checked:true 가 픽셀까지 같은 파란 체크박스로 나온 결함이
   * 정확히 그것이었다(plugin-build-rules §11).
   * TEXT·INSTANCE_SWAP 은 켜고 끌 BOOLEAN 이 따로 있어야 표현되므로 여기서는 undefined 다.
   */
  propertyOverride?: PropOverridePlan;
}

/** prop 하나 = 섹션 하나 */
export interface PropSectionPlan {
  /** 계약 prop 이름 — 섹션 헤더의 굵은 글자 */
  prop: string;
  /** Figma 속성 이름 */
  figmaName: string;
  /** 한 줄 설명 (codegen 이 계약 summary/description 에서 뽑아 둔 것) */
  summary: string;
  /** 헤더에 붙는 값 칩들 */
  valueChips: string[];
  cells: PropValueCellPlan[];
}

/** preview 섹션의 배경 표면 하나 */
export interface PreviewSurfacePlan {
  label: string;
  /** transparent = 체커보드(실제 도형으로 그린다), token = Variable 바인딩 배경 */
  kind: 'transparent' | 'token';
  /** kind='token' 일 때의 Figma Variable 이름 */
  variable?: string;
}

/** 인터랙션 매트릭스 한 칸 */
export interface InteractionCellPlan {
  /** 이 칸이 나타내는 조건 — 'hover + focus' 처럼 조합을 적는다 */
  label: string;
}

export interface InteractionRowPlan {
  /** 계약 states 의 값 하나 */
  state: string;
  cells: InteractionCellPlan[];
}

export interface InteractionMatrixPlan {
  /** 머리행 — 첫 칸이 라벨 열이다 */
  columns: string[];
  rows: InteractionRowPlan[];
}

/** Resource 패널 하나 — 컴포넌트를 이루는 원재료(anatomy 의 직속 부위) */
export interface ResourcePanelPlan {
  name: string;
  /** anatomy 루트 children 에서의 인덱스 — 렌더러가 그 부위만 따로 그릴 때 쓴다 */
  index: number;
}

export interface ComponentCardPlan {
  name: string;
  version: string;
  summary: string;
  chips: ChipPlan[];
  sections: PropSectionPlan[];
  preview: { surfaces: PreviewSurfacePlan[] };
  interactions: InteractionMatrixPlan;
  resources: ResourcePanelPlan[];
}

export interface ComponentPagePlan {
  /** 페이지 제목 = 카테고리명 */
  title: string;
  /** 제목 밑 한 줄 설명 */
  summary: string;
  cards: ComponentCardPlan[];
}

// ---------------------------------------------------------------------------
// 상수 — 참조 디자인의 고정 문구/축
// ---------------------------------------------------------------------------

/** 인터랙션 매트릭스의 열 — 참조 디자인 고정 */
export const INTERACTION_COLUMNS = ['Interaction', 'Active', 'Focus', 'Active+Focus'] as const;

/**
 * 매트릭스의 **열로 승격된** 상태 — 행에서는 제외한다(같은 축이 두 번 나오면 표가 깨진다).
 * 계약 states 어휘와 1:1 (focus-visible 이 계약 표기다).
 */
const COLUMN_STATES = new Set(['active', 'focus-visible']);

/** preview 배경 표면 — 대비를 판단할 수 있게 투명/기본/융기 세 가지를 준다 */
const PREVIEW_SURFACES: PreviewSurfacePlan[] = [
  { label: '투명', kind: 'transparent' },
  { label: '기본 표면', kind: 'token', variable: 'color/surface/default' },
  { label: '융기 표면', kind: 'token', variable: 'color/surface/raised' },
];

/** 값이 없는 prop(텍스트·슬롯)을 '없음/있음' 두 칸으로 문서화한다 */
const PRESENCE_VALUES = ['없음', '있음'];

// ---------------------------------------------------------------------------
// 계획 수립
// ---------------------------------------------------------------------------

/** 이 prop 이 어떤 값들로 문서화되는가 */
export function documentedValues(prop: FigmaPropSpec): string[] {
  switch (prop.type) {
    case 'VARIANT':
      return [...new Set(prop.values ?? [])];
    case 'BOOLEAN':
      return ['false', 'true'];
    case 'TEXT':
    case 'INSTANCE_SWAP':
      return [...PRESENCE_VALUES];
  }
}

/**
 * 변형축 prop 의 값 하나에 대응하는 실제 Figma 변형 이름을 만든다.
 * 나머지 축은 기본값으로 고정한다 — 한 축만 바뀌는 비교표가 되어야 읽힌다.
 */
function variantNameFor(set: ComponentSetSpec, axisName: string, value: string): string | null {
  if (set.axes.length === 0) return null;
  if (!set.axes.some((axis) => axis.name === axisName)) return null;
  return set.axes
    .map((axis) => `${axis.name}=${axis.name === axisName ? value : axis.default}`)
    .join(', ');
}

/** 상태 조합 라벨 — 'hover', 'hover + active' … */
function stateLabel(state: string, extras: readonly string[]): string {
  return [state, ...extras].join(' + ');
}

/** 계약 states 에서 매트릭스 행을 만든다 (열로 쓰인 상태는 제외) */
export function planInteractionMatrix(states: readonly string[]): InteractionMatrixPlan {
  const rows: InteractionRowPlan[] = [];
  for (const state of states) {
    if (COLUMN_STATES.has(state)) continue;
    rows.push({
      state,
      cells: [
        { label: stateLabel(state, []) },
        { label: stateLabel(state, ['active']) },
        { label: stateLabel(state, ['focus-visible']) },
        { label: stateLabel(state, ['active', 'focus-visible']) },
      ],
    });
  }
  return { columns: [...INTERACTION_COLUMNS], rows };
}

/** 상태/레벨 칩 — stable 만 초록, 나머지는 회색 */
export function planChips(spec: ComponentFigmaSpec): ChipPlan[] {
  const chips: ChipPlan[] = [];
  const status = typeof spec.status === 'string' ? spec.status : '';
  if (status.length > 0)
    chips.push({ label: status, tone: status === 'stable' ? 'positive' : 'neutral' });
  if (typeof spec.level === 'string' && spec.level.length > 0) {
    chips.push({ label: spec.level, tone: 'neutral' });
  }
  if (typeof spec.category === 'string' && spec.category.length > 0) {
    chips.push({ label: spec.category, tone: 'neutral' });
  }
  return chips;
}

/** anatomy 의 직속 부위 = 이 컴포넌트의 원재료. Resource 패널의 원천이다. */
export function planResources(spec: ComponentFigmaSpec): ResourcePanelPlan[] {
  const anatomy: AnatomyNode = normalizeAnatomy(spec.anatomy) ?? deriveAnatomy(spec);
  return (anatomy.children ?? []).map((child, index) => ({ name: child.name, index }));
}

/** 컴포넌트 하나의 카드 계획 */
export function planComponentCard(
  spec: ComponentFigmaSpec,
  set: ComponentSetSpec,
): ComponentCardPlan {
  // 섹션 순서 = 계약 properties 선언 순서. 손으로 유지하는 목록을 두지 않는다.
  const sections: PropSectionPlan[] = [];
  for (const prop of spec.properties ?? []) {
    const values = documentedValues(prop);
    if (values.length === 0) continue;
    sections.push({
      prop: prop.prop ?? prop.name,
      figmaName: prop.name,
      summary: typeof prop.summary === 'string' ? prop.summary : '',
      valueChips: values,
      cells: values.map((value) => ({
        value,
        caption: value,
        variantName: prop.type === 'VARIANT' ? variantNameFor(set, prop.name, value) : null,
        // BOOLEAN 은 변형이 아니라 속성이 그림을 가른다 — 칸마다 그 값을 실어 보낸다
        ...(prop.type === 'BOOLEAN'
          ? { propertyOverride: { name: prop.name, value: value === 'true' } }
          : {}),
      })),
    });
  }

  return {
    name: spec.name,
    version: typeof spec.version === 'string' ? spec.version : '-',
    summary: typeof spec.summary === 'string' ? spec.summary : '',
    chips: planChips(spec),
    sections,
    preview: { surfaces: [...PREVIEW_SURFACES] },
    interactions: planInteractionMatrix(Array.isArray(spec.states) ? spec.states : []),
    resources: planResources(spec),
  };
}

/** 카테고리 페이지 한 장의 계획 */
export function planComponentPage(
  category: string,
  summary: string,
  entries: ReadonlyArray<{ spec: ComponentFigmaSpec; set: ComponentSetSpec }>,
): ComponentPagePlan {
  return {
    title: category,
    summary,
    cards: entries.map((entry) => planComponentCard(entry.spec, entry.set)),
  };
}
