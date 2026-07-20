/**
 * 문서 페이지의 **기하** 게이트 — 잘림과 겹침을 구조적으로 막는다.
 *
 * 이 파일이 생긴 이유: 오너가 플러그인을 돌린 화면에서 속성 매트릭스 카드의 `없음`/`있음` 캡션이
 * 카드 바닥에서 잘리고, ConfirmDialog 카드 제목이 윗 내용과 겹쳐 `취소를 그 제할까요?` 로
 * 합성돼 보였다. 그런데 **어떤 테스트도 이걸 볼 수 없었다** — 이유가 둘이다:
 *
 *   ① `componentCard` 경로가 한 번도 실행되지 않았다. 기존 harness 는 컴포넌트를 아무 페이지에나
 *      쌓아 둘 뿐 `tdsBase='🧩 Components — <카테고리>'` 페이지를 만들지 않아, tds-doc 의
 *      adoptComponentCategoryPages 가 빈 배열을 돌려주고 카드 빌더 전체가 건너뛰어졌다.
 *   ② 목의 `resize()` 가 사이징 모드를 바꾸지 않았다. 실제 Figma 는 오토레이아웃 프레임에
 *      resize 를 부르면 두 축을 FIXED 로 만드는데, 목은 width/height 대입만 했다.
 *      그래서 `frame.resize(W, frame.height)` 가 **높이를 기본값 100 에 못박는** 것이
 *      목 위에서는 아무 일도 아닌 것처럼 보였다(plugin-build-rules §10).
 *
 * 둘 다 고친 위에서, 이 파일은 문서 트리 전체를 걸으며 '내용이 프레임보다 큰' 자리를 센다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { categoryPageBase } from '../../spec/catalog';
import { generateTdsDoc, type TdsTokensPayload } from '../../tds-doc';
import {
  buildOnMock,
  installFigmaMock,
  MockFrameNode,
  MockInstanceNode,
  MockNode,
  MockVariable,
  type MockFigma,
} from './figma-mock';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const INTER = { family: 'Inter', style: 'Regular' };

const TOKENS: TdsTokensPayload = JSON.parse(
  readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
) as TdsTokensPayload;

const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

/**
 * 플러그인의 실제 순서를 그대로 태운다 — 다만 ②가 컴포넌트를 **카테고리 페이지에** 올린다
 * (main.ts 의 ensureComponentCategoryPage 와 같은 규칙). 이게 있어야 ③이 카드를 그린다.
 */
async function runPlugin(): Promise<{ figma: MockFigma; log: string[] }> {
  const figma = installFigmaMock();
  for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
    await figma.loadFontAsync({ family: 'Inter', style });
  }

  const collection = figma.variables.createVariableCollection(TOKENS.collection);
  const vars = new Map<string, MockVariable>();
  for (const spec of TOKENS.variables) {
    vars.set(spec.name, figma.variables.createVariable(spec.name, collection, spec.type));
  }

  // ② Component Set — 계약의 category 로 페이지를 갈라 올린다
  const pageByCategory = new Map<string, ReturnType<MockFigma['createPage']>>();
  for (const contract of CONTRACTS) {
    const category =
      typeof contract.category === 'string' && contract.category.length > 0
        ? contract.category
        : 'Utilities';
    let page = pageByCategory.get(category);
    if (!page) {
      page = figma.createPage();
      page.name = categoryPageBase(category);
      page.setPluginData('tdsBase', categoryPageBase(category));
      pageByCategory.set(category, page);
    }
    buildOnMock(contract, page, vars, INTER, []);
  }

  figma.root.setPluginData(
    'tdsSelfCheck',
    JSON.stringify({
      at: new Date().toISOString(),
      contracts: CONTRACTS.length,
      built: CONTRACTS.length,
      buildFailed: 0,
      failures: [],
      failureTotal: 0,
    }),
  );

  const log = await generateTdsDoc({ tokens: TOKENS, components: CONTRACTS });
  return { figma, log };
}

