/**
 * Design System Admin Hub — Figma 플러그인 메인 스레드
 * 소유: Figma 플러그인 Figma Plugin Engineer (tools/figma-plugin/**), 게이트 G7, 검수: Figma 리뷰 Figma Reviewer
 *
 * 역할: codegen 산출물(generated/<Name>.figma.json, generated/tokens/figma-variables.json)을
 * UI(iframe)로부터 postMessage로 받아 Figma 파일에 반영한다.
 *  (a) Variables 컬렉션 생성/갱신 — light 단일 모드 (figma.variables API)
 *  (b) Component / Component Set 조립 — 계약의 anatomy(부위 트리)를 **실제 Figma 노드**
 *      (오토레이아웃 프레임·텍스트·도형·인스턴스)로 만들고 모든 시각값을 Variable 에 바인딩한다.
 *      스크린샷 이미지는 어디에도 쓰지 않는다 — 디자이너가 모든 부위를 선택·검사·재스타일할 수 있어야 한다.
 *  (c) Detached 스타일(Variable/Style 미바인딩 raw 값) 스캔 리포트 — G7 체크리스트 "바인딩률 100%" 입력값
 *  (d) TDS 문서 생성 — Foundations/컴포넌트/Pages를 'TDS 문서 스타일'로 렌더링 (src/tds-doc.ts,
 *      규격: docs/figma/specs/tds-doc-style.md — Storybook과 동일한 tokens.json 원천)
 *
 * 원칙(P2 계약 우선): 이 플러그인은 계약에 없는 것을 만들지 않는다.
 * 계약에 없는 기존 값을 발견해도 삭제하지 않고 경고만 남긴다 — 파괴적 변경 판단은 G7 검수(Figma 리뷰)의 몫.
 */

import { applySwapPreferredValues, buildComponent, errMsg } from './render/build-component';
import { loadAllFonts } from './render/fonts';
import { formatFailures, type CheckFailure } from './render/self-check';
import { categoryPageBase, groupByCategory } from './spec/catalog';
import { type ComponentFigmaSpec } from './spec/component-spec';
import { generateTdsDoc, type TdsDocPayload } from './tds-doc';

/** Variable 컬렉션 이름 — codegen 산출물(figma-variables.json)의 collection 과 같아야 한다 */
const TOKEN_COLLECTION = 'TDS Tokens';

// ---------------------------------------------------------------------------
// 메시지 프로토콜 (UI ↔ main). 페이로드 형식은 tools/codegen이 생성한다:
// - TokensPayload    ← generated/tokens/figma-variables.json (tokens.json에서 생성)
// - ComponentFigmaSpec ← generated/<Name>.figma.json (<Name>.contract.json에서 생성)
// ---------------------------------------------------------------------------

interface TokenVariableSpec {
  /** Figma 그룹 구분은 슬래시 — 예: 'color/action/primary/default' */
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  /** 토큰 값 — 테마는 라이트 단일 모드다(2026-07-20 다크 제거) */
  value: string | number | boolean;
}

interface TokensPayload {
  /** 예: 'TDS Tokens' */
  collection: string;
  modes: string[];
  variables: TokenVariableSpec[];
}

type UiMessage =
  | { type: 'sync-tokens'; payload: TokensPayload }
  | { type: 'sync-components'; payload: ComponentFigmaSpec[] | { specs: ComponentFigmaSpec[] } }
  | { type: 'generate-tds-doc'; payload: TdsDocPayload }
  | { type: 'scan-detached' }
  | { type: 'close' };

interface DetachedEntry {
  page: string;
  node: string;
  nodeType: string;
  issue: string;
}

// ---------------------------------------------------------------------------
// 값 변환 유틸
// ---------------------------------------------------------------------------

