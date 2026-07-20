/**
 * 계약 → Figma Component Properties 생성기.
 *
 * contracts/<Name>.contract.json → tools/figma-plugin/generated/<Name>.figma.json
 * Figma 플러그인이 이 파일을 읽어 Component Property / Variant 를 동기화한다.
 *
 * prop 타입 매핑:
 *   enum    → VARIANT        (values + default)
 *   boolean → BOOLEAN        (default)
 *   slot    → INSTANCE_SWAP  (accepts)
 *   string  → TEXT           (default)
 *   node    → TEXT           (콘텐츠 슬롯 — Figma 텍스트 프로퍼티로 매핑)
 *   number / function → Figma 대응 없음, 생략
 *
 * 산출 페이로드는 두 소비자를 동시에 만족시킨다:
 *   - name + variantProperties : 플러그인 sync-component (Component Set 의 Variant Property 동기화)
 *   - component + properties + tokens : TDS 문서 생성기 (Property 표 · 토큰 바인딩)
 * variantProperties 는 Figma Variant 로 표현 가능한 prop(enum·boolean)만 담는다.
 * boolean 은 Figma Variant 값이 문자열이므로 ['true','false'] 로 정규화한다.
 */
import path from 'node:path';
import { FIGMA_GENERATED_DIR, REPO_ROOT } from './paths';
import { ComponentContract, ContractProp, GeneratedFile, oneLineSummary, pascal } from './shared';
import { extractAllIcons } from './extract-icons';

interface FigmaProperty {
  name: string;
  /**
   * 계약 prop 이름 그대로. 플러그인의 anatomy(textProp·slotProp·visibleProp)가 이 이름으로
   * 레이어와 속성을 잇는다 — Figma 표시명(name)만으로는 계약 쪽 이름을 되찾을 수 없다.
   */
  prop: string;
  /** 문서의 prop 섹션 헤더 밑에 붙는 한 줄 설명 — 계약 summary 또는 description 첫 문장 */
  summary?: string;
  type: 'VARIANT' | 'BOOLEAN' | 'INSTANCE_SWAP' | 'TEXT';
  values?: string[];
  default?: unknown;
  accepts?: string[];
  hiddenWhen?: string[];
  deprecated?: boolean;
}

function toFigmaProperty(propName: string, prop: ContractProp): FigmaProperty | null {
  const name = prop.figmaProperty ?? pascal(propName);
  const summary = prop.summary ?? oneLineSummary(prop.description);
  const common = {
    prop: propName,
    ...(summary.length > 0 ? { summary } : {}),
    ...(prop.hiddenWhen?.length ? { hiddenWhen: prop.hiddenWhen } : {}),
    ...(prop.deprecated ? { deprecated: true } : {}),
  };

  switch (prop.type) {
    case 'enum':
      return {
        name,
        type: 'VARIANT',
        values: prop.values ?? [],
        ...(prop.default !== undefined ? { default: prop.default } : {}),
        ...common,
      };
    case 'boolean':
      // figmaVariant 옵트인 — 이 boolean 은 '레이어를 보이고 감추는' 축이 아니라 '내용을 가르는'
      // 축이다. Figma 의 BOOLEAN→visible 바인딩에는 부정이 없어 두 레이어를 상호배타로 만들 수
      // 없으므로, Variant 축(true/false)으로 승격해 anatomy 의 when 조건이 고르게 한다.
      // React 쪽 타입은 그대로 boolean 이다 (generate-types 는 이 플래그를 보지 않는다).
      if (prop.figmaVariant === true) {
        return {
          name,
          type: 'VARIANT',
          values: ['true', 'false'],
          default: String(prop.default ?? false),
          ...common,
        };
      }
      return { name, type: 'BOOLEAN', default: prop.default ?? false, ...common };
    case 'slot':
      return { name, type: 'INSTANCE_SWAP', accepts: prop.accepts ?? [], ...common };
    case 'string':
    case 'node':
      return { name, type: 'TEXT', default: prop.default ?? '', ...common };
    case 'number':
    case 'function':
    case 'array':
    case 'object':
      return null; // Figma Component Property 대응 없음 (데이터 prop 포함 — ADR-0003)
  }
}

