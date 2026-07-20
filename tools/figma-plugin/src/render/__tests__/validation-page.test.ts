/**
 * 검증 페이지 — **실제로 렌더시켜서** 확인한다.
 *
 * 이 파일이 있는 이유: 앞선 라운드에서 "산출물 상태를 알려주기로 한 페이지"가 정작 한 번도
 * 실행된 적이 없었다. 그대로 아침을 맞으면 사용자는 **비어 있는 검증 페이지**를 열게 되고,
 * 그건 앞서 두 번 겪은 실패와 정확히 같은 실패다.
 *
 * 그래서 여기서는 tds-doc 의 진짜 진입점(generateTdsDoc)을 목 위에서 통째로 태우고,
 * 만들어진 페이지 트리를 직접 읽는다. 특히 **실패 경로**를 반드시 확인한다 —
 * 합격만 그려지고 실패는 안 그려지는 페이지는 항상 초록으로 보이므로 최악이다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { generateTdsDoc, type TdsTokensPayload } from '../../tds-doc';
import {
  buildOnMock,
  installFigmaMock,
  MockFrameNode,
  MockInstanceNode,
  MockNode,
  MockTextNode,
  MockVariable,
  type MockFigma,
} from './figma-mock';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const INTER = { family: 'Inter', style: 'Regular' };

interface SeededFailure {
  component: string;
  check: string;
  node: string;
  reason: string;
}

// 토큰 페이로드는 tds-doc 의 정식 타입을 그대로 쓴다 — 테스트가 실제 진입점과 같은 계약을 지킨다
const TOKENS: TdsTokensPayload = JSON.parse(
  readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
) as TdsTokensPayload;

const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

/** 플러그인이 실제로 하는 순서: 폰트 로드 → Variables → Component Set → 문서 */
async function runPlugin(options: { seedFailures?: SeededFailure[] } = {}): Promise<{
  figma: MockFigma;
  log: string[];
}> {
  const figma = installFigmaMock();
  for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
    await figma.loadFontAsync({ family: 'Inter', style });
  }

  const collection = figma.variables.createVariableCollection(TOKENS.collection);
  const vars = new Map<string, MockVariable>();
  for (const spec of TOKENS.variables) {
    vars.set(spec.name, figma.variables.createVariable(spec.name, collection, spec.type));
  }

  // ② Component Set 조립 + 자기 검사
  const page = figma.createPage();
  const failures: SeededFailure[] = [];
  for (const contract of CONTRACTS) {
    buildOnMock(contract, page, vars, INTER, [], failures);
  }
  // 결함 주입 — 아래 주석 참고
  if (options.seedFailures !== undefined) failures.push(...options.seedFailures);

  // main.ts 가 하는 것과 같은 기록 — 문서 생성이 이걸 읽는다
  figma.root.setPluginData(
    'tdsSelfCheck',
    JSON.stringify({
      at: new Date().toISOString(),
      contracts: CONTRACTS.length,
      built: CONTRACTS.length,
      buildFailed: 0,
      failures: failures.slice(0, 300),
      failureTotal: failures.length,
    }),
  );

  const log = await generateTdsDoc({
    tokens: TOKENS,
    components: CONTRACTS,
  });
  return { figma, log };
}

/** 페이지들을 순서대로 (구분선 포함) */
function pageNames(figma: MockFigma): string[] {
  return figma.root.children.map((p) => p.name);
}

function findPage(figma: MockFigma, needle: string): MockNode | undefined {
  return figma.root.children.find((p) => p.name.includes(needle));
}

/** 이 서브트리의 모든 텍스트를 한 줄로 */
function allText(node: MockNode): string {
  const texts: string[] = [];
  if (node instanceof MockTextNode) texts.push(node.characters);
  for (const child of node.children) texts.push(allText(child));
  return texts.join('\n');
}

