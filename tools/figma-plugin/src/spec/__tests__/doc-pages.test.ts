/**
 * 순수 계층 단위 테스트 — 페이지 순서 계획 + 아이콘 세트 추출.
 *
 * 순서는 한 줄만 밀려도 아무도 눈치채지 못한 채 퇴행한다. 그래서 전체 시퀀스를 통째로 못박는다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../component-spec';
import { numberedPages, planDocPages, type DocPagePlanInput } from '../doc-pages';
import { extractIconSet, iconVariantName, ICON_COMPONENT } from '../icons';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

/** tds-doc.ts PAGE_NAMES 와 같은 값 — 이 이름이 곧 멱등 키(tdsBase)다 */
const FOUNDATIONS = {
  validation: '✅ Validation',
  cover: '📕 Cover',
  colors: '🎨 Foundations-Colors',
  typography: 'Aa Typography',
  icon: '✦ Icon',
  spacing: '📐 Spacing·Radius·Shadow',
};

function input(overrides: Partial<DocPagePlanInput> = {}): DocPagePlanInput {
  return {
    foundations: FOUNDATIONS,
    componentBases: ['🧩 Components — Actions', '🧩 Components — Inputs'],
    menuSections: [
      { title: '일반 관리', menuBases: ['📄 사용자 관리', '📄 콘텐츠 관리'] },
      { title: '비즈니스', menuBases: ['📄 상품 관리'] },
    ],
    pagesFallbackBase: '📄 Pages',
    ...overrides,
  };
}

/** 계획을 사람이 읽는 시퀀스로 — 구분선은 '---' 로 표기 */
function sequence(plan: ReturnType<typeof planDocPages>): string[] {
  return plan.map((item) => (item.kind === 'divider' ? '---' : item.base));
}

describe('페이지 순서 계획', () => {
  it('사용자가 지정한 전체 순서를 그대로 만든다', () => {
    expect(sequence(planDocPages(input()))).toEqual([
      '✅ Validation',
      '📕 Cover',
      '🎨 Foundations-Colors',
      'Aa Typography',
      '✦ Icon',
      '📐 Spacing·Radius·Shadow',
      '---',
      '🧩 Components — Actions',
      '🧩 Components — Inputs',
      '---',
      '📄 사용자 관리',
      '📄 콘텐츠 관리',
      '---',
      '📄 상품 관리',
    ]);
  });

  it('아이콘 페이지는 타이포그래피 바로 뒤에 온다', () => {
    const seq = sequence(planDocPages(input()));
    expect(seq.indexOf('✦ Icon')).toBe(seq.indexOf('Aa Typography') + 1);
  });

  it('🧩 Components 바로 앞에 구분선이 있다', () => {
    const seq = sequence(planDocPages(input()));
    const first = seq.findIndex((name) => name.startsWith('🧩 Components'));
    expect(seq[first - 1]).toBe('---');
  });

  it('파운데이션 5장 사이에는 구분선이 없다 — 한 덩어리로 읽혀야 한다', () => {
    const seq = sequence(planDocPages(input()));
    expect(seq.slice(0, 5)).not.toContain('---');
  });

  it('Spacing·Radius·Shadow 는 파운데이션 마지막 장으로 보존된다', () => {
    const seq = sequence(planDocPages(input()));
    expect(seq[5]).toBe('📐 Spacing·Radius·Shadow');
    expect(seq[6]).toBe('---');
  });

  it('화면 섹션마다 앞에 구분선이 하나씩 붙는다', () => {
    const plan = planDocPages(input());
    expect(plan.filter((item) => item.kind === 'divider')).toHaveLength(3); // 컴포넌트 앞 1 + 섹션 2
  });

  it('컴포넌트 페이지가 하나도 없어도 경계 구분선은 남는다', () => {
    const seq = sequence(planDocPages(input({ componentBases: [] })));
    expect(seq).toEqual([
      '✅ Validation',
      '📕 Cover',
      '🎨 Foundations-Colors',
      'Aa Typography',
      '✦ Icon',
      '📐 Spacing·Radius·Shadow',
      '---',
      '---',
      '📄 사용자 관리',
      '📄 콘텐츠 관리',
      '---',
      '📄 상품 관리',
    ]);
  });

  it('화면 메타가 없으면 단일 안내 페이지로 떨어진다', () => {
    const seq = sequence(planDocPages(input({ menuSections: [] })));
    expect(seq.slice(-2)).toEqual(['---', '📄 Pages']);
  });

  it('컴포넌트 카테고리 순서를 입력 그대로 보존한다', () => {
    const bases = ['🧩 Components — Actions', '🧩 Components — Feedback', '🧩 Components — Tables'];
    const seq = sequence(planDocPages(input({ componentBases: bases })));
    expect(seq.filter((n) => n.startsWith('🧩'))).toEqual(bases);
  });

  it('순번은 구분선을 건너뛰고 실제 페이지에만 매겨진다', () => {
    const pages = numberedPages(planDocPages(input()));
    expect(pages).not.toContain('---');
    expect(pages[0]).toBe('✅ Validation');
    expect(pages[1]).toBe('📕 Cover');
    expect(pages[4]).toBe('✦ Icon');
    expect(pages).toHaveLength(11);
  });

  it('멱등 키가 중복되지 않는다 — 같은 키가 둘이면 ensurePage 가 앞 페이지를 지운다', () => {
    const pages = numberedPages(planDocPages(input()));
    expect(new Set(pages).size).toBe(pages.length);
  });
});

describe('아이콘 세트 추출', () => {
  it('계약의 name enum 을 원천으로 삼는다 — 손으로 적은 배열이 아니다', () => {
    const set = extractIconSet(CONTRACTS);
    expect(set).not.toBeNull();
    if (!set) return;

    const contract = CONTRACTS.find((c) => c.name === ICON_COMPONENT);
    const nameProp = contract?.properties?.find((p) => p.prop === 'name');
    expect(set.names).toEqual(nameProp?.values);
    expect(set.names.length).toBeGreaterThan(0);
  });

  it('아이콘마다 정확히 하나의 이름이 있고 중복이 없다', () => {
    const set = extractIconSet(CONTRACTS);
    expect(set).not.toBeNull();
    if (!set) return;
    expect(new Set(set.names).size).toBe(set.names.length);
    for (const name of set.names) expect(name.length).toBeGreaterThan(0);
  });

  it('각 아이콘이 실제 Icon 변형 이름을 가리킨다 — 인스턴스를 찾을 수 있어야 한다', () => {
    const set = extractIconSet(CONTRACTS);
    const contract = CONTRACTS.find((c) => c.name === ICON_COMPONENT);
    expect(set).not.toBeNull();
    expect(contract).toBeDefined();
    if (!set || !contract) return;

    // 실제 조립이 만드는 변형 이름 집합과 대조한다(축 순서·표기가 어긋나면 여기서 잡힌다)
    const axes = (contract.properties ?? []).filter((p) => p.type === 'VARIANT');
    const combos = axes.reduce<string[][]>(
      (acc, axis) =>
        acc.flatMap((c) => (axis.values ?? []).map((v) => [...c, `${axis.name}=${v}`])),
      [[]],
    );
    const realNames = new Set(combos.map((c) => c.join(', ')));
    for (const iconName of set.names) {
      expect(realNames.has(iconVariantName(set, iconName)), iconVariantName(set, iconName)).toBe(
        true,
      );
    }
  });

  it('Icon 계약이 없으면 null 로 물러선다 — 문서 생성을 세우지 않는다', () => {
    expect(extractIconSet(CONTRACTS.filter((c) => c.name !== ICON_COMPONENT))).toBeNull();
  });
});
