/**
 * 컴포넌트 해부(anatomy) 모델 — **순수 계층**. Figma API 를 일절 참조하지 않는다.
 *
 * anatomy 는 "이 컴포넌트가 어떤 부위로 이루어져 있는가"를 계약이 직접 선언하는 블록이다
 * (contracts/schemas/component.v1.json 의 anatomy). 계약이 선언하지 않으면 deriveAnatomy 가
 * tokens 키 이름에서 부위를 역산한다 — 어느 쪽이든 **컴포넌트별 분기 코드는 없다**.
 *
 * styles.* 의 값은 토큰 **경로가 아니라 계약 tokens 블록의 키**다. 실제 Variable 이름 해석은
 * tokens.ts 의 resolveStyleToken 이 변형(variant) 값을 곁들여 수행한다.
 */

/** 오토레이아웃 방향 — NONE 은 고정 크기 도형(스와치·트랙 등) */
export type AnatomyLayout = 'NONE' | 'HORIZONTAL' | 'VERTICAL';

/** 주축 정렬 */
export type AnatomyJustify = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

/** 교차축 정렬 */
export type AnatomyAlign = 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';

/**
 * 그릴 수 있는 부위의 종류 — 전부 실제 Figma 노드로 1:1 대응된다.
 * instance 는 INSTANCE_SWAP 속성이 붙을 자리다 (Figma 는 그 속성을 InstanceNode 에만 허용한다).
 */
export type AnatomyKind = 'frame' | 'text' | 'ellipse' | 'line' | 'instance' | 'vector';

/**
 * 부위 하나의 스타일 — 값은 전부 **계약 tokens 블록의 키**다.
 * 여기 적힌 키는 전부 Variable 바인딩 대상이며, 바인딩 불가 항목은 NodeSpec.unbound 로 보고된다.
 */
export interface AnatomyStyles {
  /** 배경색 — fills */
  fill?: string;
  /** 테두리색 — strokes */
  stroke?: string;
  /** 테두리 두께 — strokeWeight */
  strokeWidth?: string;
  /** 모서리 — cornerRadius (4코너) */
  radius?: string;
  /** 좌우 패딩 */
  padX?: string;
  /** 상하 패딩 */
  padY?: string;
  /** 4방 패딩 (padX/padY 가 우선) */
  pad?: string;
  /** 자식 간격 — itemSpacing */
  gap?: string;
  /** 글자색 — text 노드의 fills */
  color?: string;
  /** 합성 타이포 토큰 키 — fontSize/fontWeight 서브 Variable 로 전개된다 */
  typography?: string;
  /**
   * 글자 크기만 따로 지정하는 dimension 토큰 키. typography 합성 토큰의 font-size 보다 우선한다 —
   * 크기 축이 font-size 만 바꾸고 weight/line-height 는 유지하는 경우(Button)를 표현한다.
   */
  fontSize?: string;
  /** 정사각 크기 — width + height 동시 지정 (아이콘·컨트롤) */
  size?: string;
  /** 최소 높이 */
  minHeight?: string;
  /** 고정 폭 */
  width?: string;
}