/** 이 노드의 조상 경로 — 결함을 사람이 찾아갈 수 있게 */
function pathOf(node: MockNode): string {
  const parts: string[] = [];
  let cur: MockNode | null = node;
  while (cur !== null && parts.length < 8) {
    parts.unshift(cur.name.length > 0 ? cur.name : cur.type);
    cur = cur.parent;
  }
  return parts.join(' > ');
}

function walk(node: MockNode, visit: (n: MockNode) => void): void {
  visit(node);
  for (const child of node.children) walk(child, visit);
}

/**
 * **문서 프레임만** 걷는다 — Component Set 안쪽은 다른 경로(render/apply.ts)가 계약의
 * fixedWidth/fixedHeight 대로 만든 것이라 '내용보다 작다' 가 곧 결함이 아니다
 * (Checkbox 의 Control 18×18 은 계약이 그렇게 선언한 것이다).
 *
 * [목 충실도] 게다가 목의 노드 기본 높이가 100 이고 line·vector·ellipse 는 그 값을 그대로
 * 들고 있어, Component Set 안에서 재면 **목의 기본값을 재는 꼴**이 된다. 실제 Figma 높이가
 * 아니므로 그 영역은 이 게이트의 사정거리 밖이다 — 거기는 self-check.ts 가 실제 런타임에서 본다.
 */
function walkDocFrames(root: MockNode, visit: (n: MockFrameNode) => void): void {
  const go = (node: MockNode): void => {
    if (node.type === 'COMPONENT_SET' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      return;
    }
    if (node instanceof MockFrameNode) visit(node);
    for (const child of node.children) go(child);
  };
  go(root);
}

/** 문서가 만든 페이지들 (tdsBase 표식이 있는 것) */
function docPages(figma: MockFigma): MockNode[] {
  return figma.root.children.filter((p) => p.getPluginData('tdsBase').length > 0);
}