function parseHexColor(hex: string): RGBA {
  const raw = hex.trim().replace(/^#/, '');
  const expand = (s: string): string =>
    s
      .split('')
      .map((ch) => ch + ch)
      .join('');
  let full: string;
  if (raw.length === 3 || raw.length === 4) {
    full = expand(raw);
  } else if (raw.length === 6 || raw.length === 8) {
    full = raw;
  } else {
    throw new Error(`색상 파싱 실패: "${hex}" — #RGB/#RGBA/#RRGGBB/#RRGGBBAA 형식만 지원`);
  }
  const channel = (offset: number): number => {
    const value = Number.parseInt(full.slice(offset, offset + 2), 16);
    if (Number.isNaN(value)) {
      throw new Error(`색상 파싱 실패: "${hex}" — 16진수 아님`);
    }
    return value / 255;
  };
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: full.length === 8 ? channel(6) : 1,
  };
}

function toFigmaValue(
  type: TokenVariableSpec['type'],
  raw: string | number | boolean,
): VariableValue {
  switch (type) {
    case 'COLOR': {
      if (typeof raw !== 'string') {
        throw new Error(`COLOR 값은 hex 문자열이어야 함: ${String(raw)}`);
      }
      return parseHexColor(raw);
    }
    case 'FLOAT': {
      const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
      if (Number.isNaN(value)) {
        throw new Error(`FLOAT 값 파싱 실패: ${String(raw)} — codegen이 숫자로 정규화해야 함`);
      }
      return value;
    }
    case 'BOOLEAN':
      return raw === true || raw === 'true';
    case 'STRING':
      return String(raw);
  }
}

// ---------------------------------------------------------------------------
// (a) Variables 컬렉션 생성/갱신 — light 단일 모드
// ---------------------------------------------------------------------------

/**
 * 컬렉션의 첫 모드를 'light' 로 보장한다.
 *
 * 종전에는 dark 모드를 addMode 로 덧붙였는데, 무료 Figma 플랜은 컬렉션당 1모드라
 * 그 호출이 항상 throw 했다. 다크 제거(2026-07-20) 로 addMode 자체가 불필요해졌다.
 */
function ensureLightMode(collection: VariableCollection): string {
  const existingLight = collection.modes.find((m) => m.name === 'light');
  if (existingLight) return existingLight.modeId;

  const first = collection.modes[0];
  if (!first) {
    throw new Error('컬렉션에 모드가 없음 — Figma 파일 상태 확인 필요');
  }
  // 기본 'Mode 1'(또는 남아 있는 옛 'dark')을 light 로 개명한다
  collection.renameMode(first.modeId, 'light');
  return first.modeId;
}

async function syncTokens(payload: TokensPayload): Promise<string[]> {
  if (!payload || typeof payload.collection !== 'string' || !Array.isArray(payload.variables)) {
    throw new Error(
      '토큰 페이로드 형식 오류 — {collection, modes, variables[]} 필요 (generated/tokens/figma-variables.json)',
    );
  }
  const log: string[] = [];

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c) => c.name === payload.collection);
  if (!collection) {
    collection = figma.variables.createVariableCollection(payload.collection);
    log.push(`컬렉션 생성: ${payload.collection}`);
  } else {
    log.push(`기존 컬렉션 사용: ${payload.collection}`);
  }

  const lightModeId = ensureLightMode(collection);

  const allVariables = await figma.variables.getLocalVariablesAsync();
  const byName = new Map<string, Variable>();
  for (const variable of allVariables) {
    if (variable.variableCollectionId === collection.id) {
      byName.set(variable.name, variable);
    }
  }

  let created = 0;
  let updated = 0;
  for (const spec of payload.variables) {
    let variable = byName.get(spec.name);
    if (variable && variable.resolvedType !== spec.type) {
      // 타입이 바뀐 토큰은 재생성 (Figma는 resolvedType 변경 불가)
      log.push(`타입 변경(${variable.resolvedType} → ${spec.type})으로 재생성: ${spec.name}`);
      variable.remove();
      variable = undefined;
    }
    if (!variable) {
      variable = figma.variables.createVariable(spec.name, collection, spec.type);
      created += 1;
    } else {
      updated += 1;
    }
    variable.setValueForMode(lightModeId, toFigmaValue(spec.type, spec.value));
  }

  // 계약(토큰) 목록에 없는 기존 Variable → 삭제하지 않고 경고만 (G7 검수 대상)
  const specNames = new Set(payload.variables.map((v) => v.name));
  const orphans = [...byName.keys()].filter((name) => !specNames.has(name));
  if (orphans.length > 0) {
    log.push(
      `[경고] tokens.json에 없는 Variable ${orphans.length}개: ${orphans.slice(0, 10).join(', ')}${orphans.length > 10 ? ' …' : ''}`,
    );
  }

  log.push(`Variables 동기화 완료 — 생성 ${created} · 갱신 ${updated} (모드: light)`);
  return log;
}

