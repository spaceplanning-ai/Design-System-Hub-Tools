/**
 * 공용 유틸 — 계약 타입 정의, 계약/토큰 로딩, DTCG 플래튼, 문자열 헬퍼.
 * 모든 generator와 validator가 이 모듈을 공유한다 (로직 중복 금지).
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONTRACTS_DIR, TOKENS_JSON_PATH } from './paths';

// ---------------------------------------------------------------------------
// 계약(contract) 타입 — contracts/schemas/component.v1.json 과 1:1 대응
// ---------------------------------------------------------------------------

export type ComponentLevel = 'atom' | 'molecule' | 'organism' | 'template' | 'page';

/** 기능 축 — level(원자성 축)과 직교한다. CATEGORY_ORDER 가 표시/정렬 순서의 정본이다. */
export type ComponentCategory =
  | 'Actions'
  | 'Inputs'
  | 'Selection'
  | 'Navigation'
  | 'Feedback'
  | 'Dialogs & Overlays'
  | 'Data Display'
  | 'Media'
  | 'Layout'
  | 'Forms'
  | 'Lists'
  | 'Tables'
  | 'Authentication'
  | 'Commerce'
  | 'Communication'
  | 'File'
  | 'Maps'
  | 'Charts'
  | 'Utilities'
  | 'Mobile'
  | 'AI'
  | 'Korean Service'
  | 'Foundation';

/**
 * 표시/정렬 순서의 정본(23 모듈). 아래 4곳이 이 순서와 반드시 일치해야 한다:
 *  - contracts/schemas/component.v1.json  (category enum)
 *  - packages/ui/.storybook/preview.ts    (storySort.order)
 *  - tools/figma-plugin/src/main.ts       (COMPONENT_CATEGORY_ORDER — 페이지 생성)
 *  - tools/figma-plugin/src/tds-doc.ts    (COMPONENT_CATEGORIES — 페이지 정렬)
 */
export const CATEGORY_ORDER: readonly ComponentCategory[] = [
  'Actions',
  'Inputs',
  'Selection',
  'Navigation',
  'Feedback',
  'Dialogs & Overlays',
  'Data Display',
  'Media',
  'Layout',
  'Forms',
  'Lists',
  'Tables',
  'Authentication',
  'Commerce',
  'Communication',
  'File',
  'Maps',
  'Charts',
  'Utilities',
  'Mobile',
  'AI',
  'Korean Service',
  'Foundation',
] as const;

export type PropType =
  | 'enum'
  | 'boolean'
  | 'string'
  | 'number'
  | 'slot'
  | 'node'
  | 'function'
  // 데이터 기반 컴포넌트(테이블 rows, 차트 points)의 데이터 prop — Figma 대응 없음 (ADR-0003)
  | 'array'
  | 'object';

export interface ContractProp {
  type: PropType;
  values?: string[];
  default?: unknown;
  required?: boolean;
  figmaProperty?: string;
  /**
   * boolean prop 전용 옵트인 — Figma 에서 BOOLEAN 속성 대신 Variant 축(true/false)으로 만든다.
   * 그 boolean 이 레이어의 표시 여부가 아니라 **내용 자체**를 가를 때 쓴다(ToggleSwitch.checked).
   * React 타입은 그대로 boolean 이다.
   */
  figmaVariant?: boolean;
  /**
   * slot prop 전용. true 면 Figma 에서 INSTANCE_SWAP 과 함께 그 슬롯의 표시/숨김 BOOLEAN 을
   * 하나 더 만든다(계약 키: `<slot>Visible`). React 타입은 바뀌지 않는다 — Figma 표현 전용이다.
   */
  figmaToggle?: boolean;
  accepts?: string[];
  /** array/object prop 의 TS 타입 표현 (예: '{ id: string; label: string }') */
  itemShape?: string;
  hiddenWhen?: string[];
  description?: string;
  /** Figma 문서용 한 줄 설명. 없으면 description 첫 문장을 쓴다 (oneLineSummary) */
  summary?: string;
  deprecated?: boolean;
}

export interface ContractEvent {
  payload: string;
  blockedWhen?: string[];
  description?: string;
}

export interface DeprecatedProp {
  name: string;
  replacedBy: string;
  removeIn: string;
}

export interface ContractA11y {
  role: string;
  keyboard: string[];
  focusVisible: boolean;
  ariaDisabled?: string;
  ariaBusy?: string;
  aria?: Record<string, string>;
  contrastMin?: number;
}

