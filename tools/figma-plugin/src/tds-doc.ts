/**
 * TDS 문서 생성기 — 피그마 파일에 'TDS 문서 스타일' 페이지를 생성/재생성한다.
 * 소유: Figma 플러그인 Figma Plugin Engineer (tools/figma-plugin/**), 게이트 G7, 검수: Figma 리뷰
 *
 * 규격 문서: docs/figma/specs/tds-doc-style.md — 페이지 이름·치수·바인딩 규칙은
 * 전부 그 문서와 1:1이다. 여기 상수를 바꾸면 규격 문서도 같이 갱신할 것.
 *
 * 입력은 Storybook과 동일한 원천(pnpm codegen 산출물)만 받는다:
 *  - tokens:     generated/tokens/figma-variables.json (tokens/tokens.json에서 생성)
 *  - components: generated/<Name>.figma.json 배열 (contracts/<Name>.contract.json에서 생성)
 *  - pages:      (선택) SCR ID 메타 — docs/plan/ui/SCR-NNN.md 기준 수기 작성
 *
 * Detach 0 원칙: 모든 fill/stroke 색은 '토큰 → Variables 동기화'로 생성된 Variable에
 * setBoundVariableForPaint로 바인딩한다. 이 파일에 색 리터럴은 존재하지 않는다 —
 * 바인딩 전 플레이스홀더 페인트(검정 0값)는 바인딩이 즉시 대체한다.
 * (라벨에 hex/px "값"을 텍스트 데이터로 렌더링하는 것은 조직 규칙상 허용)
 *
 * 지오메트리는 8pt 그리드(GRID) 배수 상수만 사용한다 — 규격 문서 §2.
 */

import { buildComponentSetSpec, type ComponentFigmaSpec } from './spec/component-spec';
import {
  planComponentCard,
  type ComponentCardPlan,
  type PropOverridePlan,
  type PropSectionPlan,
} from './spec/doc-layout';
import { planDocPages, type DocPagePlanItem } from './spec/doc-pages';
import { loadAllFonts, pickStyle } from './render/fonts';
import { extractIconSet, iconVariantName, type IconSet } from './spec/icons';

// ---------------------------------------------------------------------------
// 페이로드 타입 — main.ts의 'generate-tds-doc' 메시지 규격
// ---------------------------------------------------------------------------

export interface TdsTokenVariable {
  /** Variable 이름 — 슬래시 표기 (예: 'color/action/primary/default') */
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  /** 끝까지 해석된 raw 값 — COLOR는 hex 문자열 (라벨 데이터로 사용) */
  value: string | number | boolean;
  /** 참조 토큰의 대상 Variable 이름 — 스와치 라벨의 '→ …' 줄에 사용 */
  alias?: string;
}

export interface TdsTokensPayload {
  collection: string;
  modes?: string[];
  variables: TdsTokenVariable[];
}

/** Pages 메타 — 규격 문서 §8. Screen Spec(docs/plan/ui/SCR-NNN.md)의 ID를 옮겨 적는다 */
export interface TdsPageMeta {
  id: string;
  name?: string;
  description?: string;
  /** nav 섹션 제목(그룹) — 예: '일반 관리' (generated/tds-pages.json 이 채운다) */
  section?: string;
  /** 상위 메뉴 라벨 — 예: '사용자 관리'. 같은 menu 끼리 한 Figma 페이지로 묶인다 */
  menu?: string;
}

/** 오너 정본 분류표(23모듈)의 한 항목 — component 가 null 이면 아직 미구현(로드맵) */
export interface TdsTaxonomyItem {
  key: string;
  name: string;
  /** 구현된 프로젝트 컴포넌트 이름. null/미지정 = 미구현 */
  component?: string | null;
}

/** 오너 정본 분류표의 한 카테고리(모듈) — no 는 01~23 오너 번호 */
export interface TdsTaxonomyCategory {
  no: number;
  /** 영문명 — COMPONENT_CATEGORIES 및 계약 category 와 1:1 */
  name: string;
  key: string;
  /** 한글 라벨 (예: '액션') */
  label: string;
  description?: string;
  items: TdsTaxonomyItem[];
  /** 정본 밖 프로젝트 고유 컴포넌트 이름 */
  extras?: string[];
}

export interface TdsDocPayload {
  tokens: TdsTokensPayload;
  /**
   * 오너 정본 분류표(23모듈 286항목). 없으면 카테고리 페이지의 체크리스트를 통째로 생략한다
   * (기존 동작 유지) — generated/taxonomy.json 이 없어도 문서 생성은 정상 동작해야 한다.
   */
  taxonomy?: TdsTaxonomyCategory[];
  /** generated/<Name>.figma.json 원본 배열 — 두 형식 모두 수용 (normalizeComponentSpec) */
  components?: unknown[];
  pages?: TdsPageMeta[];
  meta?: { version?: string; generatedAt?: string };
}

// ---------------------------------------------------------------------------
// 8pt 그리드 상수 — 규격 문서 §2와 1:1 (하드코딩 px 리터럴 대신 GRID 배수만 사용)
// ---------------------------------------------------------------------------

/** 8pt 그리드 기본 단위 */
const GRID = 8;
/** 4pt 서브그리드 (타이포·미세 간격 허용) */
const SUB = GRID / 2;

const PAGE_PAD = GRID * 8; // 루트 프레임 패딩 (64)
const SECTION_GAP = GRID * 6; // 섹션 간 간격 (48)
const CARD_GAP = GRID * 3; // 카드/행 간 간격 (24)
const CONTENT_W = GRID * 140; // 섹션 콘텐츠 폭 (1120)
/**
 * 문서 루트의 **고정 폭** — 고정 폭 사슬의 시작점 (1120 + 64·2 = 1248).
 *
 * [왜 고정이어야 하는가] Figma 에서 자식이 부모를 채우려면(FILL) **부모의 해당 축이 FIXED 여야
 * 한다.** 루트가 hug(AUTO)면 그 아래 모든 FILL 이 성립하지 않고 전부 hug 로 무너진다 —
 * 카드 폭이 제각각이 되고 행 정렬이 깨진 실제 증상이 정확히 이것이다.
 * 사슬: root(FIXED 1248) → section(STRETCH → 1120) → 그 아래(STRETCH → 1120).
 */
const PAGE_W = CONTENT_W + PAGE_PAD * 2;
const SWATCH = GRID * 15; // 스와치 한 변 (120)
const COVER_W = GRID * 160; // 커버 폭 (1280)
const COVER_H = GRID * 90; // 커버 높이 (720)
const ARTBOARD_W = GRID * 180; // Pages 데스크톱 아트보드 폭 (1440)
const ARTBOARD_H = GRID * 128; // Pages 데스크톱 아트보드 높이 (1024)
/** 헤어라인 두께 — 그리드 예외 허용 항목 (규격 문서 §2) */
const HAIRLINE = 1;

/** 문서 크롬 타입 스케일 (title/section/group/body/caption) — 12·14는 4pt 서브그리드 허용 */
const TYPE = {
  title: GRID * 5, // 40
  section: GRID * 3, // 24
  group: GRID * 2, // 16
  body: SUB * 3 + 2, // 14 (서브그리드 허용 단)
  caption: SUB * 3, // 12
} as const;

// ---------------------------------------------------------------------------
// 페이지 이름 = 멱등 키 — 규격 문서 §1. 이름이 일치하는 페이지는 비우고 재생성한다.
// ---------------------------------------------------------------------------

const PAGE_NAMES = {
  validation: '✅ Validation',
  cover: '📕 Cover',
  colors: '🎨 Foundations-Colors',
  typography: 'Aa Typography',
  icon: '✦ Icon',
  spacing: '📐 Spacing·Radius·Shadow',
  components: '🧩 Components',
  pages: '📄 Pages',
} as const;

// 페이지 순서의 정본은 spec/doc-pages.ts 의 planDocPages 다(순수 계층 — vitest 가 전수 검사).

/** 각 문서 페이지의 루트 프레임 이름 */
const ROOT_FRAME_NAME = 'TDS Doc';

/** 문서 크롬이 요구하는 필수 Variable — 규격 문서 §10 (없으면 생성 중단) */
const CHROME_VARS = {
  textDefault: 'color/text/default',
  textMuted: 'color/text/muted',
  surfaceDefault: 'color/surface/default',
  surfaceRaised: 'color/surface/raised',
  borderDefault: 'color/border/default',
  borderSubtle: 'color/border/subtle',
  accent: 'color/action/primary/default',
  // 문서 카드 크롬 — 상태 칩(초록) · 인터랙션 매트릭스(하늘) · Resource 패널(회색)
  successSurface: 'color/feedback/success/surface',
  successBorder: 'color/feedback/success/border',
  successText: 'color/feedback/success/text',
  infoSurface: 'color/feedback/info/surface',
  infoBorder: 'color/feedback/info/border',
  skeleton: 'color/surface/skeleton',
} as const;

// ---------------------------------------------------------------------------
// 컴포넌트 스펙 정규화 — generated/<Name>.figma.json 두 형식 모두 수용
// ---------------------------------------------------------------------------

interface DocPropertyRow {
  name: string;
  type: string;
  values: string;
  defaultValue: string;
}