// ---------------------------------------------------------------------------
// (b) Component Set — 계약 → **실제 노드**로 조립
//
// 조립 판단(부위·오토레이아웃·정렬·Variable 바인딩)은 전부 순수 계층(src/spec/**)이 한다.
// 여기서는 그 결정을 Figma 객체로 옮기기만 한다 — 스크린샷 이미지는 일절 쓰지 않는다.
// ---------------------------------------------------------------------------

/**
 * 기능 카테고리 표준 순서 — 페이지도 이 순서로 만든다.
 * 사용자는 '원자/분자'가 아니라 '무엇을 하는 컴포넌트인가'로 찾는다.
 */
const COMPONENT_CATEGORY_ORDER = [
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

async function ensureComponentCategoryPage(category: string): Promise<PageNode> {
  const base = categoryPageBase(category);
  // 식별은 tdsBase 키로 한다 — 문서가 표시명에 '5. ' 같은 순번을 붙여도 다음 실행에 다시 찾는다.
  let page = figma.root.children.find((p) => p.getPluginData('tdsBase') === base);
  if (!page) {
    // 구버전 '📦 Components — X' 페이지가 있으면 **승계**한다(이름만 바꿔 내용 보존) — 지우지 않는다.
    const legacyName = base.replace('🧩', '📦');
    const legacy = figma.root.children.find((p) => p.name === legacyName);
    if (legacy) {
      legacy.name = base;
      page = legacy;
    }
  }
  if (!page) {
    page = figma.createPage();
    page.name = base;
  }
  page.setPluginData('tdsBase', base);
  // tdsDoc 표식은 붙이지 않는다 — 문서 정리(삭제)에 휩쓸리지 않게. 위치/번호만 문서가 관리한다.
  await page.loadAsync();
  return page;
}

/**
 * Variable 의 **해석된 값**을 읽어 이름→값 맵을 만든다.
 *
 * 바인딩할 수 없는 축(line-height 는 배수인데 Figma 는 px 로 해석)을 리터럴로라도 적용하려면
 * 값을 알아야 한다. 페이로드를 새로 받을 필요 없이 파일의 Variable 에서 직접 읽는다.
 * 모드는 첫 번째(light)를 쓴다 — 컬렉션은 라이트 단일 모드다.
 */
function readTokenValues(
  vars: ReadonlyMap<string, Variable>,
  collection: VariableCollection | undefined,
): Map<string, string | number | boolean> {
  const out = new Map<string, string | number | boolean>();
  const modeId = collection?.modes[0]?.modeId;
  if (modeId === undefined) return out;
  for (const [name, variable] of vars) {
    const value = variable.valuesByMode[modeId];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out.set(name, value);
    }
  }
  return out;
}

/** dynamic-page 라 동기 getLocalVariables 는 던진다 — 반드시 async 로 색인한다. */
async function buildVarIndex(collectionName: string): Promise<Map<string, Variable>> {
  const all = await figma.variables.getLocalVariablesAsync();
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = cols.find((c) => c.name === collectionName);
  const idx = new Map<string, Variable>();
  for (const v of all) {
    if (!col || v.variableCollectionId === col.id) idx.set(v.name, v);
  }
  return idx;
}

/**
 * 여러 계약을 한 번에 동기화한다 (UI 의 '전체' 선택).
 * **기능 카테고리별 전용 페이지**에 Component Set 을 만든다 — 사용자가 컴포넌트를 찾는 축이고,
 * 계약이 아직 없는 카테고리도 빈 페이지로 자리를 잡아 23모듈 골격이 Figma 에 그대로 드러난다.
 * 하나가 실패해도 나머지를 계속 진행하고, 실패를 로그에 남긴 뒤 마지막에 집계한다.
 */
