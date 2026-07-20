/**
 * Figma Plugin API 의 **엄격한** 인메모리 목(mock).
 *
 * 왜 있는가: 이 플러그인의 순수 계층(src/spec/**)은 199개 테스트가 덮고 있었지만
 * **어댑터(src/render/**)는 단 한 줄도 실행된 적이 없었다.** 폰트 크래시, layoutGrow 미적용,
 * 빈 텍스트 레이어, 변형 미전환 — 런타임 결함이 전부 그 구멍으로 빠져나가 사용자가 손으로 찾았다.
 *
 * 설계 원칙: **관대한 목은 그 구멍을 그대로 재현한다.** 그래서 이 목은 실제 API 가 거부하는 것을
 * 똑같이 거부한다. 특히 아래 실패 동작은 지금 쫓는 결함 부류이므로 반드시 재현한다.
 *
 *   1. 폰트가 로드되지 않은 텍스트 노드를 변경하면 **throw** ("unloaded font")
 *      — characters/fontName/fontSize/textAutoResize/resize 전부 해당.
 *      fontName 대입은 **현재 폰트와 새 폰트가 둘 다** 로드돼 있어야 한다.
 *   2. TEXT 컴포넌트 속성이 걸린 레이어는 characters 를 **속성값이 덮어쓴다**
 *      (빈 기본값 = 빈 레이어. 사용자가 본 '라벨 없는 파란 버튼'이 정확히 이것이다).
 *   3. layoutSizing*='FILL' 은 **오토레이아웃 부모에 붙은 뒤에만** 유효 — 아니면 throw.
 *   4. layoutWrap='WRAP' 은 layoutMode==='HORIZONTAL' 에서만 유효 — 아니면 throw.
 *   5. appendChild 는 자식을 가질 수 있는 노드만 — text/ellipse/line 에 부르면 throw.
 *   6. addComponentProperty 는 이름 중복·잘못된 INSTANCE_SWAP 기본값을 거부한다.
 *   7. componentPropertyReferences 는 소유 컴포넌트에 실존하는 키만, 그리고 노드 종류에
 *      맞는 필드만 받는다(characters 는 TEXT 에만, mainComponent 는 INSTANCE 에만).
 *   8. combineAsVariants 는 'Prop=Value' 형식과 축 일치를 요구한다.
 *   9. setBoundVariable 은 노드 종류가 지원하지 않는 필드를 거부한다.
 *
 * 이 목이 통과시키는 것이 곧 "실제 Figma 가 받아 줄 것"의 근사치다. 목이 증명하지 못하는 것은
 * 시각적 결과(글리프 모양·실제 픽셀)뿐이며, 그것은 라이브 Figma 에서만 확인할 수 있다.
 */

import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { buildComponent } from '../build-component';
import type { LoadedFonts } from '../fonts';
import type { CheckFailure } from '../self-check';

export interface MockFontName {
  family: string;
  style: string;
}

export interface MockPaint {
  type: string;
  color?: { r: number; g: number; b: number };
  boundVariables?: Record<string, { type: 'VARIABLE_ALIAS'; id: string }>;
  visible?: boolean;
}

let idCounter = 0;
const nextId = (): string => {
  idCounter += 1;
  return `${String(idCounter)}:${String(idCounter)}`;
};

export const MIXED: unique symbol = Symbol('figma.mixed');

/** 노드 종류별로 setBoundVariable 이 허용되는 필드 — 실제 API 의 VariableBindable* 목록을 좁게 옮긴 것 */
const COMMON_BINDABLE = ['visible', 'opacity', 'width', 'height', 'minWidth', 'maxWidth'];
const CORNER_BINDABLE = [
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
];
const AUTOLAYOUT_BINDABLE = [
  'itemSpacing',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'counterAxisSpacing',
  'minHeight',
  'maxHeight',
];
const TEXT_BINDABLE = [
  'characters',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'paragraphIndent',
  'paragraphSpacing',
];
const STROKE_BINDABLE = ['strokeWeight'];

function bindableFields(type: string): readonly string[] {
  const out = [...COMMON_BINDABLE, ...STROKE_BINDABLE];
  if (type === 'FRAME' || type === 'COMPONENT' || type === 'INSTANCE' || type === 'COMPONENT_SET') {
    out.push(...CORNER_BINDABLE, ...AUTOLAYOUT_BINDABLE);
  }
  if (type === 'RECTANGLE') out.push(...CORNER_BINDABLE);
  if (type === 'TEXT') out.push(...TEXT_BINDABLE, 'minHeight', 'maxHeight');
  return out;
}

const CHILD_BEARING = new Set([
  'DOCUMENT',
  'FRAME',
  'COMPONENT',
  'COMPONENT_SET',
  'INSTANCE',
  'PAGE',
  'GROUP',
]);