/**
 * figmaToggle 이 켜진 slot prop 에 딸리는 BOOLEAN 속성.
 * 계약 키는 `<slot>Visible` 로 고정한다 — anatomy 가 visibleProp 으로 이 이름을 가리킨다.
 */
function toSlotVisibilityProperty(propName: string, prop: ContractProp): FigmaProperty | null {
  if (prop.type !== 'slot' || prop.figmaToggle !== true) return null;
  const base = prop.figmaProperty ?? pascal(propName);
  return {
    name: `Show ${base}`,
    prop: `${propName}Visible`,
    type: 'BOOLEAN',
    // 기본은 **켜짐** — 기본 변형에서 아이콘이 보여야 디자이너가 슬롯의 존재를 알아챈다
    default: true,
    summary: `${base} 슬롯 표시 여부`,
  };
}

interface VariantPropertyDef {
  values: string[];
  default: string;
}

/** VARIANT·BOOLEAN 프로퍼티만 Figma Variant Property 로 승격한다. */
function toVariantProperties(properties: FigmaProperty[]): Record<string, VariantPropertyDef> {
  const variantProperties: Record<string, VariantPropertyDef> = {};

  for (const prop of properties) {
    if (prop.type === 'VARIANT') {
      const values = prop.values ?? [];
      if (values.length === 0) continue;
      variantProperties[prop.name] = {
        values,
        default: String(prop.default ?? values[0]),
      };
    } else if (prop.type === 'BOOLEAN') {
      variantProperties[prop.name] = {
        values: ['true', 'false'],
        default: String(prop.default ?? false),
      };
    }
  }

  return variantProperties;
}