export interface ComponentContract {
  $schema?: string;
  name: string;
  version: string;
  level: ComponentLevel;
  category: ComponentCategory;
  /** 구현 대상 정본 카탈로그 항목 key — 생략하면 정본 밖 프로젝트 고유(extras) */
  taxonomyItem?: string;
  status: 'draft' | 'beta' | 'stable' | 'deprecated';
  description?: string;
  /** Figma 문서 카드용 한 줄 설명. 없으면 description 첫 문장을 쓴다 (oneLineSummary) */
  summary?: string;
  owner: { code: string; design: string; figma: string };
  props: Record<string, ContractProp>;
  events?: Record<string, ContractEvent>;
  states: string[];
  /**
   * Figma 상태 변형 축의 값 목록 — states 의 부분집합.
   * **시각적으로 실제 구분되는 상태만** 넣는다(계약 schema 의 figmaStateAxis 참고).
   */
  figmaStateAxis?: string[];
  tokens: Record<string, string>;
  /**
   * 변형 축별 토큰 표 — `prop → 값 → 토큰 키 → 경로`. flat tokens 가 변형 무관 값을 담고,
   * 이 블록이 변형마다 달라지는 값을 담는다. codegen 은 해석하지 않고 <Name>.figma.json 으로
   * 그대로 흘려보내며, 플러그인이 활성 변형으로 조회해 flat tokens 보다 먼저 채택한다.
   */
  variantTokens?: Record<string, Record<string, Record<string, string>>>;
  a11y: ContractA11y;
  responsive?: { breakpoints: string[]; behavior: string };
  compat?: { breakingSince?: string | null; deprecatedProps?: DeprecatedProp[] };
  dependencies?: string[];
  /**
   * 부위 트리 선언 — Figma 플러그인이 이 구조를 실제 노드로 조립한다(스크린샷 금지).
   * 형식은 contracts/schemas/component.v1.json 의 anatomyNode 가 정본이며, 플러그인 쪽
   * 타입(tools/figma-plugin/src/spec/anatomy.ts)이 런타임에서 다시 방어적으로 정규화한다.
   * codegen 은 내용을 해석하지 않고 <Name>.figma.json 으로 그대로 흘려보낸다.
   */
  anatomy?: unknown;
}

export const LEVEL_ORDER: Record<ComponentLevel, number> = {
  atom: 0,
  molecule: 1,
  organism: 2,
  template: 3,
  page: 4,
};

// ---------------------------------------------------------------------------
// 파일 로딩
// ---------------------------------------------------------------------------

export interface LoadedContract {
  /** 절대 경로 */
  filePath: string;
  /** 파일명 (예: Button.contract.json) */
  fileName: string;
  contract: ComponentContract;
}

export function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/** contracts/*.contract.json 목록 (glob 기반 — 특정 파일 존재를 가정하지 않음) */
export function listContractFiles(): string[] {
  if (!fs.existsSync(CONTRACTS_DIR)) return [];
  return fs
    .readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith('.contract.json'))
    .sort()
    .map((f) => path.join(CONTRACTS_DIR, f));
}

/**
 * 모든 계약을 로드한다. JSON 파싱 실패 시 throw —
 * 스키마/의미 검증 전에 반드시 validate-contract 를 통과시킬 것.
 */
export function loadContracts(): LoadedContract[] {
  return listContractFiles().map((filePath) => ({
    filePath,
    fileName: path.basename(filePath),
    contract: readJsonFile(filePath) as ComponentContract,
  }));
}