// ---------------------------------------------------------------------------
// 폰트 레지스트리 — 목 전체가 공유한다
// ---------------------------------------------------------------------------

export class FontRegistry {
  private readonly available = new Set<string>();
  private readonly loaded = new Set<string>();

  constructor(available: readonly MockFontName[]) {
    for (const f of available) this.available.add(`${f.family}|${f.style}`);
  }

  async load(font: MockFontName): Promise<void> {
    const key = `${font.family}|${font.style}`;
    if (!this.available.has(key)) {
      throw new Error(`Cannot load font ${font.family} ${font.style}: font not available`);
    }
    this.loaded.add(key);
  }

  isLoaded(font: MockFontName): boolean {
    return this.loaded.has(`${font.family}|${font.style}`);
  }
}

// ---------------------------------------------------------------------------
// 노드
// ---------------------------------------------------------------------------

export class MockNode {
  readonly id = nextId();
  readonly type: string;
  name = '';
  parent: MockNode | null = null;
  readonly children: MockNode[] = [];
  visible = true;
  x = 0;
  y = 0;
  width = 100;
  height = 100;
  removed = false;

  fills: MockPaint[] | typeof MIXED = [];
  strokes: MockPaint[] = [];
  strokeWeight = 0;
  strokeAlign = 'INSIDE';
  cornerRadius: number | typeof MIXED = 0;

  readonly boundVariables: Record<string, { type: 'VARIABLE_ALIAS'; id: string }> = {};

  /** 이 노드가 참조하는 컴포넌트 속성 — Figma 가 characters/visible/mainComponent 를 여기서 덮는다 */
  private propRefs: Record<string, string> | null = null;

  constructor(type: string) {
    this.type = type;
  }

  get componentPropertyReferences(): Record<string, string> | null {
    return this.propRefs;
  }

  set componentPropertyReferences(refs: Record<string, string> | null) {
    if (refs === null) {
      this.propRefs = null;
      return;
    }
    const owner = this.owningComponent();
    for (const [field, key] of Object.entries(refs)) {
      if (field !== 'characters' && field !== 'visible' && field !== 'mainComponent') {
        throw new Error(`Invalid component property reference field: ${field}`);
      }
      if (field === 'characters' && this.type !== 'TEXT') {
        throw new Error(`Property reference 'characters' is only valid on TEXT nodes`);
      }
      if (field === 'mainComponent' && this.type !== 'INSTANCE') {
        throw new Error(`Property reference 'mainComponent' is only valid on INSTANCE nodes`);
      }
      if (owner === null) {
        throw new Error(`Node ${this.name} is not inside a component; cannot reference ${key}`);
      }
      if (!(key in owner.componentPropertyDefinitions)) {
        throw new Error(`Component property ${key} does not exist on ${owner.name}`);
      }
    }
    this.propRefs = { ...refs };
  }

  /** 이 노드를 품은 Component / ComponentSet (속성 정의의 소유자) */
  owningComponent(): MockComponentNode | MockComponentSetNode | null {
    let cur: MockNode | null = this.parent;
    let candidate: MockComponentNode | MockComponentSetNode | null = null;
    while (cur !== null) {
      if (cur instanceof MockComponentSetNode) return cur;
      if (cur instanceof MockComponentNode && candidate === null) candidate = cur;
      cur = cur.parent;
    }
    return candidate;
  }

  appendChild(child: MockNode): void {
    if (!CHILD_BEARING.has(this.type)) {
      throw new Error(`appendChild is not available on node type ${this.type}`);
    }
    if (child === this) throw new Error('Cannot append a node to itself');
    if (child.parent !== null) {
      const idx = child.parent.children.indexOf(child);
      if (idx >= 0) child.parent.children.splice(idx, 1);
    }
    child.parent = this;
    this.children.push(child);
  }