export function generateFigma(contract: ComponentContract): GeneratedFile {
  const properties: FigmaProperty[] = [];
  // 상태 축을 선언한 계약에서는 같은 이름의 boolean 을 Figma BOOLEAN 으로 또 만들지 않는다.
  // 두 축이 공존하면 Disabled=true + State=hover 같은 **모순 조합**이 표현 가능해진다 —
  // 실제로는 존재할 수 없는 상태를 디자이너가 만들 수 있게 두는 것은 1:1 이 아니다.
  const stateAxis = contract.figmaStateAxis ?? [];
  const supersededByState = new Set(stateAxis);

  for (const [propName, prop] of Object.entries(contract.props)) {
    if (prop.type === 'boolean' && supersededByState.has(propName)) continue;
    const mapped = toFigmaProperty(propName, prop);
    if (mapped !== null) properties.push(mapped);
    // figmaToggle — 슬롯을 끄고 켜는 BOOLEAN 을 하나 더 만든다. React 는 슬롯이 비면 그냥
    // 렌더하지 않지만, Figma 의 INSTANCE_SWAP 레이어는 늘 존재하므로 visible 토글이 필요하다.
    const toggle = toSlotVisibilityProperty(propName, prop);
    if (toggle !== null) properties.push(toggle);
  }

  // 상태 축 — 시각적으로 실제 구분되는 상태만 값으로 갖는다(계약 figmaStateAxis).
  // 축 이름은 'State', 계약 prop 이름은 'state' 로 고정한다 — anatomy 의 when 조건이 이 이름을 쓴다.
  if (stateAxis.length > 1) {
    properties.push({
      name: 'State',
      prop: 'state',
      type: 'VARIANT',
      values: stateAxis,
      default: stateAxis[0] ?? 'default',
      summary: '상호배타 상태 — 시각적으로 구분되는 값만 축에 있다',
    });
  }

  // figmaText — anatomy 가 'Figma 에서 고칠 수 있게 하라' 고 표시한 고정 라벨들.
  // 계약 prop 이 아니라 **Figma 표현 전용**이므로 React 타입은 그대로다(figmaVariant·figmaToggle 계열).
  const figmaTextProps = collectFigmaTextProps(contract.anatomy);
  properties.push(...figmaTextProps.properties);

  // anatomy 안에 svgFrom 을 선언한 부위가 있으면 그 prop 의 값마다 실제 SVG 를 붙여 준다
  const assets = buildAssets(contract);

  const payload = {
    $generated: `AUTO-GENERATED from contracts/${contract.name}.contract.json — DO NOT EDIT (pnpm codegen)`,
    name: contract.name,
    component: contract.name,
    version: contract.version,
    // level: atom·molecule·organism — 플러그인이 Component Set 을 레벨별 페이지로 분류하는 데 쓴다
    level: contract.level,
    // category: 기능 축(Actions·Inputs·Feedback…) — level 과 직교한 분류 축이다
    category: contract.category,
    // status: draft·beta·stable·deprecated — 문서 카드의 상태 칩
    status: contract.status,
    // summary: 카드 제목 밑 한 줄 설명. 계약이 안 적었으면 description 첫 문장을 쓴다
    summary: contract.summary ?? oneLineSummary(contract.description),
    // states: 문서의 인터랙션 매트릭스 행을 만드는 원천 (hover·disabled·loading…)
    states: contract.states,
    variantProperties: toVariantProperties(properties),
    properties,
    tokens: contract.tokens,
    // variantTokens: 변형별 토큰 표. 선언하지 않은 계약은 키 자체를 내보내지 않는다
    // (플러그인은 없으면 기존 접미/접두 후보 탐색으로 떨어진다).
    ...(contract.variantTokens !== undefined ? { variantTokens: contract.variantTokens } : {}),
    // anatomy: 부위 트리 — 플러그인이 실제 노드로 조립하는 원천. 계약이 선언하지 않았으면
    // 키 자체를 내보내지 않는다(플러그인이 tokens 키에서 역산하는 폴백 경로로 들어간다).
    // anatomy 는 figmaText 레이어에 textProp 을 채워 넣은 사본이다 — 플러그인은 기존 배선을
    // 그대로 쓰고(textProp → TEXT 속성 → characters), 계약 원본은 건드리지 않는다.
    ...(contract.anatomy !== undefined ? { anatomy: figmaTextProps.anatomy } : {}),
    // assets: anatomy 가 svgFrom 으로 가리키는 벡터 자산 표. 모양의 정본은 실제 구현이므로
    // 여기서 추출해 넣는다 — 계약에 SVG 를 손으로 적어 두면 구현과 두 벌이 되어 어긋난다.
    ...(assets !== undefined ? { assets } : {}),
  };

  return {
    filePath: path.join(FIGMA_GENERATED_DIR, `${contract.name}.figma.json`),
    content: `${JSON.stringify(payload, null, 2)}\n`,
  };
}

/**
 * anatomy 가 svgFrom 으로 요구한 벡터 자산 표를 만든다 — prop 이름 → prop 값 → SVG.
 *
 * 모양의 원천은 앱·DS 의 실제 아이콘 구현이다(extract-icons.ts). 계약은 "어느 prop 이
 * 모양을 고르는가"만 말하고, 실제 패스는 구현에서 그때그때 추출된다 — 사본이 생기지 않는다.
 */
function buildAssets(
  contract: ComponentContract,
): Record<string, Record<string, string>> | undefined {
  const wanted = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node !== 'object' || node === null) return;
    const record = node as { svgFrom?: unknown; children?: unknown };
    if (typeof record.svgFrom === 'string') wanted.add(record.svgFrom);
    if (Array.isArray(record.children)) for (const child of record.children) walk(child);
  };
  walk(contract.anatomy);
  if (wanted.size === 0) return undefined;

  const icons = extractAllIcons(REPO_ROOT);
  const svgByName = new Map(icons.map((icon) => [icon.name, icon.svg]));

  const out: Record<string, Record<string, string>> = {};
  for (const propName of wanted) {
    const prop = contract.props?.[propName];
    const values = prop !== undefined && Array.isArray(prop.values) ? prop.values : [];
    const table: Record<string, string> = {};
    for (const value of values) {
      const svg = svgByName.get(value);
      if (svg !== undefined) table[value] = svg;
    }
    out[propName] = table;
  }
  return out;
}