async function syncComponents(specs: ComponentFigmaSpec[]): Promise<string[]> {
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error('동기화할 계약이 없습니다 — 산출물을 적재하세요.');
  }
  const log: string[] = [];
  const checkFailures: CheckFailure[] = [];
  let failed = 0;

  await figma.loadAllPagesAsync();

  // Variable 색인 — 토큰 동기화가 선행 조건이다. 없으면 바인딩할 대상이 없어 조립이 무의미하다.
  const vars = await buildVarIndex(TOKEN_COLLECTION);
  if (vars.size === 0) {
    throw new Error(
      `Variable 컬렉션 '${TOKEN_COLLECTION}' 이 비어 있습니다 — 먼저 '토큰 → Variables 동기화'를 실행하세요 (실행 순서: codegen → Variables → Component Set → TDS 문서).`,
    );
  }
  // 텍스트 노드를 만들기 전에 폰트를 반드시 로드해야 한다(미로드면 characters 대입이 throw).
  // 실제로 로드된 폰트를 돌려받아 그것만 쓴다 — 로드 실패를 무시하고 대입하면 그 자리에서 터진다.
  // 이 실행이 쓸 폰트를 **여기서 전부** 로드한다 — 다른 실행의 로드 상태를 물려받지 않는다.
  // 한글·기호 문자가 유발하는 런타임 폴백 폰트까지 미리 잡는다(실제 로그의 Noto Sans Symbols2).
  // 로드 결과를 **통째로** 들고 간다. 예전에는 여기서 .primary 하나만 남기고 나머지를 버려,
  // 어댑터가 '이 굵기로 쓸 수 있는 스타일이 무엇인가'를 물어볼 방법이 없었다 —
  // 타이포 토큰이 걸린 108개 레이어가 전부 Inter Regular 로 태어난 원인이다(타이포 배관).
  const fontSet = await loadAllFonts(log);
  const font = fontSet.primary;
  // 바인딩 불가 축(줄 높이 등)을 해석값으로 적용하기 위해 Variable 값을 읽어 둔다
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const tokenValues = readTokenValues(
    vars,
    collections.find((c) => c.name === TOKEN_COLLECTION),
  );
  log.push(`토큰 색인 ${String(vars.size)}개 — 모든 컴포넌트를 실제 레이어로 조립합니다`);

  // 기능 카테고리로 묶는다(정본 순서 유지 + 빈 카테고리도 페이지 확보)
  const groups = groupByCategory(
    specs.map((spec) => ({
      name: spec.name,
      category:
        typeof spec.category === 'string' && spec.category.length > 0 ? spec.category : 'Utilities',
      spec,
    })),
    COMPONENT_CATEGORY_ORDER,
  );

  const GAP = 80;
  let emptyPages = 0;
  for (const group of groups) {
    const page = await ensureComponentCategoryPage(group.category);
    if (group.items.length === 0) {
      // 빈 슬롯 — 페이지만 자리를 잡아 둔다. 문서(tds-doc)가 '컴포넌트 0개' 안내를 얹는다.
      emptyPages += 1;
      log.push(`── ${group.category} — 0개 (${page.name}) · 빈 슬롯 ──`);
      continue;
    }
    await figma.setCurrentPageAsync(page);
    log.push(`── ${group.category} — ${String(group.items.length)}개 (${page.name}) ──`);
    let x = 0;
    for (const item of group.items) {
      try {
        const node = buildComponent(
          item.spec,
          page,
          vars,
          font,
          log,
          checkFailures,
          tokenValues,
          fontSet,
        );
        if (node) {
          // 기존 셋이 다른 페이지(옛 실행의 잔재)에 있을 수 있다 — 이 카테고리 페이지로 **옮긴다**.
          if (node.parent !== page) page.appendChild(node);
          node.x = x;
          node.y = 0;
          x += node.width + GAP;
        }
      } catch (error) {
        failed += 1;
        log.push(`[오류] ${item.name}: ${errMsg(error)}`);
      }
    }
  }

  // 전부 조립된 뒤에야 accepts 대상이 파일에 존재한다 — 스왑 큐레이션은 여기서 건다
  applySwapPreferredValues(specs, log);

  // 자기 검사 결과를 문서 생성이 읽을 수 있게 파일에 남긴다.
  // (sync-components 와 generate-tds-doc 은 별개 메시지라 메모리를 공유하지 않는다)
  const builtCount = specs.length - failed;
  figma.root.setPluginData(
    'tdsSelfCheck',
    JSON.stringify({
      at: new Date().toISOString(),
      contracts: specs.length,
      built: builtCount,
      buildFailed: failed,
      failures: checkFailures.slice(0, 300),
      failureTotal: checkFailures.length,
    }),
  );

  // 자기 검사 결과 — 실패가 0 이 아니면 산출물은 완료가 아니다
  if (checkFailures.length === 0) {
    log.push('자기 검사 통과 — 텍스트·변형·레이아웃·토큰 바인딩·슬롯 전 항목 이상 없음 (실패 0건)');
  } else {
    log.push(
      `[자기 검사 실패 ${String(checkFailures.length)}건] 아래 항목은 피그마에서 비어 보이거나 어긋납니다:`,
    );
    for (const line of formatFailures(checkFailures).slice(0, 100)) log.push(`  ${line}`);
    if (checkFailures.length > 100) {
      log.push(`  … 외 ${String(checkFailures.length - 100)}건`);
    }
  }

  log.push(
    `Component Set 동기화 완료 — 성공 ${String(specs.length - failed)} · 실패 ${String(failed)} · 카테고리 페이지 ${String(groups.length)}개(빈 슬롯 ${String(emptyPages)}개)`,
  );
  if (failed > 0) {
    log.push('[경고] 실패한 계약은 반영되지 않았습니다 — 위 오류를 해결한 뒤 다시 실행하세요.');
  }
  return log;
}