  remove(): void {
    if (this.parent !== null) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent = null;
    }
    this.removed = true;
  }

  resize(w: number, h: number): void {
    // 선은 높이가 항상 0 이다 — line.resize(width, 0) 이 실제 API 의 정식 용법이다.
    // 다른 노드는 0 이하를 거부한다.
    if (this.type === 'LINE') {
      if (w <= 0 || h !== 0) {
        throw new Error('Cannot resize a LINE: width must be positive and height must be 0');
      }
    } else if (w <= 0 || h <= 0) {
      throw new Error('Cannot resize to a non-positive dimension');
    }
    this.width = w;
    this.height = h;
  }

  setBoundVariable(field: string, variable: MockVariable | null): void {
    if (variable === null) {
      delete this.boundVariables[field];
      return;
    }
    if (!bindableFields(this.type).includes(field)) {
      throw new Error(`Cannot bind variable to field '${field}' on node type ${this.type}`);
    }
    // [실제 API 규칙] strokeWeight 는 **획이 실제로 있을 때만** 바인딩된다.
    // 참조 구현이 같은 선행 조건을 건다: `strokeWeight > 0 && strokes && strokes.length`.
    // 획이 없는 노드에 두께를 걸어 봐야 그릴 것이 없으므로 Figma 가 받아 주지 않는다 —
    // 실제 실행에서 strokeWeight 26건이 '바인딩 안 됨' 으로 남은 것이 정확히 이 경우다.
    if (field === 'strokeWeight' && this.strokes.length === 0) {
      throw new Error(
        `Cannot bind 'strokeWeight' on ${this.name}: node has no strokes (paint 먼저 필요)`,
      );
    }
    this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
  }

  /**
   * layoutSizing* / layoutGrow 은 **모든 SceneNode** 가 오토레이아웃 자식으로서 갖는다
   * (AutoLayoutChildrenMixin) — 선·타원도 포함이다. 목이 이걸 프레임/텍스트로만 좁히면
   * 실제로는 동작하는 경로를 실패로 오판한다.
   */
  private sizingH: 'FIXED' | 'HUG' | 'FILL' = 'HUG';
  private sizingV: 'FIXED' | 'HUG' | 'FILL' = 'HUG';
  /** layoutGrow 는 오토레이아웃 자식이 아닐 때 **조용히 무시된다**(실제 API 와 같음) */
  private grow = 0;

  get layoutSizingHorizontal(): 'FIXED' | 'HUG' | 'FILL' {
    return this.sizingH;
  }

  set layoutSizingHorizontal(value: 'FIXED' | 'HUG' | 'FILL') {
    assertSizingAllowed(this, value, 'horizontal');
    this.sizingH = value;
  }

  get layoutSizingVertical(): 'FIXED' | 'HUG' | 'FILL' {
    return this.sizingV;
  }

  set layoutSizingVertical(value: 'FIXED' | 'HUG' | 'FILL') {
    assertSizingAllowed(this, value, 'vertical');
    this.sizingV = value;
  }

  get layoutGrow(): number {
    return this.grow;
  }

  set layoutGrow(value: number) {
    const parent = this.parent;
    const inAutoLayout =
      parent !== null && parent instanceof MockFrameNode && parent.layoutMode !== 'NONE';
    // 부모가 오토레이아웃이 아니면 실제 API 도 값을 받아 두기만 하고 효과가 없다
    this.grow = inAutoLayout ? value : 0;
  }

  /** 플러그인 데이터 — figma.root 와 PageNode 양쪽에서 쓴다 */
  private readonly pluginData = new Map<string, string>();

  setPluginData(key: string, value: string): void {
    this.pluginData.set(key, value);
  }

  getPluginData(key: string): string {
    return this.pluginData.get(key) ?? '';
  }

  /** 지정 위치에 자식을 넣는다 (문서가 페이지 순서를 재배열할 때 쓴다) */
  insertChild(index: number, child: MockNode): void {
    if (!CHILD_BEARING.has(this.type)) {
      throw new Error(`insertChild is not available on node type ${this.type}`);
    }
    if (index < 0 || index > this.children.length) {
      throw new Error(`insertChild: index ${String(index)} out of range`);
    }
    if (child.parent !== null) {
      const at = child.parent.children.indexOf(child);
      if (at >= 0) child.parent.children.splice(at, 1);
    }
    child.parent = this;
    this.children.splice(index, 0, child);
  }

  /** 파선 — 실제 API 는 모든 도형에 있다 */
  dashPattern: readonly number[] = [];

  /**
   * 오토레이아웃 자식의 교차축 정렬. 'STRETCH' 가 곧 **부모 폭 채우기(FILL)** 다 —
   * 고정 폭 사슬은 이 값으로 이어진다(부모의 counter axis 가 FIXED 여야 성립).
   */
  layoutAlign: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT' = 'INHERIT';

  findOne(predicate: (n: MockNode) => boolean): MockNode | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.findOne(predicate);
      if (found !== null) return found;
    }
    return null;
  }

  findAll(predicate: (n: MockNode) => boolean): MockNode[] {
    const out: MockNode[] = [];
    for (const child of this.children) {
      if (predicate(child)) out.push(child);
      out.push(...child.findAll(predicate));
    }
    return out;
  }
}

/** 오토레이아웃을 가질 수 있는 노드 (FRAME/COMPONENT/INSTANCE) */
export class MockFrameNode extends MockNode {
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' = 'NONE';
  primaryAxisSizingMode: 'FIXED' | 'AUTO' = 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO' = 'AUTO';
  primaryAxisAlignItems = 'MIN';
  counterAxisAlignItems = 'MIN';
  clipsContent = true;
  itemSpacing = 0;
  paddingTop = 0;
  paddingRight = 0;
  paddingBottom = 0;
  paddingLeft = 0;
  counterAxisSpacing: number | null = null;

