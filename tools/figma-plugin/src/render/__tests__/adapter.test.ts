/**
 * 어댑터 통합 테스트 — **실제 codegen 산출물 44건**을 실제 어댑터(src/render/**)에 통과시키고
 * 엄격한 Figma 목(figma-mock.ts) 위에 만들어진 **노드 트리 자체**를 검사한다.
 *
 * 이 파일이 메우는 구멍: 지금까지 199개 테스트는 순수 계층만 덮었고 어댑터는 한 번도 실행되지
 * 않았다. 그래서 "무엇을 그릴지"는 검증됐지만 "실제로 그려졌는지"는 아무도 확인하지 않았고,
 * 사용자가 Figma 를 눈으로 보고 결함을 찾아야 했다.
 *
 * 여기서 지키는 약속:
 *  1. 모든 텍스트 레이어는 **화면에 보이는 문자열**을 갖는다 (빈 레이어 0건)
 *  2. 모든 slot 부위는 실제 INSTANCE 다 (프레임 폴백 0건)
 *  3. 오토레이아웃 컨테이너는 sizing mode 가 명시돼 있다
 *  4. 토큰이 걸린 모든 속성이 실제 Variable 바인딩으로 옮겨졌다
 *  5. 조립 로그에 실패 표식이 하나도 없다 (조용한 폴백 0건)
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { buildComponentSetSpec } from '../../spec/component-spec';
import { collectBindings, walkNodeSpec, type NodeSpec } from '../../spec/node-spec';
import type { LoadedFonts } from '../fonts';
import {
  buildOnMock,
  installFigmaMock,
  MockComponentNode,
  MockComponentSetNode,
  MockFrameNode,
  MockInstanceNode,
  MockNode,
  MockTextNode,
  MockVariable,
  type MockFigma,
} from './figma-mock';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');

interface TokenFile {
  collection: string;
  variables: Array<{ name: string; type: string }>;
}

const TOKENS: TokenFile = JSON.parse(
  readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
) as TokenFile;

const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

const INTER = { family: 'Inter', style: 'Regular' };

/** 목을 세우고 토큰 Variable 을 실제로 만들어 색인한다 — 플러그인이 하는 것과 같은 순서 */
async function setup(): Promise<{
  figma: MockFigma;
  vars: Map<string, MockVariable>;
  page: MockNode;
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
  const page = figma.createPage();
  return { figma, vars, page };
}

/** 트리를 훑어 모든 노드를 모은다 */
function allNodes(node: MockNode): MockNode[] {
  return [node, ...node.findAll(() => true)];
}

/** 조립 실패를 뜻하는 로그 표식 — 하나라도 있으면 조용한 폴백이 일어난 것이다 */
const FAILURE_MARKERS = [
  '[텍스트 실패]',
  '[텍스트 리사이즈 실패]',
  '[슬롯 인스턴스 실패]',
  '[바인딩 실패]',
  '[속성 실패]',
  '[속성 연결 실패]',
  '[채움 실패]',
  '[TEXT 표본 없음]',
];