describe('검증 페이지 — 실제 렌더', () => {
  describe('통과 경로 (자기 검사 실패 0건)', () => {
    let env: Awaited<ReturnType<typeof runPlugin>>;

    beforeEach(async () => {
      env = await runPlugin();
    });

    it('페이지가 실제로 생성된다', () => {
      const page = findPage(env.figma, 'Validation');
      expect(
        page,
        `Validation 페이지 없음 — 생성된 페이지: ${pageNames(env.figma).join(' | ')}`,
      ).toBeDefined();
    });

    it('문서의 첫 페이지다', () => {
      // 0번은 목이 기본으로 갖는 'Page 1' 이 아니라, 문서가 만든 페이지 중 첫 장을 본다
      const docPages = env.figma.root.children.filter((p) => p.getPluginData('tdsBase').length > 0);
      expect(docPages[0]?.name).toContain('Validation');
    });

    it('배너가 통과를 표시한다', () => {
      const page = findPage(env.figma, 'Validation');
      expect(page).toBeDefined();
      if (!page) return;
      const text = allText(page);
      expect(text).toContain('통과');
      expect(text).toContain('실패 0건');
    });

    it('집계 숫자가 실제 계약 수를 반영한다', () => {
      const page = findPage(env.figma, 'Validation');
      if (!page) return;
      expect(allText(page)).toContain(String(CONTRACTS.length));
    });

    it('견본이 빈 프레임이 아니라 실제 인스턴스다', () => {
      const page = findPage(env.figma, 'Validation');
      expect(page).toBeDefined();
      if (!page) return;
      const instances = page.findAll((n) => n instanceof MockInstanceNode);
      expect(
        instances.length,
        '견본 인스턴스가 하나도 없다 — 검증 페이지가 실물을 보여 주지 못한다',
      ).toBeGreaterThan(0);
    });

    it('견본 인스턴스 안에 실제 글자가 있다', () => {
      const page = findPage(env.figma, 'Validation');
      if (!page) return;
      const instances = page.findAll((n) => n instanceof MockInstanceNode);
      const withText = instances.filter(
        (inst) =>
          inst.findAll((n) => n instanceof MockTextNode && n.characters.length > 0).length > 0,
      );
      expect(
        withText.length,
        '모든 견본 인스턴스가 글자 없이 비어 있다 — 사용자가 본 그 증상이다',
      ).toBeGreaterThan(0);
    });

    it('상태 축 생성/미생성 개수를 이유와 함께 밝힌다', () => {
      const page = findPage(env.figma, 'Validation');
      expect(page).toBeDefined();
      if (!page) return;
      const text = allText(page);
      expect(text).toContain('상태 축 생성');
      expect(text).toContain('Button');
      expect(text).toContain('미생성');
      // 왜 없는지가 적혀 있어야 한다 — 없으면 디자이너가 피그마 앞에서 그 질문을 하게 된다
      expect(text).toContain('픽셀이 같습니다');
    });

    it('고정 폭 사슬이 끊기지 않는다 (폭 불일치·정렬 붕괴 방지)', () => {
      const page = findPage(env.figma, 'Validation');
      expect(page).toBeDefined();
      if (!page) return;
      const root = page.children[0];
      expect(root, '문서 루트 프레임이 없다').toBeDefined();
      if (!(root instanceof MockFrameNode)) return;

      // 사슬의 시작: 루트는 반드시 폭이 FIXED 여야 한다.
      // 여기가 AUTO 면 아래 모든 STRETCH 가 무효가 되어 카드 폭이 제각각이 된다.
      expect(root.counterAxisSizingMode, '루트가 hug 다 — 사슬이 시작되지 않는다').toBe('FIXED');
      expect(root.width).toBeGreaterThan(0);

      // 채우겠다고 선언한(STRETCH) 자식은 **부모의 counter axis 가 FIXED 일 때만** 성립한다
      const broken: string[] = [];
      const walk = (node: MockNode): void => {
        for (const child of node.children) {
          const stretches = child.layoutAlign === 'STRETCH';
          if (
            stretches &&
            node instanceof MockFrameNode &&
            node.counterAxisSizingMode !== 'FIXED'
          ) {
            broken.push(`${node.name} (hug) > ${child.name} (STRETCH)`);
          }
          walk(child);
        }
      };
      walk(root);
      expect(broken, `사슬이 끊긴 지점: ${broken.join(' | ')}`).toEqual([]);
    });

    it('텍스트 레이어가 하나도 비어 있지 않다', () => {
      const page = findPage(env.figma, 'Validation');
      if (!page) return;
      const blanks = page
        .findAll((n) => n instanceof MockTextNode && n.characters.length === 0)
        .map((n) => n.name);
      expect(blanks, `빈 텍스트 레이어: ${blanks.join(', ')}`).toEqual([]);
    });
  });

  describe('실패 경로 (결함 주입)', () => {
    /**
     * [주입 방식에 대한 기록 — 중요]
     * 처음에는 anatomy 의 text 표본을 지워 '빈 라벨' 을 재현하려 했다. 그런데 재현되지 않았다:
     * buildNodeSpec 이 `node.text ?? node.name` 으로 떨어지고 표본 승계도 같은 규칙을 쓰므로,
     * 계약을 어떻게 망가뜨려도 characters 가 비지 않는다. **고친 코드가 실제로 튼튼하다는 뜻**이다.
     *
     * 그래서 자기 검사 결과 레코드에 실패를 직접 심어 **페이지의 실패 경로**를 확인한다.
     * "실패가 실제로 생기는가" 는 별도로 이미 증명돼 있다 — self-check.test.ts 와,
     * 표본 승계를 되돌렸을 때 105건이 잡히던 회귀 실험이 그것이다.
     * 여기서 막으려는 것은 다른 위험이다: **합격만 그려지고 실패는 안 그려지는 페이지.**
     */
    const SEEDED: SeededFailure[] = [
      {
        component: 'Button',
        check: '텍스트',
        node: 'Label',
        reason: 'characters 가 비어 있다 — 피그마에서 글자 없이 보인다',
      },
      {
        component: 'Tabs',
        check: '레이아웃',
        node: 'Tab 1',
        reason: 'grow 선언이 적용되지 않았다 (layoutSizingHorizontal=HUG)',
      },
      {
        component: 'Icon',
        check: '변형',
        node: 'Name=search, Size=md',
        reason: 'variantProperties 가 null — 변형으로 전환되지 않았다',
      },
    ];

    it('실패가 있으면 배너가 실패를 표시하고 항목을 이름으로 적는다', async () => {
      const env = await runPlugin({ seedFailures: SEEDED });
      const page = findPage(env.figma, 'Validation');
      expect(page).toBeDefined();
      if (!page) return;
      const text = allText(page);

      // 배너가 실패로 바뀌어야 한다 — 항상 초록으로 보이면 이 페이지는 쓸모가 없다
      expect(text).not.toContain('통과 — 실패 0건');
      expect(text).toContain(`실패 ${String(SEEDED.length)}건`);
      // 실패 목록이 실제 컴포넌트 이름과 사유를 담아야 한다
      expect(text).toContain('[텍스트] Button › Label');
      expect(text).toContain('characters 가 비어 있다');
      expect(text).toContain('[레이아웃] Tabs › Tab 1');
      expect(text).toContain('[변형] Icon');
    });

    it('항목별 집계가 검사 종류를 모두 센다', async () => {
      const env = await runPlugin({ seedFailures: SEEDED });
      const page = findPage(env.figma, 'Validation');
      if (!page) return;
      const text = allText(page);
      expect(text).toContain('항목별:');
      for (const check of ['텍스트', '레이아웃', '변형']) {
        expect(text, `항목별 집계에 '${check}' 가 없다`).toContain(`${check} 1건`);
      }
    });

    it('통과 배너 문구가 실패 상태에서 절대 나오지 않는다', async () => {
      const env = await runPlugin({ seedFailures: SEEDED });
      const page = findPage(env.figma, 'Validation');
      if (!page) return;
      expect(allText(page)).not.toContain('통과');
    });
  });

  describe('기록 없음 경로', () => {
    it('이전 실행 기록이 없으면 실행 순서를 안내한다', async () => {
      const figma = installFigmaMock();
      for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
        await figma.loadFontAsync({ family: 'Inter', style });
      }
      const collection = figma.variables.createVariableCollection(TOKENS.collection);
      for (const spec of TOKENS.variables) {
        figma.variables.createVariable(spec.name, collection, spec.type);
      }
      // setPluginData 를 하지 않는다 = Component Set 동기화를 아직 안 한 상태
      await generateTdsDoc({ tokens: TOKENS, components: CONTRACTS });

      const page = figma.root.children.find((p) => p.name.includes('Validation'));
      expect(page).toBeDefined();
      if (!page) return;
      const text = allText(page);
      expect(text).toContain('검사 기록 없음');
      expect(text).toContain('Component Set');
    });
  });
});