  private wrap: 'NO_WRAP' | 'WRAP' = 'NO_WRAP';

  get layoutWrap(): 'NO_WRAP' | 'WRAP' {
    return this.wrap;
  }

  set layoutWrap(value: 'NO_WRAP' | 'WRAP') {
    if (value === 'WRAP' && this.layoutMode !== 'HORIZONTAL') {
      throw new Error("layoutWrap='WRAP' is only valid on horizontal auto-layout frames");
    }
    this.wrap = value;
  }

  /**
   * **실제 API 규칙**: 오토레이아웃 프레임에 `resize()` 를 부르면 그 프레임은 두 축 모두
   * `FIXED` 가 된다 — 크기를 직접 정했다고 선언한 것이기 때문이다.
   *
   * 예전 목은 `resize` 를 width/height 대입으로만 처리해 사이징 모드를 그대로 두었다.
   * 그래서 `frame.resize(W, frame.height)`(= 폭만 주려는 관용구)가 **높이를 100 에 못박는**
   * 것을 목 위에서는 볼 수 없었고, 문서 페이지의 잘림·겹침이 전부 이 구멍으로 빠져나갔다
   * (plugin-build-rules §10).
   */
  override resize(w: number, h: number): void {
    super.resize(w, h);
    if (this.layoutMode !== 'NONE') {
      this.primaryAxisSizingMode = 'FIXED';
      this.counterAxisSizingMode = 'FIXED';
    }
  }

  /**
   * 자식과 패딩·간격에서 계산한 **내용의 높이**. 실제 Figma 가 hug 프레임의 높이를 정하는 방식이다.
   * 세로 스택은 자식 높이의 합, 가로 스택은 자식 높이의 최댓값(WRAP 은 줄을 접으므로 근사).
   *
   * [목 충실도 한계] 텍스트 줄바꿈을 실제로 계산하지 않으므로 이 값은 **하한**이다 —
   * 실제 Figma 는 이보다 더 클 수 있다. 즉 이 값으로 잡히는 잘림은 전부 진짜지만,
   * 잡히지 않았다고 잘림이 없다는 뜻은 아니다.
   */
  contentHeight(): number {
    const pad = this.paddingTop + this.paddingBottom;
    const kids = this.children.filter((c) => c.visible);
    if (kids.length === 0 || this.layoutMode === 'NONE') return pad;
    const heights = kids.map((c) => (c instanceof MockFrameNode ? c.hugHeight() : c.height));
    if (this.layoutMode === 'VERTICAL') {
      const gaps = this.itemSpacing * (kids.length - 1);
      return pad + gaps + heights.reduce((a, b) => a + b, 0);
    }
    return pad + Math.max(...heights);
  }

  /** 이 프레임이 실제로 차지하는 높이 — 주축이 AUTO 면 내용만큼, FIXED 면 정해진 높이 */
  hugHeight(): number {
    const axisMode =
      this.layoutMode === 'VERTICAL' ? this.primaryAxisSizingMode : this.counterAxisSizingMode;
    if (this.layoutMode === 'NONE' || axisMode === 'FIXED') return this.height;
    return this.contentHeight();
  }
}

/**
 * layoutSizing* 검증 — 실제 API 의 제약을 그대로 옮긴다.
 * 'FILL' 은 오토레이아웃 부모의 **자식일 때만** 유효하다. 예전 코드가 append 전에 걸고
 * 예외를 삼켜 grow 가 한 번도 적용되지 않았던 결함이 정확히 이 규칙에서 나온다.
 */
function assertSizingAllowed(node: MockNode, value: string, axis: 'horizontal' | 'vertical'): void {
  if (value !== 'FILL') return;
  const parent = node.parent;
  if (parent === null || !(parent instanceof MockFrameNode) || parent.layoutMode === 'NONE') {
    throw new Error(
      `layoutSizing${axis === 'horizontal' ? 'Horizontal' : 'Vertical'}='FILL' is only valid on auto-layout children`,
    );
  }
  // **채움과 감싸기는 같은 축에서 공존할 수 없다.** 부모가 그 축을 hug(AUTO) 하는데 자식이
  // FILL 이면 "내용에 맞춰 줄이면서 동시에 부모를 채운다"는 모순이 된다 — 실제 Figma 는 이걸
  // 거부한다. 목이 이걸 통과시키면 디자이너 화면에서 폭이 0 으로 접힌 레이어를 우리는 초록으로 본다.
  const parentAxisMode =
    (parent.layoutMode === 'HORIZONTAL') === (axis === 'horizontal')
      ? parent.primaryAxisSizingMode
      : parent.counterAxisSizingMode;
  if (parentAxisMode === 'AUTO') {
    throw new Error(
      `layoutSizing${axis === 'horizontal' ? 'Horizontal' : 'Vertical'}='FILL' is invalid: ` +
        `parent '${parent.name}' hugs that axis (sizing mode AUTO)`,
    );
  }
}