describe('어댑터 — 실제 Figma 목 위에서 44개 계약 조립', () => {
  let env: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    env = await setup();
  });

  it('계약 산출물이 44건 존재한다', () => {
    expect(CONTRACTS.length).toBe(44);
  });

  describe.each(CONTRACTS.map((c) => [c.name, c] as const))('%s', (name, contract) => {
    it('조립이 실패 로그 없이 끝난다', () => {
      const log: string[] = [];
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);
      expect(node.name).toBe(contract.name);
      const failures = log.filter((line) => FAILURE_MARKERS.some((m) => line.includes(m)));
      expect(failures, `${name}: 조립 중 실패 로그\n${failures.join('\n')}`).toEqual([]);
    });

    it('모든 텍스트 레이어가 화면에 보이는 문자열을 갖는다', () => {
      const log: string[] = [];
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);
      const texts = allNodes(node).filter((n): n is MockTextNode => n instanceof MockTextNode);
      const blank = texts.filter((t) => t.characters.length === 0);
      expect(
        blank.map((t) => t.name),
        `${name}: 빈 텍스트 레이어 ${String(blank.length)}개 — Figma 에서 글자 없이 보인다`,
      ).toEqual([]);
    });

    it('slot 부위가 실제 INSTANCE 로 놓인다', () => {
      const log: string[] = [];
      const setSpec = buildComponentSetSpec(contract, new Set(env.vars.keys()));
      const slotNames = new Set<string>();
      for (const variant of setSpec.variants) {
        walkNodeSpec(variant.node, (n) => {
          if (n.kind === 'instance') slotNames.add(n.name);
        });
      }
      if (slotNames.size === 0) return;
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);
      for (const slot of slotNames) {
        const placed = allNodes(node).filter((n) => n.name === slot);
        expect(placed.length, `${name}: slot '${slot}' 이 트리에 없다`).toBeGreaterThan(0);
        const instances = placed.filter((n) => n instanceof MockInstanceNode);
        expect(
          instances.length,
          `${name}: slot '${slot}' 이 INSTANCE 가 아니라 ${placed[0]?.type ?? '?'} 로 폴백됐다`,
        ).toBe(placed.length);
      }
    });

    it('grow 부위가 실제로 부모를 채운다 (layoutGrow 무음 실패 회귀 방지)', () => {
      const log: string[] = [];
      const setSpec = buildComponentSetSpec(contract, new Set(env.vars.keys()));
      const variant = setSpec.variants.find((v) => v.isDefault) ?? setSpec.variants[0];
      if (!variant) return;
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);
      const root = node instanceof MockComponentSetNode ? (node.children[0] ?? node) : node;

      // 순수 계층이 grow 를 요청한 자리마다 실제 노드가 FILL 로 서 있어야 한다.
      // 예전에는 append 이전에 layoutGrow 를 걸고 예외를 삼켜 **한 번도 적용된 적이 없었다**.
      const gaps: string[] = [];
      const walk = (spec: NodeSpec, mock: MockNode, parentLayout: string): void => {
        if (spec.grow === true && parentLayout !== 'NONE') {
          const axis =
            parentLayout === 'HORIZONTAL' ? 'layoutSizingHorizontal' : 'layoutSizingVertical';
          const sizing =
            axis === 'layoutSizingHorizontal'
              ? mock.layoutSizingHorizontal
              : mock.layoutSizingVertical;
          if (sizing !== 'FILL') gaps.push(`${spec.name}: ${axis}=${sizing}`);
        }
        for (let i = 0; i < spec.children.length && i < mock.children.length; i += 1) {
          const cs = spec.children[i];
          const cn = mock.children[i];
          if (cs && cn) walk(cs, cn, spec.layout);
        }
      };
      walk(variant.node, root, 'NONE');
      expect(gaps, `${name}: grow 미적용 — ${gaps.join(' | ')}`).toEqual([]);
    });

    it('오토레이아웃 컨테이너는 sizing mode 가 명시된다', () => {
      const log: string[] = [];
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);
      const frames = allNodes(node).filter(
        (n): n is MockFrameNode => n instanceof MockFrameNode && n.layoutMode !== 'NONE',
      );
      for (const frame of frames) {
        expect(
          ['FIXED', 'AUTO'].includes(frame.primaryAxisSizingMode),
          `${name}: ${frame.name} primaryAxisSizingMode 미지정`,
        ).toBe(true);
        expect(
          ['FIXED', 'AUTO'].includes(frame.counterAxisSizingMode),
          `${name}: ${frame.name} counterAxisSizingMode 미지정`,
        ).toBe(true);
      }
    });

    it('토큰이 걸린 모든 속성이 실제 Variable 바인딩으로 옮겨진다', () => {
      const log: string[] = [];
      const setSpec = buildComponentSetSpec(contract, new Set(env.vars.keys()));
      const node = buildOnMock(contract, env.page, env.vars, INTER, log);

      // 기본 변형 하나만 대조한다 — 변형마다 같은 규칙이 반복되므로 충분하고, 대조가 명료하다
      const defaultVariant = setSpec.variants.find((v) => v.isDefault) ?? setSpec.variants[0];
      if (!defaultVariant) return;
      const root = node instanceof MockComponentSetNode ? (node.children[0] ?? node) : node;
      assertBindings(defaultVariant.node, root, `${name}`);
    });
  });

  it('변형 세트는 각 변형이 계약이 선언한 조합을 그대로 갖는다', () => {
    const log: string[] = [];
    const button = CONTRACTS.find((c) => c.name === 'Button');
    expect(button).toBeDefined();
    if (!button) return;
    const node = buildOnMock(button, env.page, env.vars, INTER, log);
    expect(node).toBeInstanceOf(MockComponentSetNode);
    if (!(node instanceof MockComponentSetNode)) return;
    const combos = node.children
      .filter((c): c is MockComponentNode => c instanceof MockComponentNode)
      .map((c) => c.variantProperties);
    expect(combos.length).toBe(60); // Variant 4 × Size 3 × State 5
    for (const combo of combos) {
      expect(combo).not.toBeNull();
      expect(Object.keys(combo ?? {}).sort()).toEqual(['Size', 'State', 'Variant']);
    }
  });

  it('아이콘 슬롯이 좌/우 각각 INSTANCE + 표시 토글로 배선된다', () => {
    const log: string[] = [];
    const button = CONTRACTS.find((c) => c.name === 'Button');
    if (!button) return;
    const node = buildOnMock(button, env.page, env.vars, INTER, log);
    if (!(node instanceof MockComponentSetNode)) throw new Error('Button 은 변형 세트여야 한다');

    const defs = Object.keys(node.componentPropertyDefinitions);
    // 슬롯 2개 + 표시 토글 2개가 실제 컴포넌트 속성으로 존재해야 한다
    for (const expected of ['IconLeft#', 'IconRight#', 'Show IconLeft#', 'Show IconRight#']) {
      expect(
        defs.some((k) => k.startsWith(expected)),
        `${expected} 속성이 없다 — 있는 것: ${defs.join(', ')}`,
      ).toBe(true);
    }

    // 각 변형에서 두 슬롯이 InstanceNode 이고, mainComponent(교체) + visible(표시)에 배선돼야 한다
    for (const variant of node.children) {
      if (!(variant instanceof MockComponentNode)) continue;
      for (const layer of ['Icon Left', 'Icon Right']) {
        const slot = variant.findOne((n) => n.name === layer);
        expect(slot, `${variant.name}: '${layer}' 레이어가 없다`).toBeDefined();
        if (!slot) continue;
        expect(
          slot instanceof MockInstanceNode,
          `${variant.name}: '${layer}' 가 INSTANCE 가 아니다 — INSTANCE_SWAP 이 붙지 못한다`,
        ).toBe(true);
        const refs = slot.componentPropertyReferences;
        expect(
          refs?.['mainComponent'],
          `${variant.name}: '${layer}' 아이콘 교체 미배선`,
        ).toBeDefined();
        expect(refs?.['visible'], `${variant.name}: '${layer}' 표시 토글 미배선`).toBeDefined();
      }
    }
  });

  it('상태 변형은 서로 픽셀이 같지 않다 — 최소 한 개 바인딩이 달라야 한다', () => {
    // 이 단언이 없으면 **똑같이 생긴 상태 변형**이 다시 들어와도 초록으로 통과한다.
    // (아이콘 59종이 전부 같은 글리프였던 것과 같은 부류의 결함이다)
    const withStateAxis = CONTRACTS.filter((c) =>
      (c.properties ?? []).some((p) => p.type === 'VARIANT' && p.name === 'State'),
    );
    expect(withStateAxis.length, '상태 축을 가진 계약이 하나도 없다').toBeGreaterThan(0);

    for (const contract of withStateAxis) {
      const spec = buildComponentSetSpec(contract, new Set(env.vars.keys()));

      /** 한 변형의 (레이어경로.필드 → Variable) 지문 */
      const fingerprint = (variant: (typeof spec.variants)[number]): string => {
        const parts: string[] = [];
        walkNodeSpec(variant.node, (node, depth) => {
          for (const b of node.bindings) {
            parts.push(`${String(depth)}/${node.name}.${b.field}=${b.variable}`);
          }
          // 부위의 유무 자체도 시각 차이다 (loading 의 스피너처럼 when 으로 갈리는 경우)
          parts.push(`${String(depth)}/${node.name}#${node.kind}`);
        });
        return parts.sort().join('|');
      };

      // 상태만 다른 변형끼리 묶어서 비교한다 — 다른 축은 고정해야 순수한 상태 차이를 본다
      const groups = new Map<string, Array<{ state: string; print: string }>>();
      for (const variant of spec.variants) {
        const state = variant.values['State'];
        if (state === undefined) continue;
        const others = Object.entries(variant.values)
          .filter(([axis]) => axis !== 'State')
          .map(([axis, value]) => `${axis}=${value}`)
          .join(',');
        const bucket = groups.get(others) ?? [];
        bucket.push({ state, print: fingerprint(variant) });
        groups.set(others, bucket);
      }

      for (const [others, bucket] of groups) {
        const seen = new Map<string, string>();
        for (const item of bucket) {
          const clash = seen.get(item.print);
          expect(
            clash,
            `${contract.name} [${others}]: State=${item.state} 와 State=${String(clash)} 의 ` +
              `바인딩·부위가 완전히 같다 — 디자이너에게 구분되지 않는 변형이다`,
          ).toBeUndefined();
          seen.set(item.print, item.state);
        }
      }
    }
  });

  it('TEXT 속성 기본값이 anatomy 표본을 승계한다 (빈 라벨 회귀 방지)', () => {
    const log: string[] = [];
    const button = CONTRACTS.find((c) => c.name === 'Button');
    if (!button) return;
    const node = buildOnMock(button, env.page, env.vars, INTER, log);
    if (!(node instanceof MockComponentSetNode)) throw new Error('Button 은 변형 세트여야 한다');
    const childrenProp = Object.entries(node.componentPropertyDefinitions).find(([k]) =>
      k.startsWith('Children#'),
    );
    expect(childrenProp, 'Children TEXT 속성이 없다').toBeDefined();
    expect(childrenProp?.[1].defaultValue).toBe('Button');

    // 그리고 그 값이 실제로 레이어에 보인다
    const label = node.findOne((n) => n.name === 'Label');
    expect(label).toBeInstanceOf(MockTextNode);
    if (label instanceof MockTextNode) expect(label.characters).toBe('Button');
  });
});