/** figmaText 파생 속성의 계약 키 접두어 — 실제 계약 prop 과 절대 겹치지 않게 한다 */
const FIGMA_TEXT_PREFIX = 'figmaText:';

/**
 * anatomy 를 훑어 figmaText 로 표시된 텍스트 레이어를 Figma TEXT 속성으로 승격한다.
 *
 * 반환하는 anatomy 는 **사본**이며, 해당 레이어에 textProp 이 채워져 있다. 그 덕에 플러그인은
 * 새 개념을 배울 필요가 없다 — 이미 있는 textProp → TEXT 속성 → characters 배선을 그대로 탄다.
 *
 * repeat 안의 레이어는 건너뛴다: 회차들이 한 속성을 공유해 버려 samples 로 만든 회차별 차이가
 * 도로 사라진다(툴바 8개가 전부 같은 글자로 보이던 그 결함으로 되돌아간다).
 */
function collectFigmaTextProps(anatomy: unknown): {
  anatomy: unknown;
  properties: FigmaProperty[];
} {
  const properties: FigmaProperty[] = [];
  const used = new Set<string>();

  const walk = (raw: unknown, insideRepeat: boolean): unknown => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const node = { ...(raw as Record<string, unknown>) };
    const repeated = insideRepeat || (typeof node['repeat'] === 'number' && node['repeat'] > 1);

    if (
      node['kind'] === 'text' &&
      node['figmaText'] === true &&
      typeof node['name'] === 'string' &&
      node['textProp'] === undefined &&
      !repeated
    ) {
      const layer = node['name'];
      // 표시명은 레이어 이름 그대로 — 디자이너가 속성 패널에서 레이어와 이어 보게 한다
      let display = layer;
      let n = 2;
      while (used.has(display)) display = `${layer} ${String(n++)}`;
      used.add(display);

      const key = `${FIGMA_TEXT_PREFIX}${layer}`;
      node['textProp'] = key;
      const sample = typeof node['text'] === 'string' ? node['text'] : '';
      properties.push({
        name: display,
        prop: key,
        type: 'TEXT',
        default: sample,
        summary: '고정 라벨 — Figma 에서만 편집 가능(React prop 아님)',
      });

      // 끌 수 있는 형태가 실제로 존재하는 라벨에는 표시 토글도 함께 만든다.
      // Figma 레이어는 항상 존재하므로 '없음' 을 표현하려면 visible 에 묶인 BOOLEAN 이 필요하다.
      if (node['figmaToggle'] === true) {
        const visKey = `${FIGMA_TEXT_PREFIX}visible:${layer}`;
        node['visibleProp'] = visKey;
        properties.push({
          name: `Show ${display}`,
          prop: visKey,
          type: 'BOOLEAN',
          default: true,
          summary: `${display} 표시 여부`,
        });
      }
    }

    // 고정 아이콘(svgIcon) → 실제 SVG. 모양의 정본은 앱·DS 구현이므로 여기서 추출해 넣는다.
    if (
      node['kind'] === 'vector' &&
      typeof node['svgIcon'] === 'string' &&
      node['svg'] === undefined
    ) {
      const svg = staticIconSvg(node['svgIcon']);
      if (svg !== undefined) node['svg'] = svg;
    }

    if (Array.isArray(node['children'])) {
      node['children'] = node['children'].map((child) => walk(child, repeated));
    }
    return node;
  };

  return { anatomy: walk(anatomy, false), properties };
}

/** 고정 아이콘 이름 → 추출된 SVG. 추출기를 한 번만 돌리고 캐시한다 */
let staticIconCache: Map<string, string> | null = null;
function staticIconSvg(name: string): string | undefined {
  if (staticIconCache === null) {
    staticIconCache = new Map(extractAllIcons(REPO_ROOT).map((icon) => [icon.name, icon.svg]));
  }
  return staticIconCache.get(name);
}