export class MockTextNode extends MockNode {
  private chars = '';
  private font: MockFontName = { family: 'Inter', style: 'Regular' };
  private size = 12;
  private autoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE' = 'WIDTH_AND_HEIGHT';

  textStyleId = '';
  /** 실제 API 와 같이 PIXELS/PERCENT/AUTO 를 받는다 */
  lineHeight:
    { readonly unit: 'PIXELS' | 'PERCENT'; readonly value: number } | { readonly unit: 'AUTO' } = {
    unit: 'AUTO',
  };

  constructor(
    private readonly fonts: FontRegistry,
    defaultFont: MockFontName,
  ) {
    super('TEXT');
    this.font = { ...defaultFont };
  }

  /** 실제 API 의 대표적 무음 실패 — 미로드 폰트 상태에서의 모든 쓰기는 throw 한다 */
  private assertFontLoaded(): void {
    if (!this.fonts.isLoaded(this.font)) {
      throw new Error(
        `Cannot write to node with unloaded font "${this.font.family} ${this.font.style}"`,
      );
    }
  }

  get characters(): string {
    // Figma 는 TEXT 컴포넌트 속성이 걸린 레이어의 내용을 **속성값으로 덮어쓴다**.
    // 목이 이걸 재현하지 않으면 '빈 기본값이 라벨을 지운다'는 결함이 영영 보이지 않는다.
    const override = this.propertyOverride();
    return override ?? this.chars;
  }

  set characters(value: string) {
    this.assertFontLoaded();
    this.chars = value;
    this.reflow();
  }

  /** 속성 참조가 가리키는 TEXT 속성의 현재 기본값 (없으면 null) */
  private propertyOverride(): string | null {
    const refs = this.componentPropertyReferences;
    if (refs === null) return null;
    const key = refs['characters'];
    if (key === undefined) return null;
    const owner = this.owningComponent();
    if (owner === null) return null;
    const def = owner.componentPropertyDefinitions[key];
    if (def === undefined || def.type !== 'TEXT') return null;
    return typeof def.defaultValue === 'string' ? def.defaultValue : null;
  }

  /** 속성 덮어쓰기를 무시한 **레이어 자체의** 문자열 (진단용) */
  get rawCharacters(): string {
    return this.chars;
  }

  get fontName(): MockFontName {
    return this.font;
  }

  set fontName(value: MockFontName) {
    // 현재 폰트가 미로드면 기존 텍스트를 다시 쓸 수 없어 실패한다 …
    this.assertFontLoaded();
    // … 새 폰트도 로드돼 있어야 한다
    if (!this.fonts.isLoaded(value)) {
      throw new Error(`Cannot set fontName to unloaded font "${value.family} ${value.style}"`);
    }
    this.font = { ...value };
  }

  get fontSize(): number {
    return this.size;
  }

  set fontSize(value: number) {
    this.assertFontLoaded();
    this.size = value;
    this.reflow();
  }

  get textAutoResize(): 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE' {
    return this.autoResize;
  }

  set textAutoResize(value: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE') {
    this.assertFontLoaded();
    this.autoResize = value;
    this.reflow();
  }

  override resize(w: number, h: number): void {
    this.assertFontLoaded();
    super.resize(w, h);
  }

  private reflow(): void {
    if (this.autoResize === 'WIDTH_AND_HEIGHT') {
      this.width = Math.max(1, this.chars.length * this.size * 0.6);
      this.height = Math.max(1, this.size * 1.4);
    } else if (this.autoResize === 'HEIGHT') {
      this.height = Math.max(1, this.size * 1.4);
    }
  }
}

export interface MockPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue: string | boolean;
  variantOptions?: string[];
  preferredValues?: unknown[];
}

class ComponentPropertyHost extends MockFrameNode {
  readonly componentPropertyDefinitions: Record<string, MockPropertyDefinition> = {};
  readonly key = `key-${nextId()}`;