/** tokens/tokens.json 로드 — 없으면 null (다른 배치가 생성 중일 수 있음) */
export function loadTokensDocument(): Record<string, unknown> | null {
  if (!fs.existsSync(TOKENS_JSON_PATH)) return null;
  return readJsonFile(TOKENS_JSON_PATH) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// DTCG 토큰 플래튼
// ---------------------------------------------------------------------------
//
// 토큰 판정 기준: `$value` 프로퍼티 보유 노드 = 토큰 리프.
// `$type` 은 그룹에서 상속된다.
//
// 테마는 라이트 단일 모드다(2026-07-20). 어드민이 다크를 켜는 곳이 한 군데도 없어
// `$extensions['tds.modes']` 페어링·최상위 `dark` 그룹·`[data-theme='dark']` 블록을
// 파이프라인 전체에서 걷어냈다. 모드 개념이 없으므로 토큰은 값 하나만 갖는다.

export interface FlatToken {
  /** 점 표기 경로 (예: color.action.primary.default) */
  path: string;
  /** 상속 포함 $type */
  type: string | undefined;
  /** 토큰 값 */
  value: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * DTCG 문서를 `경로 → FlatToken` 맵으로 평탄화한다.
 * 삽입 순서는 tokens.json 의 선언 순서를 따른다 (생성물 결정성 보장).
 */
export function flattenTokens(doc: Record<string, unknown>): Map<string, FlatToken> {
  const base = new Map<string, FlatToken>();

  const walk = (node: unknown, prefix: string[], inheritedType: string | undefined): void => {
    if (!isPlainObject(node)) return;
    const type = typeof node['$type'] === 'string' ? (node['$type'] as string) : inheritedType;

    if ('$value' in node) {
      const p = prefix.join('.');
      if (p === '') return; // 루트 자체가 토큰인 비정상 문서는 무시
      base.set(p, { path: p, type, value: node['$value'] });
      return; // 토큰 리프 아래로는 내려가지 않는다
    }

    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$')) continue;
      walk(child, [...prefix, key], type);
    }
  };

  for (const [key, child] of Object.entries(doc)) {
    if (key.startsWith('$')) continue;
    walk(child, [key], undefined);
  }

  return base;
}

/** 토큰 경로 → CSS 변수명. color.action.primary.default → --tds-color-action-primary-default */
export function cssVarName(tokenPath: string): string {
  return `--tds-${tokenPath.split('.').join('-')}`;
}

// ---------------------------------------------------------------------------
// 문자열 / 생성물 헬퍼
// ---------------------------------------------------------------------------

export interface GeneratedFile {
  /** 절대 경로 */
  filePath: string;
  /** LF 개행으로 정규화된 최종 내용 */
  content: string;
}

/**
 * 모든 생성 TS 파일의 첫 줄 헤더.
 *
 * version 을 넘기면 `contracts/<Name>.contract.json@<semver>` 형태로 원천과 세대를 한 줄에 박는다.
 * contract-test 의 세대 일치 검사가 '같은 줄의 contract + semver'로 생성물 세대를 판별하므로,
 * 이 형식이 깨지면 Contract ↔ React 축이 FAIL 처리된다 (tools/contract-test/src/axes/react.ts).
 */
export function generatedHeader(contractName: string, version?: string): string {
  const source = version
    ? `contracts/${contractName}.contract.json@${version}`
    : `contracts/${contractName}.contract.json`;
  return `// AUTO-GENERATED from ${source} — DO NOT EDIT (pnpm codegen)`;
}

/**
 * 긴 설명에서 **한 줄 요약**을 뽑는다 — Figma 문서 카드/섹션 헤더용.
 *
 * 계약의 description 은 의사결정 근거까지 담은 문단이라 그대로 쓰면 문서가 읽히지 않는다.
 * 규칙: 대괄호 주석 머리('[...] ')를 떼고 → 첫 문장까지 자르고 → 길면 말줄임한다.
 * 계약이 summary 를 직접 적어 두면 이 함수는 쓰이지 않는다.
 *
 * maxLength 가 80 이 아니라 160 인 이유 (2026-07-20):
 * 80 은 Figma 문서 카드가 **고정 높이**여서 넘치면 잘리던 시절의 값이었다. 문서 렌더러가 세로
 * HUG 로 바뀌어 클리핑 제약이 사라졌으므로, 이 상한의 남은 역할은 '평범한 문장을 다듬는 것'이
 * 아니라 '폭주한 문장을 막는 안전판'이다. 계약 44건 실측 결과 첫 문장 최대 길이가 155자라
 * 160 에서는 **9건 전부 잘리지 않는다**(80 에서는 9건이 잘렸다).
 *
 * 그리고 상한이 실제로 걸릴 때도 **단어 중간을 자르지 않는다.** 80 시절의 실제 증상이
 * `…알린다('Canvas colo…` 처럼 낱말과 괄호를 토막 낸 것이었다(ColorField.label). 상한을 올리는
 * 것만으로는 더 긴 문장이 들어오면 같은 증상이 재발하므로, 잘라야 할 때는 예산 안의 마지막
 * 공백까지만 남긴다. 한국어도 어절 사이에 공백이 있어 이 규칙이 그대로 성립한다.
 */
export function oneLineSummary(description: string | undefined, maxLength = 160): string {
  if (description === undefined) return '';
  // 줄바꿈은 공백으로 — 첫 문장이 줄을 넘어가는 계약이 있다
  let text = description.replace(/\s+/g, ' ').trim();
  // '[네이티브 속성 패스스루 — …]' 같은 머리 주석은 요약이 아니다
  while (text.startsWith('[')) {
    const close = text.indexOf(']');
    if (close < 0) break;
    text = text.slice(close + 1).trim();
  }
  // 첫 문장 — 한국어 종결('다.')과 영문 마침표를 함께 본다
  const stop = text.search(/[.。](\s|$)/);
  if (stop >= 0) text = text.slice(0, stop);
  text = text.trim();
  if (text.length > maxLength) {
    // 말줄임표 한 칸을 빼고 남은 예산 안에서 **마지막 공백**까지만 취한다 — 낱말을 토막 내지 않는다
    const budget = text.slice(0, maxLength - 1);
    const lastSpace = budget.lastIndexOf(' ');
    // 예산 안에 공백이 없으면(공백 없는 초장문 토큰) 자를 자리가 없으므로 그대로 하드컷한다
    const cut = lastSpace > 0 ? budget.slice(0, lastSpace) : budget;
    text = `${cut.trim()}…`;
  }
  return text;
}

export function pascal(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** camelCase → kebab-case (fontSize → font-size) */
export function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** 개행 정규화 — --check 비교 시 CRLF/LF 차이를 무시 */
export function normalizeEol(s: string): string {
  return s.replace(/\r\n/g, '\n');
}

/** 디렉터리를 보장하고 파일을 기록 (LF, UTF-8) */
export function writeFileEnsured(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

/** 기존 파일과 내용이 같은지 비교 (없으면 false) */
export function fileMatches(filePath: string, content: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const current = normalizeEol(fs.readFileSync(filePath, 'utf8'));
  return current === normalizeEol(content);
}