// ---------------------------------------------------------------------------
// (c) Detached 스타일 스캔 — Variable/Style 미바인딩 raw 값 리포트
// ---------------------------------------------------------------------------

const MAX_REPORT_ENTRIES = 500;

/** SceneNode 유니언 내로잉 대신 구조적 캐스트로 검사 (스캔은 읽기 전용) */
interface StyleScanTarget {
  readonly fills?: unknown;
  readonly strokes?: unknown;
  readonly fillStyleId?: unknown;
  readonly strokeStyleId?: unknown;
  readonly cornerRadius?: unknown;
  readonly boundVariables?: Readonly<Record<string, unknown>>;
}

function hasDetachedSolidPaint(paints: readonly Paint[]): boolean {
  return paints.some(
    (paint) =>
      paint.type === 'SOLID' &&
      paint.visible !== false &&
      !(paint.boundVariables && paint.boundVariables.color),
  );
}

function checkNode(node: SceneNode, pageName: string, out: DetachedEntry[]): void {
  const n = node as unknown as StyleScanTarget;
  const push = (issue: string): void => {
    out.push({ page: pageName, node: node.name, nodeType: node.type, issue });
  };

  // fill: Variable 바인딩도 Style도 없는 SOLID 페인트
  if (Array.isArray(n.fills) && hasDetachedSolidPaint(n.fills as Paint[])) {
    const hasFillStyle = typeof n.fillStyleId === 'string' && n.fillStyleId !== '';
    if (!hasFillStyle) {
      push('fill: Variable/Style 미바인딩 (raw color)');
    }
  }

  // stroke: 동일 기준
  if (Array.isArray(n.strokes) && hasDetachedSolidPaint(n.strokes as Paint[])) {
    const hasStrokeStyle = typeof n.strokeStyleId === 'string' && n.strokeStyleId !== '';
    if (!hasStrokeStyle) {
      push('stroke: Variable/Style 미바인딩 (raw color)');
    }
  }

  // cornerRadius: 숫자 raw 값인데 radius Variable 미바인딩
  if (typeof n.cornerRadius === 'number' && n.cornerRadius > 0) {
    const radiusKeys = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
    const bound =
      n.boundVariables !== undefined &&
      radiusKeys.some(
        (key) => n.boundVariables !== undefined && n.boundVariables[key] !== undefined,
      );
    if (!bound) {
      push(`cornerRadius: ${n.cornerRadius} — radius Variable 미바인딩 (raw px)`);
    }
  }

  // text: Text Style 미적용
  if (node.type === 'TEXT' && typeof node.textStyleId === 'string' && node.textStyleId === '') {
    push('text: Text Style 미적용 (raw typography)');
  }
}