  addComponentProperty(
    name: string,
    type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP',
    defaultValue: string | boolean,
  ): string {
    if (name.length === 0) throw new Error('Component property name must not be empty');
    if (name.includes('#'))
      throw new Error(`Component property name must not contain '#': ${name}`);
    const exists = Object.keys(this.componentPropertyDefinitions).some(
      (k) => k === name || k.startsWith(`${name}#`),
    );
    if (exists) throw new Error(`Component property '${name}' already exists`);
    if (type === 'INSTANCE_SWAP') {
      if (typeof defaultValue !== 'string' || defaultValue.length === 0) {
        throw new Error('INSTANCE_SWAP default value must be a component id');
      }
      if (!registry.has(defaultValue)) {
        throw new Error(`INSTANCE_SWAP default value is not a known component id: ${defaultValue}`);
      }
    }
    if (type === 'TEXT' && typeof defaultValue !== 'string') {
      throw new Error('TEXT default value must be a string');
    }
    if (type === 'BOOLEAN' && typeof defaultValue !== 'boolean') {
      throw new Error('BOOLEAN default value must be a boolean');
    }
    const key = `${name}#${nextId()}`;
    this.componentPropertyDefinitions[key] = { type, defaultValue };
    return key;
  }

  editComponentProperty(
    key: string,
    changes: { name?: string; defaultValue?: string | boolean; preferredValues?: unknown[] },
  ): string {
    const def = this.componentPropertyDefinitions[key];
    if (def === undefined) throw new Error(`Component property ${key} does not exist`);
    if (changes.preferredValues !== undefined) {
      if (def.type !== 'INSTANCE_SWAP') {
        throw new Error('preferredValues is only valid on INSTANCE_SWAP properties');
      }
      def.preferredValues = changes.preferredValues;
    }
    if (changes.defaultValue !== undefined) def.defaultValue = changes.defaultValue;
    return key;
  }
}

export class MockComponentNode extends ComponentPropertyHost {
  constructor() {
    super('COMPONENT');
    registry.set(this.id, this);
  }

  createInstance(): MockInstanceNode {
    const inst = new MockInstanceNode(this);
    cloneChildrenInto(this, inst);
    inst.name = this.name;
    inst.width = this.width;
    inst.height = this.height;
    currentPage.appendChild(inst);
    return inst;
  }

  get variantProperties(): Record<string, string> | null {
    if (!(this.parent instanceof MockComponentSetNode)) return null;
    return parseVariantName(this.name);
  }
}

export class MockInstanceNode extends MockFrameNode {
  constructor(public mainComponent: MockComponentNode) {
    super('INSTANCE');
  }
}

export class MockComponentSetNode extends ComponentPropertyHost {
  constructor() {
    super('COMPONENT_SET');
  }

  get defaultVariant(): MockComponentNode | null {
    const first = this.children[0];
    return first instanceof MockComponentNode ? first : null;
  }
}

/** createNodeFromSvg 가 돌려주는 프레임 — 안에 실제 VECTOR 자식들이 들어간다 */
export class MockSvgFrameNode extends MockFrameNode {
  constructor(readonly svgSource: string) {
    super('FRAME');
  }
}

export class MockPageNode extends MockNode {
  constructor(name: string) {
    super('PAGE');
    this.name = name;
  }

  async loadAsync(): Promise<void> {
    return Promise.resolve();
  }
}

/** 컴포넌트 id → 노드. INSTANCE_SWAP 기본값 검증에 쓴다 */
const registry = new Map<string, MockComponentNode>();

function cloneChildrenInto(source: MockNode, target: MockNode): void {
  for (const child of source.children) {
    const copy = shallowClone(child);
    target.appendChild(copy);
    cloneChildrenInto(child, copy);
  }
}

function shallowClone(node: MockNode): MockNode {
  if (node instanceof MockTextNode) {
    const copy = new MockTextNode(activeFonts, node.fontName);
    copy.name = node.name;
    // 인스턴스는 원본 레이어의 문자열을 그대로 물려받는다
    try {
      copy.characters = node.rawCharacters;
    } catch {
      // 폰트 미로드 — 원본과 같은 실패를 그대로 물려준다
    }
    return copy;
  }
  const copy = new MockFrameNode(node.type === 'COMPONENT' ? 'FRAME' : node.type);
  copy.name = node.name;
  copy.width = node.width;
  copy.height = node.height;
  return copy;
}