interface DocComponentSpec {
  name: string;
  version: string;
  /** 원자단위 — atom·molecule·organism (디자인 시스템 내부 축) */
  level: string;
  /** 기능 카테고리 — Actions·Inputs·Feedback… 문서 페이지를 이 축으로 묶는다 */
  category: string;
  properties: DocPropertyRow[];
  /** 계약 tokens 블록 — 키 → 토큰 경로(점 표기) */
  tokens: Record<string, string>;
  /**
   * 원본 <Name>.figma.json — 카드 구조 계획(planComponentCard)을 세울 때 속성·상태 정보가 필요하다.
   * 정규화 과정에서 축이 문자열로 뭉개지므로 원본을 그대로 들고 다닌다.
   */
  raw: ComponentFigmaSpec | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

/**
 * <Name>.figma.json → DocComponentSpec.
 *  형식 A (generate-figma.ts 현행 출력): { component, version, properties[], tokens }
 *  형식 B (main.ts sync-component 규격): { name, variantProperties: { P: { values, default } } }
 */
function normalizeComponentSpec(raw: unknown): DocComponentSpec | null {
  if (!isRecord(raw)) return null;

  // 형식 A — properties 배열
  if (Array.isArray(raw['properties'])) {
    const properties: DocPropertyRow[] = [];
    for (const entry of raw['properties']) {
      if (!isRecord(entry)) continue;
      const values = Array.isArray(entry['values'])
        ? (entry['values'] as unknown[]).map(String).join(' · ')
        : Array.isArray(entry['accepts'])
          ? `accepts: ${(entry['accepts'] as unknown[]).map(String).join(' · ')}`
          : '-';
      const flags: string[] = [];
      if (Array.isArray(entry['hiddenWhen']) && entry['hiddenWhen'].length > 0) {
        flags.push(`hiddenWhen: ${(entry['hiddenWhen'] as unknown[]).map(String).join(',')}`);
      }
      if (entry['deprecated'] === true) flags.push('deprecated');
      properties.push({
        name: asString(entry['name'], '?'),
        type: asString(entry['type'], '?'),
        values: flags.length > 0 ? `${values} (${flags.join(' · ')})` : values,
        defaultValue:
          entry['default'] === undefined || entry['default'] === null
            ? '-'
            : String(entry['default']),
      });
    }
    const tokens: Record<string, string> = {};
    if (isRecord(raw['tokens'])) {
      for (const [key, value] of Object.entries(raw['tokens'])) {
        if (typeof value === 'string') tokens[key] = value;
      }
    }
    return {
      name: asString(raw['component'] ?? raw['name'], 'Unknown'),
      version: asString(raw['version'], '-'),
      level: asString(raw['level'], 'atom'),
      category: asString(raw['category'], 'Utilities'),
      properties,
      tokens,
      raw: raw as unknown as ComponentFigmaSpec,
    };
  }

  // 형식 B — variantProperties 레코드
  if (isRecord(raw['variantProperties'])) {
    const properties: DocPropertyRow[] = [];
    for (const [prop, def] of Object.entries(raw['variantProperties'])) {
      if (!isRecord(def)) continue;
      properties.push({
        name: prop,
        type: 'VARIANT',
        values: Array.isArray(def['values'])
          ? (def['values'] as unknown[]).map(String).join(' · ')
          : '-',
        defaultValue: def['default'] === undefined ? '-' : String(def['default']),
      });
    }
    return {
      name: asString(raw['name'], 'Unknown'),
      version: asString(raw['version'], '-'),
      level: asString(raw['level'], 'atom'),
      category: asString(raw['category'], 'Utilities'),
      properties,
      tokens: {},
      raw: raw as unknown as ComponentFigmaSpec,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// 문서 생성 컨텍스트 — Variable 인덱스 · 폰트 캐시 · 경고 수집
// ---------------------------------------------------------------------------

interface DocContext {
  log: string[];
  /** 파일에 실존하는 Variable 인덱스 (이름 → Variable, 대상 컬렉션 한정) */
  vars: Map<string, Variable>;
  chrome: {
    textDefault: Variable;
    textMuted: Variable;
    surfaceDefault: Variable;
    surfaceRaised: Variable;
    borderDefault: Variable;
    borderSubtle: Variable;
    accent: Variable;
    successSurface: Variable;
    successBorder: Variable;
    successText: Variable;
    infoSurface: Variable;
    infoBorder: Variable;
    skeleton: Variable;
  };
  fonts: { regular: FontName; medium: FontName; bold: FontName };
  /** 스펙시먼 폰트 로드 캐시 — 'family|style' → 성공한 FontName (실패 시 Inter 대체) */
  specimenFonts: Map<string, FontName>;
}

function warn(ctx: DocContext, line: string): void {
  ctx.log.push(`[경고] ${line}`);
}

/** SOLID 페인트를 Variable에 바인딩 — 플레이스홀더 0값은 바인딩이 즉시 대체 (Detach 0) */
function boundSolid(variable: Variable): SolidPaint {
  const placeholder: SolidPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  return figma.variables.setBoundVariableForPaint(placeholder, 'color', variable);
}

/** FLOAT 계열 필드 바인딩 시도 — 실패해도 문서 생성은 계속 (값은 이미 적용됨) */
function tryBindField(ctx: DocContext, node: SceneNode, field: string, variable: Variable): void {
  try {
    (node as unknown as { setBoundVariable(field: string, v: Variable): void }).setBoundVariable(
      field,
      variable,
    );
  } catch (error) {
    warn(
      ctx,
      `${field} Variable 바인딩 실패(${variable.name}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- 레이아웃 헬퍼 ----------------------------------------------------------

function stack(direction: 'VERTICAL' | 'HORIZONTAL', spacing: number, name: string): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = spacing;
  frame.fills = []; // 컨테이너는 투명 — 색은 명시 바인딩만
  return frame;
}

/** CONTENT_W 고정 폭의 가로 WRAP 컨테이너 (스와치/카드 나열용) */
function wrapRow(name: string): FrameNode {
  const frame = stack('HORIZONTAL', CARD_GAP, name);
  // WRAP 3조건: HORIZONTAL + layoutWrap + **주축 고정 폭**. 폭은 STRETCH 로 부모에게서 받는다
  fillWidth(frame);
  frame.primaryAxisSizingMode = 'FIXED';
  // counterAxisSpacing은 layoutWrap=WRAP에서만 유효 — 순서 고정
  frame.layoutWrap = 'WRAP';
  frame.counterAxisSpacing = CARD_GAP;
  return frame;
}

/**
 * 부모 폭을 채운다 — **FILL 의 유일한 레시피**.
 *
 * `layoutAlign='STRETCH'` 만 쓰고 **width 를 resize 하지 않는다**. 두 방식을 섞으면
 * (STRETCH + resize) 고정 폭과 채움이 동시에 걸려 hug/fill 모순이 된다 — 실제로 그게
 * 카드 폭이 제각각이 된 뿌리였다. 부모의 counter axis 는 이 사슬에서 항상 FIXED 다.
 */
function fillWidth<T extends SceneNode & { layoutAlign: BaseFrameMixin['layoutAlign'] }>(
  node: T,
): T {
  node.layoutAlign = 'STRETCH';
  return node;
}

/**
 * 오토레이아웃 프레임에 **폭만** 고정한다 — 폭 고정의 유일한 레시피(`fillWidth` 가 FILL 의
 * 유일한 레시피인 것과 같은 자리).
 *
 * > **[지뢰] `resize()` 는 두 축의 사이징 모드를 전부 FIXED 로 뒤집는다.** 그래서 예전의
 * > `frame.resize(W, frame.height)` 관용구는 폭만 주는 것이 아니라 **높이를 그 순간의
 * > `frame.height` 에 못박았다.** `createFrame()` 직후의 높이는 **100** 이므로 사실상 모든
 * > 문서 프레임이 100px 높이로 잠겼고, `clipsContent` 기본값이 true 라 내용이 바닥에서
 * > 잘렸다. WRAP 행에서는 다음 줄이 +100px 에 앉아 윗줄과 겹쳤다 — 오너 화면에서 카드 캡션이
 * > 잘리고 ConfirmDialog 제목이 윗 내용과 합성돼 보인 원인이 전부 이 한 줄이다.
 * > (plugin-build-rules §10)
 *
 * 그래서 resize 뒤에 **주축 사이징 모드를 AUTO 로 되돌려** 높이는 내용만큼 자라게 한다.
 * 높이도 정말로 고정하고 싶은 자리(체커보드·아트보드)는 이 헬퍼를 쓰지 말고 `resize(W, H)` 로
 * **두 값을 다 적는다** — 의도가 코드에 드러나야 한다.
 */
function setWidth(frame: FrameNode, width: number): FrameNode {
  frame.resize(width, frame.height);
  if (frame.layoutMode === 'VERTICAL') {
    // 세로 스택: 주축이 높이다 — 내용만큼 자라야 한다. 폭(교차축)만 고정으로 남긴다.
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
  } else if (frame.layoutMode === 'HORIZONTAL') {
    // 가로 스택: 주축이 폭이다 — 폭을 고정하고 높이(교차축)는 내용만큼.
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'AUTO';
  }
  return frame;
}

interface TextOptions {
  size: number;
  font?: FontName;
  colorVar?: Variable;
  /** 지정 시 고정 폭 + 높이 자동 (표 셀용) */
  width?: number;
}

function makeText(ctx: DocContext, content: string, options: TextOptions): TextNode {
  const node = figma.createText();
  node.fontName = options.font ?? ctx.fonts.regular;
  node.characters = content;
  node.fontSize = options.size;
  node.fills = [boundSolid(options.colorVar ?? ctx.chrome.textDefault)];
  if (options.width !== undefined) {
    node.textAutoResize = 'HEIGHT';
    node.resize(options.width, node.height);
  }
  return node;
}

/** CONTENT_W 폭 헤어라인 — color/border/default 바인딩 (그리드 예외 §2) */
function hairline(ctx: DocContext, width: number): LineNode {
  const line = figma.createLine();
  line.resize(width, 0);
  line.strokes = [boundSolid(ctx.chrome.borderDefault)];
  line.strokeWeight = HAIRLINE;
  return line;
}

/** 섹션 헤더 — 24 Semibold(Bold 폰트 사용) + 헤어라인 (규격 문서 §9) */
function sectionHeader(ctx: DocContext, title: string): FrameNode {
  const frame = stack('VERTICAL', SUB * 2, `Section — ${title}`);
  frame.appendChild(makeText(ctx, title, { size: TYPE.section, font: ctx.fonts.bold }));
  frame.appendChild(hairline(ctx, CONTENT_W));
  return frame;
}

/** 그룹(하위) 헤더 — 16 Medium, 헤어라인 없음 */
function groupHeader(ctx: DocContext, title: string): TextNode {
  return makeText(ctx, title, { size: TYPE.group, font: ctx.fonts.medium });
}

// ---------------------------------------------------------------------------
// 페이지 확보/재생성 (멱등) — 이름 매칭 → 자식 전부 제거 → 루트 프레임 재구축
// ---------------------------------------------------------------------------

async function ensurePage(name: string): Promise<PageNode> {
  // 식별은 표시명(순번 접두어 '5. ' 가 붙을 수 있음)이 아니라 tdsBase 키로 — 순번 부여와 멱등성 양립.
  // 사용자가 페이지를 복제하면 pluginData 까지 복사돼 같은 키가 둘이 된다. 첫 장만 쓰고 나머지는
  // 표식을 떼어 **사용자 페이지로 넘긴다** — 안 그러면 정리 단계가 사용자의 사본을 지운다.
  const matches = figma.root.children.filter((p) => p.getPluginData('tdsBase') === name);
  let page = matches[0];
  for (const extra of matches.slice(1)) {
    extra.setPluginData('tdsDoc', '');
    extra.setPluginData('tdsBase', '');
  }
  if (!page) {
    page = figma.createPage();
    page.name = name;
  }
  await page.loadAsync();
  for (const child of [...page.children]) {
    child.remove();
  }
  page.setPluginData('tdsBase', name); // 순번과 무관한 안정 식별자
  page.setPluginData('tdsDoc', '1'); // 우리가 만든 페이지 표식 — 재생성 시 옛 페이지 정리에 쓴다
  return page;
}

/** 문서 페이지 공통 루트 — 세로 AL, surface/default 배경, PAGE_PAD 패딩 */
function buildRoot(ctx: DocContext, page: PageNode): FrameNode {
  const root = stack('VERTICAL', SECTION_GAP, ROOT_FRAME_NAME);
  root.fills = [boundSolid(ctx.chrome.surfaceDefault)];
  // 고정 폭 사슬의 시작 — 여기가 AUTO 면 아래 모든 STRETCH 가 무효가 된다
  root.counterAxisSizingMode = 'FIXED';
  setWidth(root, PAGE_W);
  root.paddingTop = PAGE_PAD;
  root.paddingBottom = PAGE_PAD;
  root.paddingLeft = PAGE_PAD;
  root.paddingRight = PAGE_PAD;
  root.x = 0;
  root.y = 0;
  page.appendChild(root);
  return root;
}

// ---------------------------------------------------------------------------
// 0. ✅ Validation — 산출물 자기 검사 결과 (문서 맨 앞장)
//
// 이 한 장만 열어도 "이번 생성이 성공했는가"를 판단할 수 있어야 한다.
// 결함을 사람이 스크린샷으로 찾아야 했던 것이 이 페이지가 생긴 이유다.
// ---------------------------------------------------------------------------

/** sync-components 가 남긴 자기 검사 결과 */
interface SelfCheckRecord {
  at: string;
  contracts: number;
  built: number;
  buildFailed: number;
  failures: Array<{ component: string; check: string; node: string; reason: string }>;
  failureTotal: number;
}

function readSelfCheck(): SelfCheckRecord | null {
  const raw = figma.root.getPluginData('tdsSelfCheck');
  if (raw.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const r = parsed as Partial<SelfCheckRecord>;
    return {
      at: typeof r.at === 'string' ? r.at : '',
      contracts: typeof r.contracts === 'number' ? r.contracts : 0,
      built: typeof r.built === 'number' ? r.built : 0,
      buildFailed: typeof r.buildFailed === 'number' ? r.buildFailed : 0,
      failures: Array.isArray(r.failures) ? r.failures : [],
      failureTotal: typeof r.failureTotal === 'number' ? r.failureTotal : 0,
    };
  } catch {
    return null;
  }
}

/** 큰 판정 배너 — 통과면 초록, 실패면 빨강. 멀리서도 읽히는 크기로 둔다. */
function verdictBanner(ctx: DocContext, ok: boolean, headline: string, detail: string): FrameNode {
  const banner = stack('VERTICAL', GRID, 'Verdict');
  fillWidth(banner);
  banner.primaryAxisSizingMode = 'AUTO';
  banner.counterAxisSizingMode = 'FIXED';
  banner.paddingTop = GRID * 3;
  banner.paddingBottom = GRID * 3;
  banner.paddingLeft = GRID * 3;
  banner.paddingRight = GRID * 3;
  banner.cornerRadius = GRID;
  banner.fills = [boundSolid(ok ? ctx.chrome.successSurface : ctx.chrome.infoSurface)];
  banner.strokes = [boundSolid(ok ? ctx.chrome.successBorder : ctx.chrome.infoBorder)];
  banner.strokeWeight = HAIRLINE;
  banner.strokeAlign = 'INSIDE';
  banner.appendChild(
    makeText(ctx, headline, {
      size: TYPE.title,
      font: ctx.fonts.bold,
      colorVar: ok ? ctx.chrome.successText : ctx.chrome.textDefault,
      width: CONTENT_W - GRID * 6,
    }),
  );
  banner.appendChild(
    makeText(ctx, detail, {
      size: TYPE.body,
      colorVar: ok ? ctx.chrome.successText : ctx.chrome.textDefault,
      width: CONTENT_W - GRID * 6,
    }),
  );
  return banner;
}

/** 숫자 타일 한 칸 */
function statTile(ctx: DocContext, label: string, value: string): FrameNode {
  const tile = stack('VERTICAL', SUB, 'Stat — ' + label);
  setWidth(tile, GRID * 26);
  tile.paddingTop = GRID * 2;
  tile.paddingBottom = GRID * 2;
  tile.paddingLeft = GRID * 2;
  tile.paddingRight = GRID * 2;
  tile.cornerRadius = SUB;
  tile.fills = [boundSolid(ctx.chrome.surfaceRaised)];
  tile.strokes = [boundSolid(ctx.chrome.borderDefault)];
  tile.strokeWeight = HAIRLINE;
  tile.strokeAlign = 'INSIDE';
  tile.appendChild(
    makeText(ctx, value, { size: TYPE.section, font: ctx.fonts.bold, width: GRID * 22 }),
  );
  tile.appendChild(
    makeText(ctx, label, { size: TYPE.caption, colorVar: ctx.chrome.textMuted, width: GRID * 22 }),
  );
  return tile;
}

/**
 * 견본 — **실제 Component Set 의 인스턴스**를 놓는다. 그림이 아니라 진짜 노드라서,
 * 컴포넌트가 비어 있으면 이 칸도 비어 보인다(그게 목적이다).
 */
function specimenRow(ctx: DocContext, setName: string, limit: number): FrameNode {
  const row = wrapRow('Specimen — ' + setName);
  const set = figma.root.findOne((n) => n.type === 'COMPONENT_SET' && n.name === setName);
  if (set && set.type === 'COMPONENT_SET') {
    let placed = 0;
    for (const child of set.children) {
      if (placed >= limit) break;
      if (child.type !== 'COMPONENT') continue;
      const cell = stack('VERTICAL', SUB, 'Cell — ' + child.name);
      cell.appendChild(child.createInstance());
      cell.appendChild(
        makeText(ctx, child.name, { size: TYPE.caption, colorVar: ctx.chrome.textMuted }),
      );
      row.appendChild(cell);
      placed += 1;
    }
    return row;
  }
  const single = figma.root.findOne(
    (n) => n.type === 'COMPONENT' && n.name === setName && n.parent?.type !== 'COMPONENT_SET',
  );
  if (single && single.type === 'COMPONENT') {
    row.appendChild(single.createInstance());
    return row;
  }
  row.appendChild(
    makeText(ctx, setName + ' 없음 — ② Component Set 동기화를 먼저 실행하세요.', {
      size: TYPE.caption,
      colorVar: ctx.chrome.textMuted,
      width: CONTENT_W,
    }),
  );
  return row;
}

/** 견본으로 보여 줄 컴포넌트 — 사용자가 아침에 눈으로 확인하겠다고 지목한 것들 */
const SPECIMEN_COMPONENTS: ReadonlyArray<{ name: string; limit: number }> = [
  { name: 'Button', limit: 8 },
  { name: 'TextField', limit: 4 },
  { name: 'Checkbox', limit: 4 },
  { name: 'ToggleSwitch', limit: 4 },
  { name: 'Tabs', limit: 4 },
  { name: 'SegmentedControl', limit: 4 },
  { name: 'StatusBadge', limit: 6 },
  { name: 'Icon', limit: 24 },
];

function buildValidationPage(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const root = buildRoot(ctx, page);
  const record = readSelfCheck();

  root.appendChild(sectionHeader(ctx, '✅ Validation — 산출물 자기 검사'));

  if (record === null) {
    root.appendChild(
      verdictBanner(
        ctx,
        false,
        '검사 기록 없음',
        'Component Set 동기화(②)를 아직 실행하지 않았습니다. 실행 순서: ① Variables → ② Component Set → ③ TDS 문서.',
      ),
    );
    ctx.log.push('검증 페이지: 자기 검사 기록 없음');
    return;
  }

  const total = record.failureTotal + record.buildFailed;
  const ok = total === 0;
  root.appendChild(
    verdictBanner(
      ctx,
      ok,
      ok ? '통과 — 실패 0건' : '실패 ' + String(total) + '건',
      ok
        ? '계약 ' +
            String(record.contracts) +
            '건이 모두 조립됐고 텍스트·변형·레이아웃·토큰 바인딩·슬롯 검사에서 실패가 없습니다.'
        : '아래 항목은 피그마에서 비어 보이거나 계약과 어긋납니다. 원인을 고치고 다시 생성하세요.',
    ),
  );

  // --- 숫자 요약 ---
  const stats = wrapRow('Stats');
  stats.appendChild(statTile(ctx, '계약', String(record.contracts)));
  stats.appendChild(statTile(ctx, '조립 성공', String(record.built)));
  stats.appendChild(statTile(ctx, '조립 실패', String(record.buildFailed)));
  stats.appendChild(statTile(ctx, '자기 검사 실패', String(record.failureTotal)));
  root.appendChild(stats);

  // --- 항목별 집계 + 실패 목록 ---
  if (record.failures.length > 0) {
    const byCheck = new Map<string, number>();
    for (const f of record.failures) byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + 1);
    const summary: string[] = [];
    for (const [key, count] of byCheck) summary.push(key + ' ' + String(count) + '건');
    root.appendChild(
      makeText(ctx, '항목별: ' + summary.join(' · '), {
        size: TYPE.body,
        font: ctx.fonts.medium,
        width: CONTENT_W,
      }),
    );
    const list = stack('VERTICAL', SUB, 'Failures');
    for (const f of record.failures.slice(0, 60)) {
      list.appendChild(
        makeText(ctx, '[' + f.check + '] ' + f.component + ' › ' + f.node + ' — ' + f.reason, {
          size: TYPE.caption,
          colorVar: ctx.chrome.textMuted,
          width: CONTENT_W,
        }),
      );
    }
    if (record.failureTotal > 60) {
      list.appendChild(
        makeText(ctx, '… 외 ' + String(record.failureTotal - 60) + '건', {
          size: TYPE.caption,
          colorVar: ctx.chrome.textMuted,
          width: CONTENT_W,
        }),
      );
    }
    root.appendChild(list);
  }

  // --- 견본 — 실제 인스턴스 ---
  root.appendChild(sectionHeader(ctx, '견본 — 실제 컴포넌트 인스턴스'));
  root.appendChild(
    makeText(
      ctx,
      '아래는 그림이 아니라 실제 Component Set 의 인스턴스입니다. 비어 보이면 그 컴포넌트가 실제로 비어 있는 것입니다.',
      { size: TYPE.body, colorVar: ctx.chrome.textMuted, width: CONTENT_W },
    ),
  );
  for (const specimen of SPECIMEN_COMPONENTS) {
    root.appendChild(groupHeader(ctx, specimen.name));
    root.appendChild(specimenRow(ctx, specimen.name, specimen.limit));
  }

  // --- 상태 축 커버리지 ---
  // 왜 어떤 컴포넌트에는 State 축이 있고 어떤 것에는 없는지를 여기서 밝힌다.
  // (안 밝히면 디자이너가 피그마를 열고 그 질문을 하게 된다)
  root.appendChild(sectionHeader(ctx, '상태(State) 축'));
  const specs = (payload.components ?? []).filter(
    (raw): raw is ComponentFigmaSpec => typeof raw === 'object' && raw !== null,
  );
  const withState: string[] = [];
  const withoutState: string[] = [];
  for (const spec of specs) {
    const hasAxis = (spec.properties ?? []).some((p) => p.type === 'VARIANT' && p.name === 'State');
    const hasStates = Array.isArray(spec.states) && spec.states.length > 1;
    if (hasAxis) withState.push(spec.name);
    else if (hasStates) withoutState.push(spec.name);
  }
  root.appendChild(
    makeText(
      ctx,
      '상태 축 생성 ' +
        String(withState.length) +
        '개' +
        (withState.length > 0 ? ' (' + withState.join(', ') + ')' : '') +
        ' · 미생성 ' +
        String(withoutState.length) +
        '개',
      { size: TYPE.body, font: ctx.fonts.medium, width: CONTENT_W },
    ),
  );
  root.appendChild(
    makeText(
      ctx,
      '미생성 사유: 그 계약에는 상태별로 달라지는 토큰이나 부위가 없어, 변형을 만들어도 ' +
        '기본 상태와 픽셀이 같습니다. 구분되지 않는 변형은 만들지 않습니다 — ' +
        '대상: ' +
        (withoutState.length > 0 ? withoutState.join(', ') : '없음'),
      { size: TYPE.caption, colorVar: ctx.chrome.textMuted, width: CONTENT_W },
    ),
  );

  // --- Variables ---
  root.appendChild(sectionHeader(ctx, 'Variables'));
  root.appendChild(
    makeText(ctx, '토큰 Variable ' + String(ctx.vars.size) + '개가 이 파일에 존재합니다.', {
      size: TYPE.body,
      width: CONTENT_W,
    }),
  );

  ctx.log.push(
    '검증 페이지: ' +
      (ok ? '통과' : '실패 ' + String(total) + '건') +
      ' (계약 ' +
      String(record.contracts) +
      '건)',
  );
}

// ---------------------------------------------------------------------------
// 1. 📕 Cover — 규격 문서 §3
// ---------------------------------------------------------------------------

function buildCover(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const cover = stack('VERTICAL', GRID * 4, ROOT_FRAME_NAME);
  cover.fills = [boundSolid(ctx.chrome.surfaceDefault)];
  cover.resize(COVER_W, COVER_H);
  cover.primaryAxisSizingMode = 'FIXED';
  cover.counterAxisSizingMode = 'FIXED';
  cover.paddingTop = GRID * 10;
  cover.paddingBottom = GRID * 10;
  cover.paddingLeft = GRID * 10;
  cover.paddingRight = GRID * 10;
  cover.x = 0;
  cover.y = 0;
  page.appendChild(cover);

  // 액센트 바 — color/action/primary/default
  const accentBar = figma.createFrame();
  accentBar.name = 'Accent';
  accentBar.resize(GRID * 16, GRID);
  accentBar.fills = [boundSolid(ctx.chrome.accent)];
  cover.appendChild(accentBar);

  cover.appendChild(makeText(ctx, 'TDS 디자인 시스템', { size: TYPE.title, font: ctx.fonts.bold }));
  cover.appendChild(
    makeText(ctx, 'TDS Documentation — Figma 미러 (Storybook과 동일 원천)', {
      size: TYPE.group,
      colorVar: ctx.chrome.textMuted,
    }),
  );

  const generatedAt = payload.meta?.generatedAt ?? new Date().toISOString().slice(0, 10);
  const meta = stack('VERTICAL', GRID, 'Meta');
  const lines = [
    `버전: ${payload.meta?.version ?? '-'}`,
    `생성일: ${generatedAt}`,
    'SSOT: tokens/tokens.json · contracts/<Name>.contract.json',
    '생성기: tools/figma-plugin (Design System Admin Hub) — pnpm codegen 산출물만 입력',
  ];
  for (const line of lines) {
    meta.appendChild(makeText(ctx, line, { size: TYPE.body, colorVar: ctx.chrome.textMuted }));
  }
  cover.appendChild(meta);
}

// ---------------------------------------------------------------------------
// 2. 🎨 Foundations-Colors — 규격 문서 §4
// ---------------------------------------------------------------------------

/** COLOR Variable을 규격 §4의 그룹 키로 분류 — 대상 아님이면 null */
function colorGroupOf(name: string): string | null {
  const parts = name.split('/');
  if (parts[0] === 'color' && parts.length >= 2) return `Semantic — color/${parts[1]}`;
  if (parts[0] === 'primitive' && parts[1] === 'color' && parts.length >= 3) {
    return `Primitive — primitive/color/${parts[2]}`;
  }
  if (parts[0] === 'component' && parts.length >= 2) return `Component — component/${parts[1]}`;
  return null;
}

/** 스와치 카드 — 120×120 바인딩 fill + 토큰 경로·hex·변수명(·alias) 라벨 */
function swatchCard(ctx: DocContext, spec: TdsTokenVariable, variable: Variable): FrameNode {
  const card = stack('VERTICAL', SUB, `Swatch — ${spec.name}`);

  const chip = figma.createFrame();
  chip.name = 'Chip';
  chip.resize(SWATCH, SWATCH);
  chip.fills = [boundSolid(variable)];
  chip.strokes = [boundSolid(ctx.chrome.borderDefault)];
  chip.strokeWeight = HAIRLINE;
  const radiusSm = ctx.vars.get('radius/sm');
  if (radiusSm) {
    for (const corner of [
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
    ]) {
      tryBindField(ctx, chip, corner, radiusSm);
    }
  }
  card.appendChild(chip);

  const tokenPath = spec.name.split('/').join('.');
  card.appendChild(
    makeText(ctx, tokenPath, { size: TYPE.caption, font: ctx.fonts.medium, width: SWATCH }),
  );
  card.appendChild(
    makeText(ctx, String(spec.value), {
      size: TYPE.caption,
      colorVar: ctx.chrome.textMuted,
      width: SWATCH,
    }),
  );
  card.appendChild(
    makeText(ctx, spec.name, { size: TYPE.caption, colorVar: ctx.chrome.textMuted, width: SWATCH }),
  );
  if (spec.alias !== undefined) {
    card.appendChild(
      makeText(ctx, `→ ${spec.alias}`, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
        width: SWATCH,
      }),
    );
  }
  return card;
}

function buildColorsPage(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const root = buildRoot(ctx, page);
  root.appendChild(sectionHeader(ctx, 'Foundations — Colors'));

  // 그룹 순서는 페이로드 등장 순서(= tokens.json 순서) 유지
  const groups = new Map<string, TdsTokenVariable[]>();
  let missing = 0;
  for (const spec of payload.tokens.variables) {
    if (spec.type !== 'COLOR') continue;
    const group = colorGroupOf(spec.name);
    if (group === null) continue;
    if (!ctx.vars.has(spec.name)) {
      missing += 1;
      continue;
    }
    const list = groups.get(group) ?? [];
    list.push(spec);
    groups.set(group, list);
  }
  if (missing > 0) {
    warn(
      ctx,
      `파일에 없는 COLOR Variable ${missing}개 — 스와치 생략. '토큰 → Variables 동기화'를 먼저 실행하세요.`,
    );
  }

  for (const [group, specs] of groups) {
    const section = stack('VERTICAL', CARD_GAP, group);
    section.appendChild(groupHeader(ctx, group));
    const row = wrapRow('Swatches');
    for (const spec of specs) {
      const variable = ctx.vars.get(spec.name);
      if (variable) row.appendChild(swatchCard(ctx, spec, variable));
    }
    section.appendChild(row);
    root.appendChild(section);
  }
  ctx.log.push(`컬러 페이지: 그룹 ${groups.size}개 렌더링`);
}

// ---------------------------------------------------------------------------
// 3. Aa Typography — 규격 문서 §5
// ---------------------------------------------------------------------------

/** 토큰 fontWeight 값 → Figma 스타일명 (Inter/Pretendard 공통 관례) */
function styleForWeight(weight: number): string {
  if (weight >= 700) return 'Bold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

/** 스펙시먼 폰트 로드 — 미설치 시 Inter로 대체하고 경고 (규격 §5.2) */
async function loadSpecimenFont(ctx: DocContext, family: string, style: string): Promise<FontName> {
  const key = `${family}|${style}`;
  const cached = ctx.specimenFonts.get(key);
  if (cached) return cached;
  let font: FontName = { family, style };
  try {
    await figma.loadFontAsync(font);
  } catch {
    warn(ctx, `폰트 미설치: ${family} ${style} — Inter로 대체 (fontFamily 바인딩 생략)`);
    font =
      style === 'Bold' ? ctx.fonts.bold : style === 'Medium' ? ctx.fonts.medium : ctx.fonts.regular;
  }
  ctx.specimenFonts.set(key, font);
  return font;
}

interface TypeRampEntry {
  prefix: string; // 예: 'typography/label/md'
  fontSize?: TdsTokenVariable;
  fontWeight?: TdsTokenVariable;
  lineHeight?: TdsTokenVariable;
  fontFamily?: TdsTokenVariable;
}

function collectTypeRamp(payload: TdsDocPayload): TypeRampEntry[] {
  const byPrefix = new Map<string, TypeRampEntry>();
  const RAMP_RE = /^(typography\/.+)\/(font-size|font-weight|line-height|font-family)$/;
  for (const spec of payload.tokens.variables) {
    const match = RAMP_RE.exec(spec.name);
    if (!match || match[1] === undefined || match[2] === undefined) continue;
    const prefix = match[1];
    const entry = byPrefix.get(prefix) ?? { prefix };
    if (match[2] === 'font-size') entry.fontSize = spec;
    else if (match[2] === 'font-weight') entry.fontWeight = spec;
    else if (match[2] === 'line-height') entry.lineHeight = spec;
    else entry.fontFamily = spec;
    byPrefix.set(prefix, entry);
  }
  return [...byPrefix.values()].filter((entry) => entry.fontSize !== undefined);
}

async function buildTypographyPage(
  ctx: DocContext,
  page: PageNode,
  payload: TdsDocPayload,
): Promise<void> {
  const root = buildRoot(ctx, page);

  // 5.1 폰트 컬러 — color/text/*
  root.appendChild(sectionHeader(ctx, '폰트 컬러 — color/text/*'));
  const fontColors = stack('VERTICAL', GRID * 2, 'Font Colors');
  for (const spec of payload.tokens.variables) {
    if (spec.type !== 'COLOR' || !spec.name.startsWith('color/text/')) continue;
    const variable = ctx.vars.get(spec.name);
    if (!variable) continue;
    const row = stack('HORIZONTAL', CARD_GAP, `FontColor — ${spec.name}`);
    row.counterAxisAlignItems = 'CENTER';
    row.appendChild(
      makeText(ctx, '가나다라 ABC 0123', {
        size: TYPE.group,
        colorVar: variable,
        width: GRID * 30,
      }),
    );
    row.appendChild(
      makeText(ctx, `${spec.name.split('/').join('.')} · ${String(spec.value)} · ${spec.name}`, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
      }),
    );
    fontColors.appendChild(row);
    fontColors.appendChild(hairline(ctx, CONTENT_W));
  }
  root.appendChild(fontColors);

  // 5.2 타이포 스펙시먼 램프
  root.appendChild(sectionHeader(ctx, '타이포그래피 램프 — typography/*'));
  const rampSection = stack('VERTICAL', CARD_GAP, 'Type Ramp');
  for (const entry of collectTypeRamp(payload)) {
    const sizeValue = typeof entry.fontSize?.value === 'number' ? entry.fontSize.value : TYPE.group;
    const weightValue = typeof entry.fontWeight?.value === 'number' ? entry.fontWeight.value : 400;
    const lineHeightValue =
      typeof entry.lineHeight?.value === 'number' ? entry.lineHeight.value : undefined;
    const familyStack = typeof entry.fontFamily?.value === 'string' ? entry.fontFamily.value : '';
    const firstFamily = familyStack.split(',')[0]?.trim() ?? '';

    const style = styleForWeight(weightValue);
    const font =
      firstFamily.length > 0
        ? await loadSpecimenFont(ctx, firstFamily, style)
        : style === 'Bold'
          ? ctx.fonts.bold
          : style === 'Medium'
            ? ctx.fonts.medium
            : ctx.fonts.regular;

    const row = stack('VERTICAL', SUB * 2, `Ramp — ${entry.prefix}`);
    const specimen = makeText(ctx, '한글 타이포그래피 Ag 0123', { size: sizeValue, font });
    if (lineHeightValue !== undefined) {
      // 배수형 line-height는 Variable(px 해석)과 단위 불일치 — PERCENT 적용 (규격 §5.2 예외)
      specimen.lineHeight =
        lineHeightValue < 4
          ? { unit: 'PERCENT', value: lineHeightValue * 100 }
          : { unit: 'PIXELS', value: lineHeightValue };
    }
    if (entry.fontSize) {
      const sizeVar = ctx.vars.get(entry.fontSize.name);
      if (sizeVar) tryBindField(ctx, specimen, 'fontSize', sizeVar);
    }
    if (entry.fontWeight) {
      const weightVar = ctx.vars.get(entry.fontWeight.name);
      if (weightVar) tryBindField(ctx, specimen, 'fontWeight', weightVar);
    }
    row.appendChild(specimen);

    const metaParts = [
      entry.prefix.split('/').join('.'),
      `size ${String(sizeValue)}`,
      `weight ${String(weightValue)}`,
      ...(lineHeightValue !== undefined ? [`lh ${String(lineHeightValue)}`] : []),
      ...(familyStack.length > 0 ? [familyStack] : []),
    ];
    row.appendChild(
      makeText(ctx, metaParts.join(' · '), { size: TYPE.caption, colorVar: ctx.chrome.textMuted }),
    );
    row.appendChild(hairline(ctx, CONTENT_W));
    rampSection.appendChild(row);
  }
  root.appendChild(rampSection);

  // 5.3 폰트 패밀리 — primitive/typography/font-family/*
  root.appendChild(sectionHeader(ctx, '폰트 패밀리 — primitive/typography/font-family/*'));
  const familySection = stack('VERTICAL', GRID, 'Font Families');
  for (const spec of payload.tokens.variables) {
    if (!spec.name.startsWith('primitive/typography/font-family/')) continue;
    familySection.appendChild(
      makeText(ctx, `${spec.name} · ${String(spec.value)}`, {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
      }),
    );
  }
  root.appendChild(familySection);
  ctx.log.push('타이포그래피 페이지: 폰트 컬러 + 램프 + 패밀리 렌더링');
}

// ---------------------------------------------------------------------------
// 3.5 ✦ Icon — 아이콘 세트 카탈로그
//
// 아이콘 목록의 원천은 계약(contracts/Icon.contract.json 의 name enum)이다 — 손으로 적은
// 배열은 두지 않는다. 각 칸은 sync-components 가 만든 **실제 Icon Component Set 의 인스턴스**다.
// 래스터 이미지는 쓰지 않는다.
// ---------------------------------------------------------------------------

/** 아이콘 한 칸의 고정 폭 — 격자가 어긋나지 않게 모든 칸을 같은 폭으로 잡는다 */
const ICON_CELL_W = GRID * 16; // 128

/**
 * 아이콘 한 칸 — 실제 인스턴스(없으면 자리표시 사각형) + 이름 라벨.
 * 이름 라벨은 디자이너가 코드의 name prop 값을 그대로 옮겨 쓸 수 있게 계약 값 그대로 적는다.
 */
function iconCell(
  ctx: DocContext,
  set: IconSet,
  iconName: string,
  variants: Map<string, ComponentNode>,
): FrameNode {
  const cell = stack('VERTICAL', GRID, `Icon — ${iconName}`);
  setWidth(cell, ICON_CELL_W);
  cell.counterAxisAlignItems = 'CENTER';
  cell.paddingTop = GRID * 2;
  cell.paddingBottom = GRID * 2;
  cell.cornerRadius = SUB;
  cell.fills = [boundSolid(ctx.chrome.surfaceRaised)];
  cell.strokes = [boundSolid(ctx.chrome.borderDefault)];
  cell.strokeWeight = HAIRLINE;
  cell.strokeAlign = 'INSIDE';

  const variant = variants.get(iconVariantName(set, iconName)) ?? variants.get(iconName);
  let placed = false;
  if (variant) {
    try {
      cell.appendChild(variant.createInstance());
      placed = true;
    } catch (error) {
      const m = error instanceof Error ? error.message : String(error);
      ctx.log.push(`[아이콘 인스턴스 실패] ${iconName}: ${m}`);
    }
  }
  if (!placed) {
    // Icon 세트가 아직 없을 때의 자리표시 — 토큰 색으로 그린 실제 도형이다(이미지 아님)
    const box = figma.createFrame();
    box.name = `${iconName} (자리표시)`;
    box.resize(GRID * 3, GRID * 3);
    box.cornerRadius = SUB;
    box.fills = [];
    box.strokes = [boundSolid(ctx.chrome.borderDefault)];
    box.strokeWeight = HAIRLINE;
    box.strokeAlign = 'INSIDE';
    cell.appendChild(box);
  }

  cell.appendChild(
    makeText(ctx, iconName, {
      size: TYPE.caption,
      font: ctx.fonts.medium,
      width: ICON_CELL_W - GRID * 2,
    }),
  );
  return cell;
}

/**
 * ✦ Icon 페이지 — 계약이 선언한 아이콘 전량을 이름 라벨과 함께 격자로 늘어놓는다.
 * Icon 계약이 없으면 안내만 남기고 페이지는 유지한다(순서가 흔들리지 않게).
 */
function buildIconPage(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const root = buildRoot(ctx, page);
  const set = extractIconSet(
    (payload.components ?? []).filter(
      (raw): raw is ComponentFigmaSpec => typeof raw === 'object' && raw !== null,
    ),
  );

  if (set === null) {
    root.appendChild(sectionHeader(ctx, 'Icon — 아이콘 세트'));
    root.appendChild(
      makeText(
        ctx,
        'Icon 계약이 없습니다 — contracts/Icon.contract.json 의 name enum 이 원천입니다.',
        {
          size: TYPE.body,
          colorVar: ctx.chrome.textMuted,
        },
      ),
    );
    ctx.log.push('아이콘 페이지: Icon 계약 없음 (안내만 렌더링)');
    return;
  }

  root.appendChild(sectionHeader(ctx, `Icon — 아이콘 ${String(set.names.length)}종`));
  root.appendChild(
    makeText(
      ctx,
      '각 칸은 실제 Icon Component Set 의 인스턴스입니다 — 라벨은 계약의 name 값 그대로입니다.',
      { size: TYPE.body, colorVar: ctx.chrome.textMuted, width: CONTENT_W },
    ),
  );

  // sync-components 가 만든 실제 Icon 세트를 찾아 변형을 색인한다
  const variants = new Map<string, ComponentNode>();
  const iconSet = figma.root.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Icon');
  if (iconSet && iconSet.type === 'COMPONENT_SET') {
    for (const child of iconSet.children) {
      if (child.type === 'COMPONENT') variants.set(child.name, child);
    }
  } else {
    warn(
      ctx,
      'Icon Component Set 이 없습니다 — 자리표시로 그립니다(② Component Set 동기화를 먼저 실행하세요).',
    );
  }

  const grid = wrapRow('Icons');
  for (const iconName of set.names) {
    grid.appendChild(iconCell(ctx, set, iconName, variants));
  }
  root.appendChild(grid);
  ctx.log.push(
    `아이콘 페이지: ${String(set.names.length)}종 렌더링 (실제 인스턴스 ${String(variants.size > 0 ? set.names.length : 0)})`,
  );
}

// ---------------------------------------------------------------------------
// 4. 📐 Spacing·Radius·Shadow — 규격 문서 §6
// ---------------------------------------------------------------------------

function buildSpacingPage(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const root = buildRoot(ctx, page);

  // Spacing — semantic space/* (값 오름차순)
  root.appendChild(sectionHeader(ctx, 'Spacing — space/*'));
  const spacingSection = stack('VERTICAL', GRID * 2, 'Spacing');
  const spaceSpecs = payload.tokens.variables
    .filter((spec) => /^space\//.test(spec.name) && spec.type === 'FLOAT')
    .sort((a, b) => Number(a.value) - Number(b.value));
  for (const spec of spaceSpecs) {
    const value = Number(spec.value);
    const row = stack('HORIZONTAL', CARD_GAP, `Space — ${spec.name}`);
    row.counterAxisAlignItems = 'CENTER';
    row.appendChild(
      makeText(ctx, `${spec.name} · ${String(value)}px`, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
        width: GRID * 30,
      }),
    );
    const bar = figma.createFrame();
    bar.name = 'Bar';
    bar.resize(Math.max(value, HAIRLINE), GRID);
    bar.fills = [boundSolid(ctx.chrome.accent)];
    const spaceVar = ctx.vars.get(spec.name);
    if (spaceVar) tryBindField(ctx, bar, 'width', spaceVar);
    row.appendChild(bar);
    spacingSection.appendChild(row);
  }
  root.appendChild(spacingSection);

  // Radius — radius/* (4코너 Variable 바인딩)
  root.appendChild(sectionHeader(ctx, 'Radius — radius/*'));
  const radiusRow = wrapRow('Radius');
  for (const spec of payload.tokens.variables) {
    if (!/^radius\//.test(spec.name) || spec.type !== 'FLOAT') continue;
    const variable = ctx.vars.get(spec.name);
    const card = stack('VERTICAL', SUB, `Radius — ${spec.name}`);
    const box = figma.createFrame();
    box.name = 'Box';
    box.resize(GRID * 8, GRID * 8);
    box.fills = [boundSolid(ctx.chrome.surfaceRaised)];
    box.strokes = [boundSolid(ctx.chrome.borderDefault)];
    box.strokeWeight = HAIRLINE;
    if (variable) {
      for (const corner of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
      ]) {
        tryBindField(ctx, box, corner, variable);
      }
    }
    card.appendChild(box);
    card.appendChild(
      makeText(ctx, `${spec.name} · ${String(spec.value)}px`, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
      }),
    );
    radiusRow.appendChild(card);
  }
  root.appendChild(radiusRow);

  // Shadow — 현재 tokens.json에 없으면 안내 문구 (규격 §6)
  root.appendChild(sectionHeader(ctx, 'Shadow'));
  const shadowSpecs = payload.tokens.variables.filter((spec) =>
    /^(shadow|elevation)\//.test(spec.name),
  );
  if (shadowSpecs.length === 0) {
    root.appendChild(
      makeText(ctx, 'shadow 토큰 없음 — tokens.json에 추가 시 자동 렌더링', {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
      }),
    );
  } else {
    const shadowSection = stack('VERTICAL', GRID, 'Shadow');
    for (const spec of shadowSpecs) {
      shadowSection.appendChild(
        makeText(ctx, `${spec.name} · ${String(spec.value)}`, {
          size: TYPE.body,
          colorVar: ctx.chrome.textMuted,
        }),
      );
    }
    root.appendChild(shadowSection);
  }

  // Motion — 동일 원천 보너스 섹션 (duration ms · easing cubic-bezier)
  root.appendChild(sectionHeader(ctx, 'Motion — motion/*'));
  const motionSection = stack('VERTICAL', GRID, 'Motion');
  for (const spec of payload.tokens.variables) {
    if (!/^motion\/(duration|easing)\//.test(spec.name)) continue;
    const unit = spec.type === 'FLOAT' ? 'ms' : '';
    motionSection.appendChild(
      makeText(ctx, `${spec.name} · ${String(spec.value)}${unit}`, {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
      }),
    );
  }
  root.appendChild(motionSection);
  ctx.log.push('Spacing·Radius·Shadow 페이지 렌더링 완료');
}

// ---------------------------------------------------------------------------
// 6. 📄 Pages — 규격 문서 §8
// ---------------------------------------------------------------------------

/** 구분선 페이지 이름 — Figma 페이지 목록에서 그룹을 가르는 하이픈 라인 */
const DIVIDER_NAME = '---------';

/**
 * 구분선 페이지를 **새로 만든다**(내용 없음, 이름만). 이름이 모두 '---------' 로 같아 이름으로
 * 재사용/식별할 수 없으므로 매번 fresh 로 만들고, 옛 구분선은 재생성 시 tdsDoc 표식 기반 정리
 * (삭제 후 재생성)가 걷어낸다.
 */
async function createDivider(): Promise<PageNode> {
  const page = figma.createPage();
  page.name = DIVIDER_NAME;
  page.setPluginData('tdsDoc', '1');
  await page.loadAsync();
  return page;
}

/**
 * 화면 한 장의 DS 스킨 스켈레톤 — 앱 셸(사이드바 + 헤더 + 콘텐츠 카드)을 토큰으로 그린다.
 * 빈 아트보드 대신 '앱처럼 보이는' IA 골격을 준다(픽셀 재현이 아니라 구조). 모든 크기는 GRID 배수.
 */
function screenSkeleton(ctx: DocContext, meta: TdsPageMeta): FrameNode {
  const SIDEBAR_W = GRID * 30; // 240
  const MAIN_W = ARTBOARD_W - SIDEBAR_W; // 1200
  const PAD = GRID * 4; // 32

  const board = figma.createFrame();
  board.name =
    meta.name !== undefined && meta.name.length > 0 ? `${meta.name} — ${meta.id}` : meta.id;
  board.layoutMode = 'HORIZONTAL';
  board.primaryAxisSizingMode = 'FIXED';
  board.counterAxisSizingMode = 'FIXED';
  board.resize(ARTBOARD_W, ARTBOARD_H);
  board.itemSpacing = 0;
  board.fills = [boundSolid(ctx.chrome.surfaceDefault)];
  board.strokes = [boundSolid(ctx.chrome.borderDefault)];
  board.strokeWeight = HAIRLINE;
  board.strokeAlign = 'INSIDE';
  board.clipsContent = true;

  // 사이드바 — 고정 폭, nav 자리표시 바(현재 메뉴는 accent)
  const sidebar = stack('VERTICAL', GRID * 2, 'Sidebar');
  sidebar.primaryAxisSizingMode = 'FIXED';
  sidebar.counterAxisSizingMode = 'FIXED';
  sidebar.resize(SIDEBAR_W, ARTBOARD_H);
  sidebar.paddingTop = PAD;
  sidebar.paddingBottom = PAD;
  sidebar.paddingLeft = GRID * 3;
  sidebar.paddingRight = GRID * 3;
  sidebar.fills = [boundSolid(ctx.chrome.surfaceRaised)];
  sidebar.strokes = [boundSolid(ctx.chrome.borderDefault)];
  sidebar.strokeWeight = HAIRLINE;
  sidebar.strokeAlign = 'INSIDE';
  for (let i = 0; i < 8; i += 1) {
    const bar = figma.createFrame();
    bar.name = 'nav-item';
    bar.resize(SIDEBAR_W - GRID * 6, GRID * 3);
    bar.cornerRadius = SUB;
    bar.fills = [boundSolid(i === 1 ? ctx.chrome.accent : ctx.chrome.surfaceDefault)];
    sidebar.appendChild(bar);
  }
  board.appendChild(sidebar);

  // 메인 — 고정 폭, 헤더(제목·경로) + 콘텐츠 카드 자리표시
  const main = stack('VERTICAL', GRID * 3, 'Main');
  main.primaryAxisSizingMode = 'FIXED';
  main.counterAxisSizingMode = 'FIXED';
  main.resize(MAIN_W, ARTBOARD_H);
  main.paddingTop = PAD;
  main.paddingBottom = PAD;
  main.paddingLeft = PAD;
  main.paddingRight = PAD;
  const heading = meta.name !== undefined && meta.name.length > 0 ? meta.name : meta.id;
  main.appendChild(makeText(ctx, heading, { size: TYPE.section, font: ctx.fonts.bold }));
  main.appendChild(makeText(ctx, meta.id, { size: TYPE.body, colorVar: ctx.chrome.textMuted }));
  if (meta.description !== undefined && meta.description.length > 0) {
    main.appendChild(
      makeText(ctx, meta.description, { size: TYPE.body, colorVar: ctx.chrome.textMuted }),
    );
  }
  for (let i = 0; i < 3; i += 1) {
    const card = figma.createFrame();
    card.name = `Card ${String(i + 1)}`;
    card.resize(MAIN_W - PAD * 2, GRID * 12);
    card.cornerRadius = GRID;
    card.fills = [boundSolid(ctx.chrome.surfaceRaised)];
    card.strokes = [boundSolid(ctx.chrome.borderDefault)];
    card.strokeWeight = HAIRLINE;
    card.strokeAlign = 'INSIDE';
    main.appendChild(card);
  }
  board.appendChild(main);

  return board;
}

/**
 * 한 메뉴(= nav 가지)의 화면들을 한 Figma 페이지에 나열한다.
 * 아트보드는 **토큰으로 그린 DS 스켈레톤**이다 — 스크린샷 이미지는 쓰지 않는다.
 */
function buildMenuPage(
  ctx: DocContext,
  page: PageNode,
  menu: string,
  screens: readonly TdsPageMeta[],
): void {
  const root = buildRoot(ctx, page);
  root.appendChild(sectionHeader(ctx, `${menu} — 화면 ${String(screens.length)}개`));
  for (const meta of screens) {
    const label =
      meta.name !== undefined && meta.name.length > 0 ? `${meta.name}  ·  ${meta.id}` : meta.id;
    const block = stack('VERTICAL', GRID * 2, `Screen — ${meta.id}`);
    block.appendChild(makeText(ctx, label, { size: TYPE.group, font: ctx.fonts.medium }));
    block.appendChild(screenSkeleton(ctx, meta));
    root.appendChild(block);
  }
  ctx.log.push(`Pages — ${menu}: 화면 ${String(screens.length)}개 (DS 스켈레톤)`);
}

function buildPagesPage(ctx: DocContext, page: PageNode, payload: TdsDocPayload): void {
  const root = buildRoot(ctx, page);
  root.appendChild(sectionHeader(ctx, 'Pages — Screen Spec 아트보드'));

  const pages = payload.pages ?? [];
  if (pages.length === 0) {
    root.appendChild(
      makeText(
        ctx,
        'pages 메타 없음 — {"$kind":"tds-pages","pages":[{"id":"SCR-001","name":"…"}]} 형식으로 로드하면 1440 아트보드가 생성됩니다.',
        { size: TYPE.body, colorVar: ctx.chrome.textMuted },
      ),
    );
    ctx.log.push('Pages 페이지: 메타 없음 (안내만 렌더링)');
    return;
  }

  for (const meta of pages) {
    const label =
      meta.name !== undefined && meta.name.length > 0 ? `${meta.id} · ${meta.name}` : meta.id;
    const block = stack('VERTICAL', GRID * 2, `Screen — ${meta.id}`);
    block.appendChild(makeText(ctx, label, { size: TYPE.group, font: ctx.fonts.medium }));
    if (meta.description !== undefined && meta.description.length > 0) {
      block.appendChild(
        makeText(ctx, meta.description, { size: TYPE.body, colorVar: ctx.chrome.textMuted }),
      );
    }

    // 1440 데스크톱 아트보드 — 내용은 비워 둔다 (화면 조립은 Figma UI 소유)
    const artboard = figma.createFrame();
    artboard.name =
      meta.name !== undefined && meta.name.length > 0 ? `${meta.id} — ${meta.name}` : meta.id;
    artboard.resize(ARTBOARD_W, ARTBOARD_H);
    artboard.fills = [boundSolid(ctx.chrome.surfaceDefault)];
    artboard.strokes = [boundSolid(ctx.chrome.borderDefault)];
    artboard.strokeWeight = HAIRLINE;
    artboard.clipsContent = true;
    block.appendChild(artboard);
    root.appendChild(block);
  }
  ctx.log.push(`Pages 페이지: 아트보드 ${pages.length}개 렌더링`);
}

// ---------------------------------------------------------------------------
// 엔트리 — 페이로드 검증 → 컨텍스트 구성 → 6개 페이지 생성/재생성 → 정렬
// ---------------------------------------------------------------------------

/**
 * 기능 카테고리 표준 순서 — main.ts 의 COMPONENT_CATEGORY_ORDER 와 반드시 같아야 한다.
 * 페이지 base 는 `🧩 Components — <카테고리>` 규칙(main.ts categoryPageName)과 1:1.
 */
const COMPONENT_CATEGORIES = [
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
];
const COMPONENT_PAGE_ORDER = COMPONENT_CATEGORIES.map((c) => `🧩 Components — ${c}`);
/** 페이지 base → 계약 category */
const COMPONENT_PAGE_CATEGORY: Record<string, string> = {};
for (const c of COMPONENT_CATEGORIES) COMPONENT_PAGE_CATEGORY[`🧩 Components — ${c}`] = c;
/** sync-components 가 INSTANCE_SWAP 기본값용으로 만든 더미 — 정렬에서 제외한다 */
const SWAP_PLACEHOLDER_NAME = '↔ Swap Placeholder';

/** 토큰 용도 분류 — 경로 접두어로 가른다(색상/타이포/간격/모서리/그림자) */
const TOKEN_GROUPS: Array<{ label: string; prefix: string }> = [
  { label: '색상 · Color', prefix: 'color.' },
  { label: '타이포그래피 · Typography', prefix: 'typography.' },
  { label: '간격 · Spacing', prefix: 'space.' },
  { label: '모서리 · Radius', prefix: 'radius.' },
  { label: '그림자 · Shadow', prefix: 'shadow.' },
];
const TOKEN_OTHER = '기타 · Other';
function tokenGroupLabel(path: string): string {
  for (const g of TOKEN_GROUPS) if (path.indexOf(g.prefix) === 0) return g.label;
  return TOKEN_OTHER;
}

// ---------------------------------------------------------------------------
// 오너 정본 분류표 체크리스트 — 카테고리 페이지 상단(안내문 다음, 시트 앞)
// ---------------------------------------------------------------------------

/** 체크리스트 열 폭 — tokenRow/TOKEN_COL_W 와 같은 방식(합계 ≤ CONTENT_W) */
const TAXO_COL_W = { item: GRID * 60, status: GRID * 20, component: GRID * 54 };

const TAXO_DONE = '✅ 구현';
const TAXO_TODO = '⬜ 미구현';

/** 알 수 없는 payload 를 방어적으로 검증한다 — 형식이 어긋나면 조용히 버린다(문서 생성은 계속) */
function normalizeTaxonomy(raw: unknown): TdsTaxonomyCategory[] {
  if (!Array.isArray(raw)) return [];
  const out: TdsTaxonomyCategory[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const rec = entry as Record<string, unknown>;
    if (typeof rec.name !== 'string' || rec.name.length === 0) continue;
    const items: TdsTaxonomyItem[] = [];
    if (Array.isArray(rec.items)) {
      for (const it of rec.items) {
        if (typeof it !== 'object' || it === null) continue;
        const ir = it as Record<string, unknown>;
        if (typeof ir.name !== 'string' || ir.name.length === 0) continue;
        items.push({
          key: typeof ir.key === 'string' ? ir.key : '',
          name: ir.name,
          component:
            typeof ir.component === 'string' && ir.component.length > 0 ? ir.component : null,
        });
      }
    }
    const extras: string[] = Array.isArray(rec.extras)
      ? rec.extras.filter((e): e is string => typeof e === 'string' && e.length > 0)
      : [];
    out.push({
      no: typeof rec.no === 'number' && isFinite(rec.no) ? rec.no : 0,
      name: rec.name,
      key: typeof rec.key === 'string' ? rec.key : '',
      label: typeof rec.label === 'string' ? rec.label : '',
      ...(typeof rec.description === 'string' ? { description: rec.description } : {}),
      items,
      extras,
    });
  }
  return out;
}

/** 오너 번호 2자리 zero-pad — 0(미지정)이면 빈 문자열 */
function taxoNo(no: number): string {
  if (no <= 0) return '';
  return no < 10 ? `0${String(no)}` : String(no);
}

/** 카테고리 페이지 섹션 헤더 문구 — `01. Actions (액션) — 컴포넌트 3개` */
function categoryHeading(
  category: string,
  taxo: TdsTaxonomyCategory | null,
  count: number,
): string {
  const tail = `컴포넌트 ${String(count)}개`;
  if (!taxo) return `${category} — ${tail}`;
  const no = taxoNo(taxo.no);
  const prefix = no.length > 0 ? `${no}. ` : '';
  const label = taxo.label.length > 0 ? ` (${taxo.label})` : '';
  return `${prefix}${taxo.name}${label} — ${tail}`;
}

function taxoRow(
  ctx: DocContext,
  cells: { item: string; status: string; component: string },
  font: FontName,
  muted: boolean,
): FrameNode {
  const row = stack('HORIZONTAL', GRID * 2, 'Taxonomy Row');
  const cell = (text: string, width: number): TextNode =>
    makeText(ctx, text, {
      size: TYPE.caption,
      font,
      width,
      ...(muted ? { colorVar: ctx.chrome.textMuted } : {}),
    });
  row.appendChild(cell(cells.item, TAXO_COL_W.item));
  row.appendChild(cell(cells.status, TAXO_COL_W.status));
  row.appendChild(cell(cells.component, TAXO_COL_W.component));
  return row;
}

/**
 * 오너 정본 분류표 체크리스트 한 벌 — 헤더행 + 정본 항목 행 + 요약 + (있으면) 프로젝트 고유 목록.
 * 색은 전부 ctx.chrome.* Variable 바인딩(하드코딩 색 없음).
 */
function taxonomyChecklist(ctx: DocContext, taxo: TdsTaxonomyCategory): FrameNode {
  const block = stack('VERTICAL', GRID * 2, `Taxonomy — ${taxo.name}`);

  const done = taxo.items.filter((i) => typeof i.component === 'string' && i.component.length > 0);
  const extras = taxo.extras ?? [];

  block.appendChild(groupHeader(ctx, '정본 분류표 체크리스트 · Owner taxonomy'));
  block.appendChild(
    makeText(
      ctx,
      `정본 ${String(taxo.items.length)}개 · 구현 ${String(done.length)}개 · 미구현 ${String(
        taxo.items.length - done.length,
      )}개 · 프로젝트 고유 ${String(extras.length)}개`,
      { size: TYPE.body, colorVar: ctx.chrome.textMuted },
    ),
  );

  const table = stack('VERTICAL', SUB, 'Taxonomy Table');
  table.appendChild(
    taxoRow(ctx, { item: '항목', status: '상태', component: '컴포넌트' }, ctx.fonts.medium, true),
  );
  table.appendChild(hairline(ctx, CONTENT_W));
  for (const item of taxo.items) {
    const impl = typeof item.component === 'string' && item.component.length > 0;
    table.appendChild(
      taxoRow(
        ctx,
        {
          item: item.name,
          status: impl ? TAXO_DONE : TAXO_TODO,
          component: impl ? (item.component ?? '') : '—',
        },
        ctx.fonts.regular,
        !impl, // 미구현 행만 흐리게 — 구현된 행은 기본 텍스트색
      ),
    );
  }
  block.appendChild(table);

  if (extras.length > 0) {
    const extraBlock = stack('VERTICAL', SUB, 'Taxonomy Extras');
    extraBlock.appendChild(groupHeader(ctx, '프로젝트 고유 · Project-specific'));
    extraBlock.appendChild(
      makeText(ctx, '정본 분류표 밖에서 이 프로젝트가 추가로 갖고 있는 컴포넌트입니다.', {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
        width: CONTENT_W,
      }),
    );
    for (const name of extras) {
      extraBlock.appendChild(
        taxoRow(ctx, { item: name, status: TAXO_DONE, component: name }, ctx.fonts.regular, false),
      );
    }
    block.appendChild(extraBlock);
  }

  return block;
}

/** 카드 한 장의 폭 — 두 장이 가로로 나란히 서고 CONTENT_W 안에 들어간다 */
const CARD_W = GRID * 68; // 544
/** 카드 안쪽 콘텐츠 폭 */
const CARD_INNER_W = CARD_W - GRID * 6; // 496
/** prop 섹션 한 칸의 폭 */
const SAMPLE_W = GRID * 28; // 224
/** 매트릭스 한 칸의 폭 */
const MATRIX_CELL_W = GRID * 14; // 112
/** preview 무대의 **최소** 높이 — 내용이 더 크면 그만큼 자란다(고정 높이가 아니다) */
const STAGE_MIN_H = GRID * 9; // 72

/** 인스턴스 하나 — 칸 폭을 넘으면 비율을 지켜 줄인다. 실패하면 null */
function instanceOf(
  ctx: DocContext,
  variant: ComponentNode | null,
  maxW: number,
): InstanceNode | null {
  if (!variant) return null;
  try {
    const inst = variant.createInstance();
    if (inst.width > maxW && inst.width > 0) {
      const scale = maxW / inst.width;
      inst.resize(maxW, Math.max(1, Math.round(inst.height * scale)));
    }
    return inst;
  } catch (error) {
    ctx.log.push(
      `[인스턴스 실패] ${variant.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/** 작은 알약 칩 — 상태/레벨/값 표기. 색은 전부 Variable 바인딩 */
function chip(ctx: DocContext, label: string, tone: 'positive' | 'neutral' | 'value'): FrameNode {
  const pill = stack('HORIZONTAL', 0, `Chip — ${label}`);
  pill.counterAxisAlignItems = 'CENTER';
  pill.paddingLeft = GRID;
  pill.paddingRight = GRID;
  pill.paddingTop = SUB / 2;
  pill.paddingBottom = SUB / 2;
  pill.cornerRadius = GRID * 2; // 알약
  pill.strokeWeight = HAIRLINE;
  pill.strokeAlign = 'INSIDE';
  if (tone === 'positive') {
    pill.fills = [boundSolid(ctx.chrome.successSurface)];
    pill.strokes = [boundSolid(ctx.chrome.successBorder)];
  } else {
    pill.fills = [
      boundSolid(tone === 'value' ? ctx.chrome.surfaceDefault : ctx.chrome.surfaceRaised),
    ];
    pill.strokes = [boundSolid(ctx.chrome.borderDefault)];
  }
  pill.appendChild(
    makeText(ctx, label, {
      size: TYPE.caption,
      font: ctx.fonts.medium,
      colorVar: tone === 'positive' ? ctx.chrome.successText : ctx.chrome.textMuted,
    }),
  );
  return pill;
}

/**
 * 인스턴스에 컴포넌트 속성 하나를 덮어쓴다 — 문서 칸마다 그림이 갈리게 하는 마지막 한 단계.
 *
 * Figma 의 속성 키는 접미가 붙은 정식 이름(`Checked#12:3`)이라 계약의 표시명으로는 바로 찾을 수
 * 없다. 인스턴스가 실제로 가진 키에서 접두 일치로 되찾는다(build-component 의 큐레이션과 같은 방식).
 * 실패해도 칸은 그린다 — 캡션은 남으므로 문서가 통째로 비는 것보다 낫다.
 */
function overrideProperty(ctx: DocContext, inst: InstanceNode, plan: PropOverridePlan): void {
  try {
    const keyed = Object.keys(inst.componentProperties).find(
      (k) => k === plan.name || k.indexOf(`${plan.name}#`) === 0,
    );
    if (keyed === undefined) return;
    inst.setProperties({ [keyed]: plan.value });
  } catch (error) {
    ctx.log.push(
      `[속성 덮어쓰기 실패] ${inst.name}.${plan.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** 캡션이 달린 샘플 칸 — prop 값 하나의 렌더 */
function sampleCell(
  ctx: DocContext,
  caption: string,
  variant: ComponentNode | null,
  width: number,
  override?: PropOverridePlan,
): FrameNode {
  const cell = stack('VERTICAL', SUB, `Sample — ${caption}`);
  setWidth(cell, width);
  cell.paddingTop = GRID;
  cell.paddingBottom = GRID;
  cell.paddingLeft = GRID;
  cell.paddingRight = GRID;
  cell.cornerRadius = SUB;
  cell.fills = [boundSolid(ctx.chrome.surfaceDefault)];
  cell.strokes = [boundSolid(ctx.chrome.borderSubtle)];
  cell.strokeWeight = HAIRLINE;
  cell.strokeAlign = 'INSIDE';

  const inst = instanceOf(ctx, variant, width - GRID * 2);
  if (inst) {
    // 덮어쓰기는 **부모에 붙이기 전에** 건다 — 속성 변경이 크기를 바꾸면 오토레이아웃이
    // 한 번만 다시 흐르게 하려는 것이다(붙인 뒤에 바꾸면 조상까지 두 번 재계산된다).
    if (override) overrideProperty(ctx, inst, override);
    cell.appendChild(inst);
  }
  cell.appendChild(
    makeText(ctx, caption, {
      size: TYPE.caption,
      colorVar: ctx.chrome.textMuted,
      width: width - GRID * 2,
    }),
  );
  return cell;
}

/**
 * prop 섹션 하나 — 헤더(prop 이름 + 값 칩 + 한 줄 설명) + 값마다 렌더 칸.
 * 섹션 목록·순서는 순수 계층(planComponentCard)이 계약에서 뽑아 둔 것을 그대로 따른다.
 */
function propSection(
  ctx: DocContext,
  plan: PropSectionPlan,
  variants: Map<string, ComponentNode>,
  fallback: ComponentNode | null,
): FrameNode {
  const section = stack('VERTICAL', GRID, `Prop — ${plan.prop}`);

  // 헤더 — prop 이름(굵게) 다음에 허용 값 칩들
  const header = stack('HORIZONTAL', GRID, 'Header');
  header.counterAxisAlignItems = 'CENTER';
  header.layoutWrap = 'WRAP';
  header.counterAxisSpacing = SUB;
  header.appendChild(makeText(ctx, plan.prop, { size: TYPE.group, font: ctx.fonts.bold }));
  for (const value of plan.valueChips) header.appendChild(chip(ctx, value, 'value'));
  section.appendChild(header);

  if (plan.summary.length > 0) {
    section.appendChild(
      makeText(ctx, plan.summary, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
        width: CARD_INNER_W,
      }),
    );
  }

  const grid = stack('HORIZONTAL', GRID, `Values — ${plan.prop}`);
  setWidth(grid, CARD_INNER_W);
  grid.layoutWrap = 'WRAP';
  grid.counterAxisSpacing = GRID;
  for (const cell of plan.cells) {
    const variant =
      cell.variantName === null ? fallback : (variants.get(cell.variantName) ?? fallback);
    grid.appendChild(sampleCell(ctx, cell.caption, variant, SAMPLE_W, cell.propertyOverride));
  }
  section.appendChild(grid);
  return section;
}

/**
 * 투명 배경 표시용 체커보드 — **실제 사각형들**로 그린다(이미지 fill 금지).
 * 칸은 surface/raised, 바탕은 surface/default 라 라이트/다크 모드에서 함께 뒤집힌다.
 */
function checkerboard(ctx: DocContext, width: number, height: number): FrameNode {
  const board = figma.createFrame();
  board.name = 'Checkerboard';
  board.resize(width, height);
  board.fills = [boundSolid(ctx.chrome.surfaceDefault)];
  board.clipsContent = true;
  const size = GRID;
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if ((row + col) % 2 === 0) continue;
      const square = figma.createRectangle();
      square.name = 'Tile';
      square.resize(size, size);
      square.x = col * size;
      square.y = row * size;
      square.fills = [boundSolid(ctx.chrome.surfaceRaised)];
      board.appendChild(square);
    }
  }
  return board;
}

/** preview 섹션 — 여러 배경 표면 위에 같은 컴포넌트를 얹어 대비를 판단하게 한다 */
function previewSection(
  ctx: DocContext,
  plan: ComponentCardPlan,
  fallback: ComponentNode | null,
): FrameNode {
  const section = stack('VERTICAL', GRID, 'preview');
  section.appendChild(makeText(ctx, 'preview', { size: TYPE.group, font: ctx.fonts.bold }));
  section.appendChild(
    makeText(ctx, '배경 표면별 대비 확인 — 투명 배경은 체커보드로 표시합니다.', {
      size: TYPE.caption,
      colorVar: ctx.chrome.textMuted,
      width: CARD_INNER_W,
    }),
  );

  const row = stack('HORIZONTAL', GRID, 'Surfaces');
  setWidth(row, CARD_INNER_W);
  row.layoutWrap = 'WRAP';
  row.counterAxisSpacing = GRID;
  const panelW = GRID * 19; // 152

  for (const surface of plan.preview.surfaces) {
    const cell = stack('VERTICAL', SUB, `Preview — ${surface.label}`);
    setWidth(cell, panelW);

    const stage = stack('HORIZONTAL', 0, 'Stage');
    // 폭만 고정하고 **높이는 내용만큼** 자란다. 예전에는 폭·높이를 모두 GRID*9(72px)로 못박고
    // clipsContent 를 켜 두어, instanceOf 가 폭만 줄이는 탓에 키 큰 컴포넌트(LineAreaChart·
    // FileDropzone 등)가 아래에서 잘렸다. 최소 높이는 남겨 빈 무대가 납작해지지 않게 한다.
    setWidth(stage, panelW);
    stage.minHeight = STAGE_MIN_H;
    stage.primaryAxisAlignItems = 'CENTER';
    stage.counterAxisAlignItems = 'CENTER';
    stage.cornerRadius = SUB;
    stage.strokes = [boundSolid(ctx.chrome.borderSubtle)];
    stage.strokeWeight = HAIRLINE;
    stage.strokeAlign = 'INSIDE';
    // 무대는 자르지 않는다 — 잘린 그림은 '이 컴포넌트가 원래 그렇게 생겼다' 로 읽힌다
    stage.clipsContent = false;

    if (surface.kind === 'transparent') {
      stage.fills = [];
      stage.appendChild(checkerboard(ctx, panelW, STAGE_MIN_H));
    } else {
      const variable =
        surface.variable === undefined ? null : (ctx.vars.get(surface.variable) ?? null);
      stage.fills = [boundSolid(variable ?? ctx.chrome.surfaceDefault)];
      if (variable === null && surface.variable !== undefined) {
        warn(ctx, `preview 표면 Variable 없음: ${surface.variable}`);
      }
    }
    const inst = instanceOf(ctx, fallback, panelW - GRID * 2);
    if (inst) stage.appendChild(inst);
    cell.appendChild(stage);
    cell.appendChild(
      makeText(ctx, surface.label, {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
        width: panelW,
      }),
    );
    row.appendChild(cell);
  }
  section.appendChild(row);
  return section;
}

/**
 * 인터랙션 매트릭스 — 하늘색 톤 + 파선 테두리로 시각적으로 구분된 블록.
 * 행은 계약 states, 열은 Interaction / Active / Focus / Active+Focus 고정 축이다.
 */
function interactionMatrix(
  ctx: DocContext,
  plan: ComponentCardPlan,
  fallback: ComponentNode | null,
): FrameNode {
  const block = stack('VERTICAL', GRID, 'Interaction Matrix');
  setWidth(block, CARD_INNER_W);
  block.paddingTop = GRID * 2;
  block.paddingBottom = GRID * 2;
  block.paddingLeft = GRID * 2;
  block.paddingRight = GRID * 2;
  block.cornerRadius = GRID;
  block.fills = [boundSolid(ctx.chrome.infoSurface)];
  block.strokes = [boundSolid(ctx.chrome.infoBorder)];
  block.strokeWeight = HAIRLINE;
  block.strokeAlign = 'INSIDE';
  block.dashPattern = [SUB, SUB]; // 파선 — 다른 섹션과 구분되는 표식

  block.appendChild(makeText(ctx, 'Interaction', { size: TYPE.group, font: ctx.fonts.bold }));
  if (plan.interactions.rows.length === 0) {
    block.appendChild(
      makeText(ctx, '계약에 states 가 없어 매트릭스를 만들 수 없습니다.', {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
      }),
    );
    return block;
  }

  // 머리행
  const head = stack('HORIZONTAL', SUB, 'Matrix Head');
  head.counterAxisAlignItems = 'MIN';
  for (const column of plan.interactions.columns) {
    const box = stack('VERTICAL', 0, `Col — ${column}`);
    setWidth(box, MATRIX_CELL_W);
    box.appendChild(makeText(ctx, column, { size: TYPE.caption, font: ctx.fonts.bold }));
    head.appendChild(box);
  }
  block.appendChild(head);
  block.appendChild(hairline(ctx, MATRIX_CELL_W * plan.interactions.columns.length));

  for (const row of plan.interactions.rows) {
    const rowFrame = stack('HORIZONTAL', SUB, `Row — ${row.state}`);
    rowFrame.counterAxisAlignItems = 'MIN';
    for (const cell of row.cells) {
      const box = stack('VERTICAL', SUB, `Cell — ${cell.label}`);
      setWidth(box, MATRIX_CELL_W);
      box.paddingTop = SUB;
      box.paddingBottom = SUB;
      const inst = instanceOf(ctx, fallback, MATRIX_CELL_W - GRID);
      if (inst) box.appendChild(inst);
      box.appendChild(
        makeText(ctx, cell.label, {
          size: TYPE.caption,
          colorVar: ctx.chrome.textMuted,
          width: MATRIX_CELL_W - SUB,
        }),
      );
      rowFrame.appendChild(box);
    }
    block.appendChild(rowFrame);
  }
  return block;
}

/**
 * Resource 섹션 — 컴포넌트를 이루는 **원재료(anatomy 직속 부위)** 를 회색 패널에 하나씩 담는다.
 * 부위 이름은 anatomy 가 정한 레이어 이름 그대로다(디자이너가 레이어 패널에서 보는 이름).
 */
function resourceSection(ctx: DocContext, plan: ComponentCardPlan): FrameNode {
  const section = stack('VERTICAL', GRID, 'Resource');
  section.appendChild(makeText(ctx, 'Resource', { size: TYPE.group, font: ctx.fonts.bold }));
  section.appendChild(
    makeText(ctx, '이 컴포넌트를 이루는 부위(anatomy) 목록입니다.', {
      size: TYPE.caption,
      colorVar: ctx.chrome.textMuted,
      width: CARD_INNER_W,
    }),
  );

  if (plan.resources.length === 0) {
    section.appendChild(
      makeText(ctx, '단일 부위 컴포넌트 — 하위 부위가 없습니다.', {
        size: TYPE.caption,
        colorVar: ctx.chrome.textMuted,
      }),
    );
    return section;
  }

  const row = stack('HORIZONTAL', GRID, 'Resource Panels');
  setWidth(row, CARD_INNER_W);
  row.layoutWrap = 'WRAP';
  row.counterAxisSpacing = GRID;
  for (const resource of plan.resources) {
    const panel = stack('VERTICAL', SUB, `Resource — ${resource.name}`);
    setWidth(panel, GRID * 19);
    panel.paddingTop = GRID;
    panel.paddingBottom = GRID;
    panel.paddingLeft = GRID;
    panel.paddingRight = GRID;
    panel.cornerRadius = SUB;
    panel.fills = [boundSolid(ctx.chrome.skeleton)];
    panel.strokes = [boundSolid(ctx.chrome.borderSubtle)];
    panel.strokeWeight = HAIRLINE;
    panel.strokeAlign = 'INSIDE';
    panel.appendChild(
      makeText(ctx, resource.name, {
        size: TYPE.caption,
        font: ctx.fonts.medium,
        width: GRID * 17,
      }),
    );
    row.appendChild(panel);
  }
  section.appendChild(row);
  return section;
}

/**
 * 컴포넌트 한 개의 문서 카드 — 참조 디자인 구조 그대로.
 *   제목 + 한 줄 설명 + 상태 칩 → prop 섹션들 → preview → 인터랙션 매트릭스 → Resource → 토큰 표
 * 구조·순서 판단은 전부 순수 계층(planComponentCard)이 하고 여기서는 그리기만 한다.
 */
function componentCard(
  ctx: DocContext,
  spec: DocComponentSpec,
  plan: ComponentCardPlan,
  real: SceneNode | null,
): FrameNode {
  const card = stack('VERTICAL', CARD_GAP, `Component — ${spec.name}`);
  setWidth(card, CARD_W);
  card.paddingTop = GRID * 3;
  card.paddingBottom = GRID * 3;
  card.paddingLeft = GRID * 3;
  card.paddingRight = GRID * 3;
  card.cornerRadius = GRID * 1.5;
  card.fills = [boundSolid(ctx.chrome.surfaceRaised)];
  card.strokes = [boundSolid(ctx.chrome.borderDefault)];
  card.strokeWeight = HAIRLINE;
  card.strokeAlign = 'INSIDE';

  // --- 머리: 이름 · 한 줄 설명 · 상태 칩 ---
  const head = stack('VERTICAL', GRID, 'Card Head');
  head.appendChild(
    makeText(ctx, plan.name, { size: TYPE.section, font: ctx.fonts.bold, width: CARD_INNER_W }),
  );
  if (plan.summary.length > 0) {
    head.appendChild(
      makeText(ctx, plan.summary, {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
        width: CARD_INNER_W,
      }),
    );
  }
  const chips = stack('HORIZONTAL', SUB, 'Chips');
  chips.counterAxisAlignItems = 'CENTER';
  chips.appendChild(chip(ctx, `v${plan.version}`, 'neutral'));
  for (const item of plan.chips) chips.appendChild(chip(ctx, item.label, item.tone));
  head.appendChild(chips);
  card.appendChild(head);
  card.appendChild(hairline(ctx, CARD_INNER_W));

  // --- 실제 변형 색인 — 모든 섹션이 이 인스턴스 원본을 공유한다 ---
  const variants = new Map<string, ComponentNode>();
  let fallback: ComponentNode | null = null;
  if (real && real.type === 'COMPONENT_SET') {
    for (const child of real.children) {
      if (child.type !== 'COMPONENT') continue;
      variants.set(child.name, child);
      if (fallback === null) fallback = child;
    }
    const preferred = real.defaultVariant;
    if (preferred) fallback = preferred;
  } else if (real && real.type === 'COMPONENT') {
    fallback = real;
  }
  if (fallback === null) {
    card.appendChild(
      makeText(ctx, '실제 컴포넌트가 없습니다 — ② Component Set 동기화를 먼저 실행하세요.', {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
        width: CARD_INNER_W,
      }),
    );
  }

  // --- prop 섹션 (계약 선언 순서) ---
  for (const section of plan.sections) {
    card.appendChild(propSection(ctx, section, variants, fallback));
  }

  // --- preview · 인터랙션 매트릭스 · Resource ---
  card.appendChild(previewSection(ctx, plan, fallback));
  card.appendChild(interactionMatrix(ctx, plan, fallback));
  card.appendChild(resourceSection(ctx, plan));

  // --- 토큰 바인딩 표 — 용도별 그룹 (기존 문서에서 이어지는 축, 없애지 않는다) ---
  const entries = Object.entries(spec.tokens);
  if (entries.length > 0) {
    const byGroup = new Map<string, Array<[string, string]>>();
    for (const entry of entries) {
      const label = tokenGroupLabel(entry[1]);
      const bucket = byGroup.get(label);
      if (bucket) bucket.push(entry);
      else byGroup.set(label, [entry]);
    }
    const tokens = stack('VERTICAL', GRID, 'Tokens');
    tokens.appendChild(
      makeText(ctx, `토큰 바인딩 — ${String(entries.length)}개`, {
        size: TYPE.group,
        font: ctx.fonts.bold,
      }),
    );
    for (const label of [...TOKEN_GROUPS.map((g) => g.label), TOKEN_OTHER]) {
      const rows = byGroup.get(label);
      if (!rows || rows.length === 0) continue;
      tokens.appendChild(
        makeText(ctx, `${label}  (${String(rows.length)})`, {
          size: TYPE.caption,
          font: ctx.fonts.medium,
        }),
      );
      for (const [key, path] of rows) {
        const varName = path.split('.').join('/');
        const exists =
          ctx.vars.has(varName) || [...ctx.vars.keys()].some((n) => n.startsWith(`${varName}/`));
        if (!exists) warn(ctx, `${spec.name}.tokens.${key}: Variable 미생성 — ${varName}`);
        tokens.appendChild(
          makeText(ctx, `${key} · ${path}${exists ? '' : ' (미생성)'}`, {
            size: TYPE.caption,
            colorVar: ctx.chrome.textMuted,
            width: CARD_INNER_W,
          }),
        );
      }
    }
    card.appendChild(tokens);
  }

  // --- 실제 Component Set 자체도 카드 안에 둔다 — 디자이너가 바로 집어 쓸 수 있게 ---
  if (real) {
    try {
      const setBlock = stack('VERTICAL', GRID, 'Component Set');
      setBlock.appendChild(
        makeText(ctx, '컴포넌트 · Component Set', { size: TYPE.group, font: ctx.fonts.bold }),
      );
      setBlock.appendChild(real); // 페이지 최상위 → 이 카드 안으로 재부모화
      card.appendChild(setBlock);
    } catch (error) {
      const m = error instanceof Error ? error.message : String(error);
      ctx.log.push(`[세트 삽입 실패] ${spec.name}: ${m} — 페이지에 그대로 둡니다`);
    }
  }

  return card;
}

/**
 * 카테고리 페이지 = TDS Doc 문서(속성 표·토큰) **위**, 실제 Component Set **아래**.
 * 세트는 sync-components 가 이미 만든 것 — 절대 지우지 않고 위치만 정렬한다.
 * 재실행 시 이전 문서 프레임(TDS Doc)만 지우고 새로 그린다.
 */
function buildComponentCategoryPage(
  ctx: DocContext,
  page: PageNode,
  category: string,
  specs: DocComponentSpec[],
  taxo: TdsTaxonomyCategory | null,
): void {
  // 이전 문서 프레임을 지우기 **전에** 실제 컴포넌트를 걷어 둔다 — 지난 실행에서 시트 안에 넣어 뒀다면
  // 프레임과 함께 지워질 수 있기 때문. 먼저 최상위로 꺼내 놓고, 그다음 옛 프레임을 제거한다.
  const realByName = new Map<string, SceneNode>();
  const collect = (node: SceneNode): void => {
    if (node.name === SWAP_PLACEHOLDER_NAME) return;
    if (node.type === 'COMPONENT_SET') realByName.set(node.name, node);
    else if (node.type === 'COMPONENT' && node.parent?.type !== 'COMPONENT_SET')
      realByName.set(node.name, node);
  };
  for (const child of page.children) {
    if (child.name === ROOT_FRAME_NAME && child.type === 'FRAME') {
      const inners = child.findAll((n) => n.type === 'COMPONENT_SET' || n.type === 'COMPONENT');
      for (const inner of inners) collect(inner);
    } else {
      collect(child);
    }
  }
  for (const node of realByName.values()) page.appendChild(node); // 최상위로 복귀(프레임 삭제로부터 보호)
  for (const child of [...page.children]) {
    if (child.name === ROOT_FRAME_NAME) child.remove(); // 문서 프레임만 교체 — 컴포넌트는 이미 대피
  }

  const group = specs.filter(
    (s) => (s.category.length > 0 ? s.category : 'Utilities') === category,
  );
  const root = buildRoot(ctx, page);
  root.x = 0;
  root.y = 0;
  root.appendChild(sectionHeader(ctx, categoryHeading(category, taxo, group.length)));
  if (taxo && taxo.description !== undefined && taxo.description.length > 0) {
    root.appendChild(
      makeText(ctx, taxo.description, {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
        width: CONTENT_W,
      }),
    );
  }
  root.appendChild(
    makeText(
      ctx,
      group.length > 0
        ? '카드마다 속성 섹션 · preview · 인터랙션 매트릭스 · Resource 를 계약에서 자동 생성합니다.'
        : `아직 이 카테고리의 컴포넌트가 없습니다 — 계약에 "category": "${category}" 를 지정하면 여기에 자동으로 나타납니다.`,
      {
        size: TYPE.body,
        colorVar: ctx.chrome.textMuted,
      },
    ),
  );
  // 오너 정본 분류표 체크리스트 — taxonomy 가 없으면 통째로 생략(기존 동작 유지)
  if (taxo) root.appendChild(taxonomyChecklist(ctx, taxo));

  // 카드는 가로로 나란히 놓고 폭이 차면 다음 줄로 흐른다 — 전부 오토레이아웃이라 겹치지 않는다
  let embedded = 0;
  const varNames = new Set(ctx.vars.keys());
  const cards = stack('HORIZONTAL', CARD_GAP, 'Cards');
  fillWidth(cards);
  cards.primaryAxisSizingMode = 'FIXED';
  cards.layoutWrap = 'WRAP';
  cards.counterAxisSpacing = CARD_GAP;
  cards.counterAxisAlignItems = 'MIN';
  root.appendChild(cards);

  for (const spec of group) {
    const real = realByName.get(spec.name) ?? null;
    if (spec.raw === null) continue;
    // 카드 구조 계획은 순수 계층이 세운다 — 실패해도 나머지 컴포넌트는 계속 그린다
    let plan: ComponentCardPlan;
    try {
      plan = planComponentCard(spec.raw, buildComponentSetSpec(spec.raw, varNames));
    } catch (error) {
      warn(
        ctx,
        `${spec.name}: 카드 계획 실패 — ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    cards.appendChild(componentCard(ctx, spec, plan, real));
    // 삽입 성공 판정은 **실제 부모**로 한다 — Figma 가 프레임 안 Component Set 을 거부하면
    // 여전히 page 의 자식이므로 잔여 목록에 남겨 아래쪽에 정렬(겹침 방지)한다.
    if (real && real.parent !== page) {
      realByName.delete(spec.name);
      embedded += 1;
    }
  }

  // 시트에 못 붙인 나머지(계약에 없는 세트 등)는 문서 아래에 한 줄로 둔다 — 겹치지 않게
  let x = 0;
  const top = root.y + root.height + SECTION_GAP;
  for (const leftover of realByName.values()) {
    leftover.x = x;
    leftover.y = top;
    x += leftover.width + SECTION_GAP;
  }
  ctx.log.push(
    `${page.name}: 시트 ${String(group.length)}개 · 세트 삽입 ${String(embedded)}개 · 잔여 ${String(realByName.size)}개`,
  );
}

/**
 * sync-components 가 만든 **실제 Component Set 페이지**를 문서 순서에 편입한다(내용은 건드리지 않는다).
 * 이 페이지들은 tdsDoc 표식이 없어 문서 정리에 삭제되지 않는다 — 여기서는 위치·번호만 관리한다.
 */
async function adoptComponentCategoryPages(ctx: DocContext): Promise<PageNode[]> {
  const byBase = new Map<string, PageNode>();
  for (const p of figma.root.children) {
    const base = p.getPluginData('tdsBase');
    if (base.startsWith('🧩 Components — ')) byBase.set(base, p);
  }
  const ordered: PageNode[] = [];
  for (const base of COMPONENT_PAGE_ORDER) {
    const p = byBase.get(base);
    if (p) {
      await p.loadAsync();
      ordered.push(p);
      byBase.delete(base);
    }
  }
  // 규정 외 레벨(Other 등)도 뒤에 붙인다 — 누락 없이
  for (const p of byBase.values()) {
    await p.loadAsync();
    ordered.push(p);
  }
  ctx.log.push(
    ordered.length > 0
      ? `컴포넌트 카테고리 페이지 편입: ${String(ordered.length)}개 (실제 Component Set)`
      : '[경고] 컴포넌트 카테고리 페이지 없음 — ② Component Set 동기화를 먼저 실행하세요',
  );
  return ordered;
}

export async function generateTdsDoc(payload: TdsDocPayload): Promise<string[]> {
  if (
    !payload ||
    !isRecord(payload.tokens) ||
    typeof payload.tokens.collection !== 'string' ||
    !Array.isArray(payload.tokens.variables)
  ) {
    throw new Error(
      'TDS 문서 페이로드 형식 오류 — { tokens: {collection, variables[]}, components?, pages?, meta? } 필요 (docs/figma/specs/tds-doc-style.md §11)',
    );
  }

  const log: string[] = [];
  await figma.loadAllPagesAsync();

  // Variable 인덱스 — '토큰 → Variables 동기화'가 만든 컬렉션이 선행 조건
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find((c) => c.name === payload.tokens.collection);
  if (!collection) {
    throw new Error(
      `Variable 컬렉션 '${payload.tokens.collection}' 없음 — 먼저 '토큰 → Variables 동기화'를 실행하세요 (실행 순서: codegen → Variables → TDS 문서)`,
    );
  }
  const vars = new Map<string, Variable>();
  for (const variable of await figma.variables.getLocalVariablesAsync()) {
    if (variable.variableCollectionId === collection.id) vars.set(variable.name, variable);
  }

  // 필수 크롬 Variable — 규격 §10 (하나라도 없으면 중단)
  const missingChrome = Object.values(CHROME_VARS).filter((name) => !vars.has(name));
  if (missingChrome.length > 0) {
    throw new Error(
      `문서 크롬 필수 Variable 없음: ${missingChrome.join(', ')} — tokens.json semantic 계층과 Variables 동기화 상태를 확인하세요`,
    );
  }
  const chromeVar = (name: string): Variable => {
    const v = vars.get(name);
    if (!v) throw new Error(`크롬 Variable 조회 실패: ${name}`);
    return v;
  };

  // 이 실행이 쓸 폰트를 **여기서 전부** 로드한다.
  //
  // [실제 Figma 로그] `in appendChild: unloaded font "Pretendard SemiBold"` 로 ③이 중단됐다.
  // ②가 로드해 둔 상태가 ③으로 이어질 거라 가정한 것이 원인이다 — 플러그인 메시지가 나뉘면
  // 폰트 로드 상태도 나뉜다. 그래서 실행마다 처음에 전부 다시 로드한다.
  // 한글·기호가 유발하는 런타임 폴백 폰트(Noto Sans Symbols2 등)까지 함께 잡는다.
  const fontSet = await loadAllFonts(log);
  const fallbackFont: FontName = fontSet.primary ?? { family: 'Inter', style: 'Regular' };
  const fonts = {
    regular: fallbackFont,
    medium:
      pickStyle(fontSet, 'Inter', ['Medium']) ??
      pickStyle(fontSet, 'Pretendard', ['Medium']) ??
      fallbackFont,
    bold:
      pickStyle(fontSet, 'Inter', ['Bold']) ??
      pickStyle(fontSet, 'Pretendard', ['Bold']) ??
      fallbackFont,
  };

  const ctx: DocContext = {
    log,
    vars,
    chrome: {
      textDefault: chromeVar(CHROME_VARS.textDefault),
      textMuted: chromeVar(CHROME_VARS.textMuted),
      surfaceDefault: chromeVar(CHROME_VARS.surfaceDefault),
      surfaceRaised: chromeVar(CHROME_VARS.surfaceRaised),
      borderDefault: chromeVar(CHROME_VARS.borderDefault),
      borderSubtle: chromeVar(CHROME_VARS.borderSubtle),
      accent: chromeVar(CHROME_VARS.accent),
      successSurface: chromeVar(CHROME_VARS.successSurface),
      successBorder: chromeVar(CHROME_VARS.successBorder),
      successText: chromeVar(CHROME_VARS.successText),
      infoSurface: chromeVar(CHROME_VARS.infoSurface),
      infoBorder: chromeVar(CHROME_VARS.infoBorder),
      skeleton: chromeVar(CHROME_VARS.skeleton),
    },
    fonts,
    specimenFonts: new Map(),
  };

  // --- 1) 화면 메타를 섹션·메뉴로 묶는다 (페이지 순서 계획의 입력) --------------------
  // 섹션·메뉴 순서를 payload 등장 순서 그대로 보존한다(nav 순서 = 화면 순서).
  interface MenuGroup {
    menu: string;
    screens: TdsPageMeta[];
  }
  interface SectionGroup {
    title: string;
    menus: MenuGroup[];
  }
  const sections: SectionGroup[] = [];
  // 메뉴는 **전역으로** 유일해야 한다. 같은 메뉴 라벨이 두 섹션에 나오면 ensurePage 가 같은 페이지를
  // 돌려주는데, 두 번 만들면 앞 섹션의 화면이 지워지고 순번까지 어긋난다.
  const menuByTitle = new Map<string, MenuGroup>();
  for (const meta of payload.pages ?? []) {
    const secTitle = meta.section ?? '기타';
    const menuTitle = meta.menu ?? meta.name ?? meta.id;
    let sec = sections.find((x) => x.title === secTitle);
    if (!sec) {
      sec = { title: secTitle, menus: [] };
      sections.push(sec);
    }
    let group = menuByTitle.get(menuTitle);
    if (!group) {
      group = { menu: menuTitle, screens: [] };
      menuByTitle.set(menuTitle, group);
      sec.menus.push(group); // 처음 등장한 섹션에만 소속시킨다
    }
    group.screens.push(meta);
  }
  const menuPageBase = (menu: string): string => `📄 ${menu}`;

  // --- 2) 실제 Component Set 카테고리 페이지를 편입한다 (내용은 건드리지 않는다) ----------
  const componentPages = await adoptComponentCategoryPages(ctx);
  const componentPageByBase = new Map<string, PageNode>();
  for (const cp of componentPages) componentPageByBase.set(cp.getPluginData('tdsBase'), cp);

  const docSpecs = (payload.components ?? [])
    .map((raw) => normalizeComponentSpec(raw))
    .filter((x): x is DocComponentSpec => x !== null);
  // 오너 정본 분류표(있을 때만) — 카테고리 영문명으로 매칭한다. 없으면 빈 맵 → 체크리스트 생략.
  const taxoByName = new Map<string, TdsTaxonomyCategory>();
  for (const t of normalizeTaxonomy(payload.taxonomy)) taxoByName.set(t.name, t);
  if (taxoByName.size > 0) {
    ctx.log.push(`정본 분류표 적재: ${String(taxoByName.size)}개 카테고리`);
  }

  // --- 3) 페이지 순서 계획 — 정본은 순수 계층(spec/doc-pages.ts) ------------------------
  const plan: DocPagePlanItem[] = planDocPages({
    foundations: {
      validation: PAGE_NAMES.validation,
      cover: PAGE_NAMES.cover,
      colors: PAGE_NAMES.colors,
      typography: PAGE_NAMES.typography,
      icon: PAGE_NAMES.icon,
      spacing: PAGE_NAMES.spacing,
    },
    componentBases: componentPages.map((cp) => cp.getPluginData('tdsBase')),
    menuSections: sections.map((sec) => ({
      title: sec.title,
      menuBases: sec.menus.map((m) => menuPageBase(m.menu)),
    })),
    pagesFallbackBase: PAGE_NAMES.pages,
  });

  // --- 4) 계획대로 페이지를 확보하고 내용을 그린다 ------------------------------------
  // 파운데이션 페이지는 이름 매칭 멱등(내용을 비우고 재생성). 정렬·정리는 이름이 아니라
  // **페이지 참조**로 한다: 구분선은 이름이 전부 '---------' 라 이름으로 구별되지 않기 때문이다.
  const menuGroupByBase = new Map<string, MenuGroup>();
  for (const sec of sections) {
    for (const m of sec.menus) menuGroupByBase.set(menuPageBase(m.menu), m);
  }

  const orderedPages: PageNode[] = [];
  let coverP: PageNode | null = null;
  for (const item of plan) {
    if (item.kind === 'divider') {
      orderedPages.push(await createDivider()); // 라벨 없는 '---------'
      continue;
    }
    if (item.role === 'component') {
      // sync-components 가 만든 페이지 — 없으면 조용히 건너뛴다(순서만 비고 삭제는 하지 않는다)
      const cp = componentPageByBase.get(item.base);
      if (!cp) continue;
      const cat = COMPONENT_PAGE_CATEGORY[item.base] ?? 'Utilities';
      buildComponentCategoryPage(ctx, cp, cat, docSpecs, taxoByName.get(cat) ?? null);
      orderedPages.push(cp);
      continue;
    }
    const page = await ensurePage(item.base);
    switch (item.role) {
      case 'validation':
        buildValidationPage(ctx, page, payload);
        break;
      case 'cover':
        buildCover(ctx, page, payload);
        coverP = page;
        break;
      case 'colors':
        buildColorsPage(ctx, page, payload);
        break;
      case 'typography':
        await buildTypographyPage(ctx, page, payload);
        break;
      case 'icon':
        buildIconPage(ctx, page, payload);
        break;
      case 'spacing':
        buildSpacingPage(ctx, page, payload);
        break;
      case 'menu': {
        const group = menuGroupByBase.get(item.base);
        if (group) buildMenuPage(ctx, page, group.menu, group.screens);
        break;
      }
      case 'pages':
        buildPagesPage(ctx, page, payload);
        break;
    }
    orderedPages.push(page);
  }
  if (coverP === null) {
    throw new Error('커버 페이지를 만들지 못했습니다 — 페이지 순서 계획이 손상되었습니다.');
  }

  // 이전 생성물 삭제 — 이번에 만든 페이지(참조 집합)에 없는데 **우리가 과거에 만든**(tdsDoc 표식)
  // 또는 구버전 단일 '📄 Pages' 는 지운다('있으면 삭제하고 다시'). orderedPages 가 남으므로
  // Figma 의 '≥1 페이지' 제약은 항상 지켜진다. 사용자가 만든(표식 없는) 페이지는 건드리지 않는다.
  const keep = new Set<PageNode>(orderedPages);
  // documentAccess: dynamic-page — 동기 currentPage 대입 금지. 삭제 대상이 현재 페이지가 되지 않게 커버로.
  await figma.setCurrentPageAsync(coverP);
  let removed = 0;
  // 삭제 기준은 **오직 우리 표식(tdsDoc)** — 이름으로 지우지 않는다(이름은 순번 접두어로 바뀌고,
  // 사용자가 만든 동명 페이지를 오인 삭제할 수 있다). 게다가 실제 컴포넌트가 든 페이지는 절대 지우지
  // 않는다: 구버전에서 Component Set 이 문서 페이지 위에 만들어졌을 수 있어 작업물 손실이 된다.
  let preserved = 0;
  for (const p of [...figma.root.children]) {
    if (p.getPluginData('tdsDoc') !== '1' || keep.has(p)) continue;
    await p.loadAsync();
    if (p.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).length > 0) {
      p.setPluginData('tdsDoc', ''); // 표식을 떼어 사용자 페이지로 넘긴다(다음 실행에도 안전)
      log.push(`[보존] ${p.name} — 컴포넌트가 들어 있어 삭제하지 않습니다`);
      preserved += 1;
      continue;
    }
    p.remove();
    removed += 1;
  }
  if (removed > 0) log.push(`이전 생성물 정리 — 페이지 ${String(removed)}개 삭제`);
  if (preserved > 0)
    log.push(`보존 ${String(preserved)}개 — 컴포넌트가 있는 옛 페이지는 수동 확인 후 정리하세요`);

  // 참조 순서대로 파일 맨 앞에 정렬(목록 밖 사용자 페이지는 건드리지 않음)
  orderedPages.forEach((page, index) => figma.root.insertChild(index, page));

  // 순번 자동 부여 — 구분선('---------')은 건너뛰고 실제 페이지만 1,2,3… 으로 매긴다.
  // 표시명만 바꾸고 식별은 tdsBase 로 하므로 다음 실행에도 같은 페이지를 찾아 멱등하다.
  let seq = 0;
  for (const page of orderedPages) {
    const base = page.getPluginData('tdsBase');
    if (base.length === 0) continue; // 구분선 등 — 번호 없음
    seq += 1;
    page.name = `${String(seq)}. ${base}`;
  }

  log.push(
    `TDS 문서 생성 완료 — 페이지 ${String(orderedPages.length)}개 (순번 ${String(seq)} · 컴포넌트 카테고리 + 메뉴별 분리 + '---------' 구분선)`,
  );
  return log;
}