/** 부위 하나 — 자식을 갖는 재귀 트리 */
export interface AnatomyNode {
  kind: AnatomyKind;
  /** 레이어 이름. Figma 에서 디자이너가 보는 이름이므로 의미 있는 영문 단수형으로 쓴다 */
  name: string;
  layout?: AnatomyLayout;
  justify?: AnatomyJustify;
  align?: AnatomyAlign;
  /** 가로 WRAP 여부 */
  wrap?: boolean;
  /** kind='text' 의 표본 문구. 없으면 name 을 쓴다 */
  text?: string;
  /**
   * 반복(repeat) 안에서 **회차마다 다른** 표본 문구.
   *
   * 왜 필요한가: repeat 은 같은 부위를 N번 그리는데, 표본이 하나뿐이면 N개가 전부 같은 글자로
   * 나온다 — 실제 Figma 에서 RichTextField 툴바가 'B' 여덟 개로, 탭이 '대시보드' 네 개로,
   * 페이지 번호가 '1' 다섯 개로 보인 원인이다. 아이콘 59종이 전부 같은 글리프였던 것과
   * 같은 부류의 결함이며, 디자이너에게는 '만들다 만 것'으로 읽힌다.
   * 회차 수보다 짧으면 순환한다. 없으면 text 를 그대로 쓴다.
   */
  samples?: string[];
  /**
   * 이 텍스트를 공급하는 계약 prop 이름(node/string). 지정하면 Figma TEXT 컴포넌트 속성이
   * 이 레이어의 characters 에 연결된다 — '어느 레이어도 사용하지 않음' 경고가 사라진다.
   */
  textProp?: string;
  /** 이 자리를 채우는 계약 slot prop 이름. INSTANCE_SWAP 속성이 연결된다 */
  slotProp?: string;
  /**
   * kind='vector' 전용 — **고정 아이콘 이름**(예: 'close'). codegen 이 이 이름의 실제 SVG 를
   * 아래 svg 필드에 채워 준다. 기호를 텍스트로 넣으면 런타임 폰트 폴백이 생기므로 도형으로 그린다.
   */
  svgIcon?: string;
  /** codegen 이 채우는 실제 SVG 마크업 — 계약이 직접 적지 않는다 */
  svg?: string;
  /**
   * kind='vector' 전용 — 이 부위의 모양을 고르는 계약 prop 이름(예: 'name').
   * 변형마다 그 prop 의 현재 값에 해당하는 SVG 로 **진짜 벡터 노드**를 만든다.
   */
  svgFrom?: string;
  /** 이 부위의 표시 여부를 제어하는 계약 boolean prop. BOOLEAN 속성이 visible 에 연결된다 */
  visibleProp?: string;
  /** 고정 폭(px) — 토큰이 없는 순수 레이아웃 치수에만 쓴다 */
  fixedWidth?: number;
  /** 고정 높이(px) — 토큰이 없는 순수 레이아웃 치수에만 쓴다 */
  fixedHeight?: number;
  /** 부모 주축을 채운다 (layoutGrow=1) */
  grow?: boolean;
  /** 이 부위를 N번 반복한다 (표의 행, 리스트 아이템 등). 기본 1 */
  repeat?: number;
  /**
   * 이 반복은 **회차가 전부 같은 것이 옳다**는 선언 (예: 갤러리 타일마다 붙는 동일한 삭제 버튼,
   * 차트의 격자선). 기본값 false — 기본은 '회차마다 달라야 한다' 이고, 같으면 렌더 품질 게이트가
   * 막는다(툴바 버튼 8개가 전부 'B' 로 보이던 결함을 잡기 위한 기본값이다).
   */
  uniformRepeat?: boolean;
  /**
   * 이 부위가 특정 변형에서만 나타날 때의 조건.
   * prop = 계약 prop 이름, equals = 그 prop 이 이 값들 중 하나일 때만 그린다.
   */
  when?: { prop: string; equals: string[] };
  styles?: AnatomyStyles;
  children?: AnatomyNode[];
}

/** 계약이 선언한 anatomy 루트 */
export type Anatomy = AnatomyNode;

// ---------------------------------------------------------------------------
// 방어적 정규화 — 플러그인은 신뢰할 수 없는 JSON 을 받는다
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && isFinite(v) ? v : undefined;
}

const KINDS: readonly AnatomyKind[] = ['frame', 'text', 'ellipse', 'line', 'instance', 'vector'];
const LAYOUTS: readonly AnatomyLayout[] = ['NONE', 'HORIZONTAL', 'VERTICAL'];
const JUSTIFIES: readonly AnatomyJustify[] = ['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'];
const ALIGNS: readonly AnatomyAlign[] = ['MIN', 'CENTER', 'MAX', 'BASELINE'];