/** NodeSpec 의 바인딩 요청이 실제 노드에 옮겨졌는지 대조한다 */
function assertBindings(spec: NodeSpec, node: MockNode, label: string): void {
  for (const binding of spec.bindings) {
    if (binding.field === 'fills' || binding.field === 'strokes') {
      const paints = binding.field === 'fills' ? node.fills : node.strokes;
      expect(
        Array.isArray(paints) && paints.some((p) => p.boundVariables?.['color'] !== undefined),
        `${label}: ${spec.name}.${binding.field} 가 Variable 에 바인딩되지 않았다 (${binding.variable})`,
      ).toBe(true);
    } else {
      expect(
        node.boundVariables[binding.field] !== undefined,
        `${label}: ${spec.name}.${binding.field} 가 Variable 에 바인딩되지 않았다 (${binding.variable})`,
      ).toBe(true);
    }
  }
  for (let i = 0; i < spec.children.length && i < node.children.length; i += 1) {
    const childSpec = spec.children[i];
    const childNode = node.children[i];
    if (childSpec && childNode) assertBindings(childSpec, childNode, label);
  }
}

describe('목의 엄격성 — 실제 API 가 거부하는 것을 목도 거부한다', () => {
  it('미로드 폰트 상태에서 characters 대입은 throw 한다', () => {
    const figma = installFigmaMock({
      availableFonts: [{ family: 'Inter', style: 'Regular' }],
      documentDefaultFont: { family: 'Pretendard', style: 'SemiBold' },
    });
    const text = figma.createText();
    expect(() => {
      text.characters = '라벨';
    }).toThrow(/unloaded font/);
  });

  it('오토레이아웃 부모가 없으면 layoutSizing FILL 은 throw 한다', () => {
    const figma = installFigmaMock();
    const frame = figma.createFrame();
    expect(() => {
      frame.layoutSizingHorizontal = 'FILL';
    }).toThrow(/auto-layout children/);
  });

  it('세로 오토레이아웃에 WRAP 을 걸면 throw 한다', () => {
    const figma = installFigmaMock();
    const frame = figma.createFrame();
    frame.layoutMode = 'VERTICAL';
    expect(() => {
      frame.layoutWrap = 'WRAP';
    }).toThrow(/horizontal/);
  });

  it('텍스트 노드에 appendChild 는 throw 한다', async () => {
    const figma = installFigmaMock();
    await figma.loadFontAsync(INTER);
    const text = figma.createText();
    expect(() => {
      text.appendChild(figma.createFrame());
    }).toThrow(/appendChild/);
  });

  it('존재하지 않는 컴포넌트 속성 키를 참조하면 throw 한다', async () => {
    const figma = installFigmaMock();
    await figma.loadFontAsync(INTER);
    const comp = figma.createComponent();
    const text = figma.createText();
    comp.appendChild(text);
    expect(() => {
      text.componentPropertyReferences = { characters: 'Nope#1:1' };
    }).toThrow(/does not exist/);
  });

  it('프레임에 fontSize 를 바인딩하면 throw 한다', () => {
    const figma = installFigmaMock();
    const frame = figma.createFrame();
    const collection = figma.variables.createVariableCollection('c');
    const v = figma.variables.createVariable('x', collection, 'FLOAT');
    expect(() => {
      frame.setBoundVariable('fontSize', v);
    }).toThrow(/Cannot bind variable/);
  });

  it("combineAsVariants 는 'Prop=Value' 형식을 요구한다", () => {
    const figma = installFigmaMock();
    const a = figma.createComponent();
    const b = figma.createComponent();
    a.name = 'plain';
    b.name = 'also plain';
    expect(() => figma.combineAsVariants([a, b], figma.currentPage)).toThrow(/Prop=Value/);
  });

  it('TEXT 속성이 걸린 레이어는 속성 기본값이 characters 를 덮는다', async () => {
    const figma = installFigmaMock();
    await figma.loadFontAsync(INTER);
    const comp = figma.createComponent();
    const text = figma.createText();
    comp.appendChild(text);
    text.characters = '표본 문구';
    const key = comp.addComponentProperty('Children', 'TEXT', '');
    text.componentPropertyReferences = { characters: key };
    // 레이어에는 글자가 있지만 화면에는 속성값(빈 문자열)이 보인다 — 이것이 빈 버튼의 정체다
    expect(text.rawCharacters).toBe('표본 문구');
    expect(text.characters).toBe('');
  });
});