describe('문서 기하 — 잘림·겹침', () => {
  let env: Awaited<ReturnType<typeof runPlugin>>;

  beforeAll(async () => {
    env = await runPlugin();
  });

  // 이 테스트가 없으면 아래 게이트들이 **빈 트리 위에서 전부 통과**한다.
  // 기존 harness 가 정확히 그 상태였다 — 카드 빌더가 실행되지 않는데 초록이었다.
  it('컴포넌트 카드 경로가 실제로 실행됐다 (게이트가 헛돌지 않는다)', () => {
    let cards = 0;
    for (const page of docPages(env.figma)) {
      walk(page, (n) => {
        if (n.name.startsWith('Component — ')) cards += 1;
      });
    }
    expect(cards, `문서에 컴포넌트 카드가 없다 — 카드 빌더가 실행되지 않았다`).toBeGreaterThan(0);
  });

  // [주 게이트] plugin-build-rules §10. `resize(W, frame.height)` 가 높이를 100 에 못박아
  // 내용이 바닥에서 잘리고, WRAP 다음 줄이 그 위로 겹쳐 앉는다.
  it('오토레이아웃 프레임이 자기 내용을 자르지 않는다', () => {
    const offenders: string[] = [];
    for (const page of docPages(env.figma)) {
      walkDocFrames(page, (n) => {
        if (n.layoutMode === 'NONE') return;
        // 세로 스택의 주축(=높이)이 FIXED 인데 내용이 그보다 크면 바닥에서 잘린다
        const axisMode =
          n.layoutMode === 'VERTICAL' ? n.primaryAxisSizingMode : n.counterAxisSizingMode;
        if (axisMode !== 'FIXED') return;
        const need = n.contentHeight();
        if (need > n.height) {
          offenders.push(
            `${pathOf(n)} — 높이 ${String(n.height)} < 내용 ${String(Math.round(need))}`,
          );
        }
      });
    }
    expect(
      [...new Set(offenders)],
      `내용이 프레임 높이를 넘어 잘린다 (${String(new Set(offenders).size)}건):\n` +
        [...new Set(offenders)].slice(0, 40).join('\n'),
    ).toEqual([]);
  });

  // [겹침] 증상 ②. 세로 스택의 형제는 위에서 아래로 흐르므로, 앞 형제가 배정된 높이를 넘치면
  // 다음 형제와 겹친다. 넘침의 **유일한 원인**은 위 게이트가 보는 '세로 고정 + 내용 초과' 이므로
  // 여기서는 그 조건을 형제 관계에서 한 번 더 못박는다 — 카드가 WRAP 으로 두 줄이 되는
  // ConfirmDialog·Modal 자리가 정확히 이것이었다.
  it('세로 스택의 형제가 다음 형제 자리를 침범하지 않는다', () => {
    const offenders: string[] = [];
    for (const page of docPages(env.figma)) {
      walkDocFrames(page, (n) => {
        if (n.layoutMode !== 'VERTICAL') return;
        for (const child of n.children) {
          if (!(child instanceof MockFrameNode) || child.layoutMode === 'NONE') continue;
          // 시트에 끼워 넣은 실제 Component(Set)은 위 walkDocFrames 와 같은 이유로 사정거리 밖이다
          if (
            child.type === 'COMPONENT_SET' ||
            child.type === 'COMPONENT' ||
            child.type === 'INSTANCE'
          ) {
            continue;
          }
          const axisMode =
            child.layoutMode === 'VERTICAL'
              ? child.primaryAxisSizingMode
              : child.counterAxisSizingMode;
          // AUTO 인 형제는 내용만큼 자라므로 넘칠 수 없다. FIXED 인 형제만 위험하다.
          if (axisMode !== 'FIXED') continue;
          if (child.contentHeight() > child.height) {
            offenders.push(
              `${pathOf(child)} — 배정 ${String(child.height)} < 내용 ${String(Math.round(child.contentHeight()))}`,
            );
          }
        }
      });
    }
    expect(
      [...new Set(offenders)],
      `형제가 다음 형제 자리를 침범한다 (${String(new Set(offenders).size)}건):\n` +
        [...new Set(offenders)].slice(0, 40).join('\n'),
    ).toEqual([]);
  });

  // [고정 크기] 증상 ⑥ — preview stage 는 폭·높이를 모두 고정하고 instanceOf 는 폭만 줄이므로
  // 키 큰 컴포넌트가 아래에서 잘린다. **인스턴스 높이로는 게이트를 만들지 않는다** — 목의
  // 인스턴스 높이는 원본 컴포넌트의 기본값 100 을 물려받은 근사라 실제 Figma 높이가 아니다
  // (그걸로 재면 목의 기본값을 검사하는 꼴이 된다). 대신 '인스턴스를 담는 칸이 세로로 고정인가'
  // 라는 **구조 사실**만 본다 — 이건 목과 무관하게 참이다.
  it('인스턴스를 담는 칸은 세로로 고정되어 있지 않다 (내용만큼 자란다)', () => {
    const offenders: string[] = [];
    for (const page of docPages(env.figma)) {
      walkDocFrames(page, (n) => {
        if (n.layoutMode === 'NONE') return;
        if (!n.children.some((c) => c instanceof MockInstanceNode)) return;
        const axisMode =
          n.layoutMode === 'VERTICAL' ? n.primaryAxisSizingMode : n.counterAxisSizingMode;
        if (axisMode === 'FIXED') offenders.push(pathOf(n));
      });
    }
    expect(
      [...new Set(offenders)],
      `인스턴스를 담는 칸이 세로 고정이라 잘린다 (${String(new Set(offenders).size)}건):\n` +
        [...new Set(offenders)].slice(0, 40).join('\n'),
    ).toEqual([]);
  });
});