const STYLE_KEYS: readonly (keyof AnatomyStyles)[] = [
  'fill',
  'stroke',
  'strokeWidth',
  'radius',
  'padX',
  'padY',
  'pad',
  'gap',
  'color',
  'typography',
  'fontSize',
  'size',
  'minHeight',
  'width',
];

function normalizeStyles(raw: unknown): AnatomyStyles | undefined {
  if (!isRecord(raw)) return undefined;
  const out: AnatomyStyles = {};
  let found = false;
  for (const key of STYLE_KEYS) {
    const value = str(raw[key]);
    if (value !== undefined) {
      out[key] = value;
      found = true;
    }
  }
  return found ? out : undefined;
}

/** 알 수 없는 JSON → AnatomyNode. 형식이 어긋나면 null (호출자가 파생 anatomy 로 폴백) */
export function normalizeAnatomy(raw: unknown, depth = 0): AnatomyNode | null {
  if (!isRecord(raw) || depth > 8) return null;
  const kind = KINDS.find((k) => k === raw['kind']);
  const name = str(raw['name']);
  if (kind === undefined || name === undefined) return null;

  const node: AnatomyNode = { kind, name };
  const layout = LAYOUTS.find((l) => l === raw['layout']);
  if (layout !== undefined) node.layout = layout;
  const justify = JUSTIFIES.find((j) => j === raw['justify']);
  if (justify !== undefined) node.justify = justify;
  const align = ALIGNS.find((a) => a === raw['align']);
  if (align !== undefined) node.align = align;
  if (raw['wrap'] === true) node.wrap = true;
  if (raw['grow'] === true) node.grow = true;

  const text = str(raw['text']);
  if (text !== undefined) node.text = text;
  if (Array.isArray(raw['samples'])) {
    const samples = raw['samples'].filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );
    if (samples.length > 0) node.samples = samples;
  }
  const textProp = str(raw['textProp']);
  if (textProp !== undefined) node.textProp = textProp;
  const slotProp = str(raw['slotProp']);
  if (slotProp !== undefined) node.slotProp = slotProp;
  const svgFrom = str(raw['svgFrom']);
  if (svgFrom !== undefined) node.svgFrom = svgFrom;
  const svgIcon = str(raw['svgIcon']);
  if (svgIcon !== undefined) node.svgIcon = svgIcon;
  const svg = str(raw['svg']);
  if (svg !== undefined) node.svg = svg;
  const visibleProp = str(raw['visibleProp']);
  if (visibleProp !== undefined) node.visibleProp = visibleProp;

  const fixedWidth = num(raw['fixedWidth']);
  if (fixedWidth !== undefined) node.fixedWidth = fixedWidth;
  const fixedHeight = num(raw['fixedHeight']);
  if (fixedHeight !== undefined) node.fixedHeight = fixedHeight;
  const repeat = num(raw['repeat']);
  if (repeat !== undefined && repeat > 1) node.repeat = Math.min(Math.floor(repeat), 12);
  if (raw['uniformRepeat'] === true) node.uniformRepeat = true;

  const when = raw['when'];
  if (isRecord(when)) {
    const prop = str(when['prop']);
    const equals = Array.isArray(when['equals'])
      ? when['equals'].filter((v): v is string => typeof v === 'string')
      : [];
    if (prop !== undefined && equals.length > 0) node.when = { prop, equals };
  }

  const styles = normalizeStyles(raw['styles']);
  if (styles !== undefined) node.styles = styles;

  if (Array.isArray(raw['children'])) {
    const children: AnatomyNode[] = [];
    for (const child of raw['children']) {
      const normalized = normalizeAnatomy(child, depth + 1);
      if (normalized !== null) children.push(normalized);
    }
    if (children.length > 0) node.children = children;
  }

  return node;
}