function parseVariantName(name: string): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const part of name.split(',')) {
    const [k, v] = part.split('=');
    if (k === undefined || v === undefined) return null;
    out[k.trim()] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

export class MockVariable {
  readonly id = `VariableID:${nextId()}`;
  private readonly values = new Map<string, unknown>();

  constructor(
    public name: string,
    public readonly variableCollectionId: string,
    public readonly resolvedType: string,
  ) {}

  setValueForMode(modeId: string, value: unknown): void {
    this.values.set(modeId, value);
  }

  remove(): void {
    /* no-op */
  }
}

export class MockVariableCollection {
  readonly id = `VariableCollectionId:${nextId()}`;
  readonly modes: Array<{ modeId: string; name: string }> = [{ modeId: 'm0', name: 'Mode 1' }];

  constructor(public name: string) {}

  addMode(name: string): string {
    const modeId = `m${String(this.modes.length)}`;
    this.modes.push({ modeId, name });
    return modeId;
  }

  renameMode(modeId: string, name: string): void {
    const mode = this.modes.find((m) => m.modeId === modeId);
    if (mode) mode.name = name;
  }
}

// ---------------------------------------------------------------------------
// figma 루트
// ---------------------------------------------------------------------------

let currentPage: MockPageNode;
let activeFonts: FontRegistry;

export interface MockFigmaOptions {
  /** 이 환경에 설치된 폰트 (loadFontAsync 가 성공할 수 있는 것) */
  availableFonts?: readonly MockFontName[];
  /** figma.createText() 가 만든 노드가 달고 태어나는 폰트 */
  documentDefaultFont?: MockFontName;
}

const DEFAULT_FONTS: readonly MockFontName[] = [
  { family: 'Inter', style: 'Regular' },
  { family: 'Inter', style: 'Medium' },
  { family: 'Inter', style: 'Semi Bold' },
  { family: 'Inter', style: 'Bold' },
];

export interface MockFigma {
  root: MockNode;
  mixed: typeof MIXED;
  currentPage: MockPageNode;
  fonts: FontRegistry;
  createPage(): MockPageNode;
  createFrame(): MockFrameNode;
  createText(): MockTextNode;
  createEllipse(): MockNode;
  createLine(): MockNode;
  createRectangle(): MockNode;
  createComponent(): MockComponentNode;
  createNodeFromSvg(svg: string): MockSvgFrameNode;
  combineAsVariants(nodes: MockComponentNode[], parent: MockNode): MockComponentSetNode;
  loadFontAsync(font: MockFontName): Promise<void>;
  loadAllPagesAsync(): Promise<void>;
  setCurrentPageAsync(page: MockPageNode): Promise<void>;
  notify(message: string): void;
  variables: {
    createVariable(name: string, collection: MockVariableCollection, type: string): MockVariable;
    createVariableCollection(name: string): MockVariableCollection;
    getLocalVariablesAsync(): Promise<MockVariable[]>;
    getLocalVariableCollectionsAsync(): Promise<MockVariableCollection[]>;
    setBoundVariableForPaint(paint: MockPaint, field: string, variable: MockVariable): MockPaint;
  };
}

export function createFigmaMock(options: MockFigmaOptions = {}): MockFigma {
  idCounter = 0;
  registry.clear();

  const fonts = new FontRegistry(options.availableFonts ?? DEFAULT_FONTS);
  activeFonts = fonts;
  const documentDefault = options.documentDefaultFont ?? { family: 'Inter', style: 'Regular' };

  const root = new MockNode('DOCUMENT');
  const page = new MockPageNode('Page 1');
  root.appendChild(page);
  currentPage = page;

  const variables: MockVariable[] = [];
  const collections: MockVariableCollection[] = [];

  const adopt = <T extends MockNode>(node: T): T => {
    currentPage.appendChild(node);
    return node;
  };

  const figmaMock: MockFigma = {
    root,
    mixed: MIXED,
    get currentPage() {
      return currentPage;
    },
    fonts,

    createPage(): MockPageNode {
      const p = new MockPageNode(`Page ${String(root.children.length + 1)}`);
      root.appendChild(p);
      return p;
    },
    createFrame: () => adopt(new MockFrameNode('FRAME')),
    createText: () => adopt(new MockTextNode(fonts, documentDefault)),
    createEllipse: () => adopt(new MockNode('ELLIPSE')),
    createLine: () => adopt(new MockNode('LINE')),
    createRectangle: () => adopt(new MockNode('RECTANGLE')),
    createComponent: () => adopt(new MockComponentNode()),

    /**
     * 실제 API 와 같이 SVG 문자열을 파싱해 **벡터 노드 트리**를 만든다.
     * 엄격성: 실제 Figma 는 svg 루트가 없거나 도형이 하나도 없으면 던진다 —
     * 빈 아이콘이 조용히 통과하면 이 목을 만든 의미가 없다.
     */
    createNodeFromSvg(svg: string): MockSvgFrameNode {
      if (typeof svg !== 'string' || !/<svg[\s>]/.test(svg)) {
        throw new Error('createNodeFromSvg: input is not an SVG document');
      }
      const shapes = [...svg.matchAll(/<(path|rect|circle|line|polyline|polygon|ellipse)[\s/>]/g)];
      if (shapes.length === 0) {
        throw new Error('createNodeFromSvg: SVG contains no drawable geometry');
      }
      const frame = adopt(new MockSvgFrameNode(svg));
      frame.name = 'svg';
      frame.resize(24, 24);
      for (const shape of shapes) {
        const child = new MockNode('VECTOR');
        child.name = shape[1] ?? 'vector';
        frame.appendChild(child);
      }
      return frame;
    },

    combineAsVariants(nodes: MockComponentNode[], parent: MockNode): MockComponentSetNode {
      if (nodes.length < 2) throw new Error('combineAsVariants requires at least two components');
      let axes: string[] | null = null;
      const seen = new Set<string>();
      for (const node of nodes) {
        const parsed = parseVariantName(node.name);
        if (parsed === null) {
          throw new Error(
            `combineAsVariants: component name is not in 'Prop=Value' form: "${node.name}"`,
          );
        }
        const keys = Object.keys(parsed).sort();
        if (axes === null) axes = keys;
        else if (axes.join('|') !== keys.join('|')) {
          throw new Error(
            `combineAsVariants: inconsistent variant axes — expected ${axes.join(',')} got ${keys.join(',')}`,
          );
        }
        if (seen.has(node.name)) {
          throw new Error(`combineAsVariants: duplicate variant combination "${node.name}"`);
        }
        seen.add(node.name);
      }
      const set = new MockComponentSetNode();
      parent.appendChild(set);
      for (const node of nodes) set.appendChild(node);
      return set;
    },

    async loadFontAsync(font: MockFontName): Promise<void> {
      await fonts.load(font);
    },
    loadAllPagesAsync: () => Promise.resolve(),
    async setCurrentPageAsync(p: MockPageNode): Promise<void> {
      currentPage = p;
      return Promise.resolve();
    },
    notify: () => undefined,

    variables: {
      createVariable(name, collection, type): MockVariable {
        const v = new MockVariable(name, collection.id, type);
        variables.push(v);
        return v;
      },
      createVariableCollection(name): MockVariableCollection {
        const c = new MockVariableCollection(name);
        collections.push(c);
        return c;
      },
      getLocalVariablesAsync: () => Promise.resolve(variables),
      getLocalVariableCollectionsAsync: () => Promise.resolve(collections),
      setBoundVariableForPaint(paint, field, variable): MockPaint {
        if (paint.type !== 'SOLID') {
          throw new Error('setBoundVariableForPaint requires a SOLID paint');
        }
        if (field !== 'color') throw new Error(`Unsupported paint field: ${field}`);
        // 실제 API 와 같이 **복사본**을 돌려준다 — 원본을 그대로 쓰면 바인딩이 유실된다
        return {
          ...paint,
          boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } },
        };
      },
    },
  };

  // findOne/findAllWithCriteria 는 root 에서 호출된다
  Object.defineProperty(root, 'findAllWithCriteria', {
    value: (criteria: { types: string[] }) => root.findAll((n) => criteria.types.includes(n.type)),
    writable: true,
  });

  return figmaMock;
}