async function scanDetachedStyles(): Promise<{
  log: string[];
  report: DetachedEntry[];
  truncated: boolean;
}> {
  await figma.loadAllPagesAsync();
  const report: DetachedEntry[] = [];
  let truncated = false;
  let scanned = 0;

  for (const page of figma.root.children) {
    for (const node of page.findAll(() => true)) {
      scanned += 1;
      checkNode(node, page.name, report);
      if (report.length >= MAX_REPORT_ENTRIES) {
        truncated = true;
        break;
      }
    }
    if (truncated) {
      break;
    }
  }

  const log = [
    `Detached 스캔 완료 — 노드 ${scanned}개 검사, 위반 ${report.length}건${truncated ? ' (상한 도달, 절단됨)' : ''}`,
    'G7 체크리스트 기준: Variable 바인딩률 100% (Detached style 0) — 위반 0건이어야 통과',
  ];
  return { log, report, truncated };
}

// ---------------------------------------------------------------------------
// 엔트리 — UI 기동 + 메시지 라우팅
// ---------------------------------------------------------------------------

// 460 = 적재 리포트의 '누락 N개: …' 줄이 접히지 않는 최소 폭, 720 = 적재 리포트와
// 첫 액션 카드가 스크롤 없이 함께 보이는 높이.
//
// themeColors 는 <html> 에 figma-dark/figma-light 클래스를 붙인다. 종전에는 ui.html 의
// syncTheme() 이 그것을 data-theme 로 옮겨 토큰 다크 모드를 켰으나, 다크 제거(2026-07-20)로
// 그 브리지와 [data-theme='dark'] 선언이 모두 사라졌다. UI 규칙은 var(--tds-*) 만 쓰므로
// 이 플래그는 현재 우리 스타일에 영향을 주지 않는다 — 값 변경은 실행 확인이 필요해 두었다.
figma.showUI(__html__, { width: 460, height: 720, themeColors: true });

figma.ui.onmessage = async (msg: UiMessage) => {
  try {
    switch (msg.type) {
      case 'sync-tokens': {
        const log = await syncTokens(msg.payload);
        figma.ui.postMessage({ type: 'sync-tokens-result', log });
        figma.notify('Design System Admin Hub: Variables 동기화 완료');
        break;
      }
      case 'sync-components': {
        // 구형(배열)·신형({specs}) 둘 다 받는다 — 실사 참조는 더 이상 존재하지 않는다
        const p = msg.payload;
        const specs = Array.isArray(p) ? p : p.specs;
        const log = await syncComponents(specs);
        figma.ui.postMessage({ type: 'sync-components-result', log });
        figma.notify(`Design System Admin Hub: Component Set 동기화 완료 (${specs.length}개)`);
        break;
      }
      case 'generate-tds-doc': {
        const log = await generateTdsDoc(msg.payload);
        figma.ui.postMessage({ type: 'generate-tds-doc-result', log });
        figma.notify('Design System Admin Hub: TDS 문서 생성 완료');
        break;
      }
      case 'scan-detached': {
        const { log, report, truncated } = await scanDetachedStyles();
        figma.ui.postMessage({ type: 'scan-result', log, report, truncated });
        figma.notify('Design System Admin Hub: Detached 스캔 완료');
        break;
      }
      case 'close': {
        figma.closePlugin();
        break;
      }
      default: {
        figma.ui.postMessage({ type: 'error', message: '알 수 없는 메시지 타입' });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.ui.postMessage({ type: 'error', message });
    figma.notify(`Design System Admin Hub 오류: ${message}`, { error: true });
  }
};