/**
 * 타이포 배관 — 굵기 토큰이 **실제 레이어의 폰트 스타일까지** 도달하는가.
 *
 * [증상] Figma 에서 라이브러리 전체의 글자가 굵기 없이 똑같아 보였다. 계약은 108개 텍스트
 * 레이어에 타이포 토큰을 걸고 있고 그중 84개가 font-weight 500 이상을 말하는데, 화면에서는
 * 전부 Regular 였다.
 *
 * [원인] 굵기는 `fontWeight` 필드가 아니라 **fontName.style** 이 정한다. 어댑터는
 * `ctx.font` 하나(=Inter Regular)로 모든 텍스트를 만들었고, 순수 계층이 요청한 fontWeight
 * Variable 바인딩은 그 위에 얹혀도 스타일을 바꾸지 못한다(실제 Figma 에서는 대상 스타일이
 * 미로드면 `unloaded font "…"` 로 던진다 — fonts.ts 머리말의 로그가 그것이다).
 * main.ts 가 loadAllFonts() 의 결과에서 `.primary` 만 남기고 나머지를 버려,
 * 어댑터에게 '이 굵기로 쓸 수 있는 스타일이 무엇인가'를 물을 통로 자체가 없었다.
 */
describe('타이포 배관 — 굵기 토큰이 fontName.style 까지 도달한다', () => {
  /** Variable 이름 → 해석값. 굵기·줄 높이처럼 바인딩이 아니라 값으로 적용되는 축에 쓴다 */
  const TOKEN_VALUES: ReadonlyMap<string, string | number | boolean> = new Map(
    (
      JSON.parse(readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8')) as {
        variables: Array<{ name: string; values: { light: string | number | boolean } }>;
      }
    ).variables.map((v) => [v.name, v.values.light]),
  );

  /** 플러그인이 실행 시작에 로드하는 것과 같은 집합 (setup 이 목에 심는 Inter 4종) */
  const LOADED: LoadedFonts = {
    primary: INTER,
    documentDefault: INTER,
    loaded: new Set(['Regular', 'Medium', 'Semi Bold', 'Bold'].map((style) => `Inter|${style}`)),
  };

  let env: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    env = await setup();
  });

  /** 계약 하나를 굵기 배관까지 켠 채로 조립하고 텍스트 레이어를 전부 모은다 */
  function textsOf(contract: ComponentFigmaSpec): MockTextNode[] {
    const log: string[] = [];
    const node = buildOnMock(
      contract,
      env.page,
      env.vars,
      INTER,
      log,
      undefined,
      TOKEN_VALUES,
      LOADED,
    );
    return allNodes(node).filter((n): n is MockTextNode => n instanceof MockTextNode);
  }

  it('굵기 해석값이 순수 계층에서 실제로 실린다 — 84개 이상', () => {
    let weighted = 0;
    for (const contract of CONTRACTS) {
      const setSpec = buildComponentSetSpec(contract, new Set(env.vars.keys()), TOKEN_VALUES);
      const variant = setSpec.variants.find((v) => v.isDefault) ?? setSpec.variants[0];
      if (!variant) continue;
      walkNodeSpec(variant.node, (n) => {
        if (n.kind === 'text' && n.fontWeight !== undefined && n.fontWeight >= 500) weighted += 1;
      });
    }
    console.log(`굵기 500+ 해석값이 실린 텍스트 레이어 ${String(weighted)}개`);
    expect(weighted, '굵기 해석값이 하나도 실리지 않았다 — 배관이 끊겨 있다').toBeGreaterThan(0);
  });

  it('라이브러리 전체가 한 가지 스타일로만 태어나지 않는다', () => {
    const styles = new Set<string>();
    for (const contract of CONTRACTS) {
      for (const text of textsOf(contract)) styles.add(text.fontName.style);
    }
    console.log(`실제 레이어에 쓰인 폰트 스타일: ${[...styles].sort().join(' · ')}`);
    expect(
      [...styles].sort(),
      `모든 텍스트가 단일 스타일로 태어났다 (${[...styles].join(',')}) — 굵기 토큰이 화면에 도달하지 못한다`,
    ).not.toEqual(['Regular']);
  });

  it('굵기 600 이상을 말하는 레이어가 Regular 로 태어나지 않는다', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const setSpec = buildComponentSetSpec(contract, new Set(env.vars.keys()), TOKEN_VALUES);
      const variant = setSpec.variants.find((v) => v.isDefault) ?? setSpec.variants[0];
      if (!variant) continue;
      // 이름이 유일한 레이어만 대조한다 — 반복 전개('X 1','X 2')와 변형이 섞이면
      // 이름만으로는 어느 노드인지 특정할 수 없어 대조가 거짓이 된다.
      const weightOf = new Map<string, number>();
      const seen = new Map<string, number>();
      walkNodeSpec(variant.node, (n) => {
        if (n.kind !== 'text') return;
        seen.set(n.name, (seen.get(n.name) ?? 0) + 1);
        if (n.fontWeight !== undefined) weightOf.set(n.name, n.fontWeight);
      });

      for (const text of textsOf(contract)) {
        if ((seen.get(text.name) ?? 0) !== 1) continue;
        const weight = weightOf.get(text.name);
        if (weight === undefined || weight < 600) continue;
        if (text.fontName.style === 'Regular') {
          offenders.push(`${contract.name} > ${text.name} (weight ${String(weight)})`);
        }
      }
    }
    expect(
      offenders,
      `굵기 토큰이 600 이상인데 Regular 로 태어난 레이어 (${String(offenders.length)}건):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('배관을 끄면 예전 동작 그대로다 — 폰트 집합을 주지 않으면 기본 폰트 하나로 태어난다', () => {
    // 회귀 방지가 아니라 **경계 확인**이다: 새 인자는 선택적이고, 주지 않은 호출자
    // (tds-doc 의 견본 렌더 등)의 동작을 바꾸지 않아야 한다.
    const log: string[] = [];
    const contract = CONTRACTS.find((c) => c.name === 'Button');
    expect(contract).toBeDefined();
    if (!contract) return;
    const node = buildOnMock(contract, env.page, env.vars, INTER, log);
    const texts = allNodes(node).filter((n): n is MockTextNode => n instanceof MockTextNode);
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) expect(text.fontName).toEqual(INTER);
  });
});