/**
 * 목을 전역 `figma` 로 설치한다.
 *
 * 여기 단 한 곳에서만 캐스팅한다 — 목은 구조적으로 PluginAPI 전체를 만족할 수 없고
 * (수백 개의 미구현 멤버), 그 사실을 테스트 코드 전반에 퍼뜨리지 않기 위해서다.
 */
export function installFigmaMock(options: MockFigmaOptions = {}): MockFigma {
  const mock = createFigmaMock(options);
  (globalThis as unknown as { figma: MockFigma }).figma = mock;
  return mock;
}

/**
 * 목 위에서 실제 조립기를 돌린다 — **타입 경계는 여기 한 곳뿐**이다.
 *
 * 목은 PluginAPI 의 수백 개 멤버를 구조적으로 만족할 수 없으므로 어딘가에서는 한 번
 * 건너뛰어야 한다. 그 지점을 이 함수로 좁혀 두면 테스트 본문은 완전히 타입 검사된다.
 */
export function buildOnMock(
  contract: ComponentFigmaSpec,
  page: MockNode,
  vars: ReadonlyMap<string, MockVariable>,
  font: MockFontName,
  log: string[],
  failures?: CheckFailure[],
  /** Variable 해석값 — 줄 높이·굵기처럼 바인딩이 아니라 값으로 적용되는 축에 필요하다 */
  tokenValues?: ReadonlyMap<string, string | number | boolean>,
  /** 이 실행에서 로드된 폰트 전체 — 주면 굵기 토큰대로 스타일을 고른다(타이포 배관) */
  fonts?: LoadedFonts,
): MockNode {
  const result = buildComponent(
    contract,
    page as unknown as PageNode,
    vars as unknown as Map<string, Variable>,
    font as unknown as FontName,
    log,
    failures,
    tokenValues,
    fonts,
  );
  if (result === null) throw new Error(`${contract.name}: 조립 결과가 null 이다`);
  return result as unknown as MockNode;
}
